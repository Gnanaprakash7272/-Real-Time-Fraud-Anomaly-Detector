"""
train_autoencoder.py
====================
Trains a PyTorch Autoencoder on the SAME feature_cols
used by gradient_boost.pkl and isolation_forest.pkl.

Saves:  ml-service/models/autoencoder.pt

Run from the ml-service directory:
    python train_autoencoder.py
"""

import os
import joblib
import numpy as np
import pandas as pd

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# ──────────────────────────────────────────────────────────────
# PATHS  (run from ml-service/)
# ──────────────────────────────────────────────────────────────
DATA_CSV      = "data/paysim_processed.csv"
FEATURE_COLS  = "models/feature_cols.pkl"
OUTPUT_MODEL  = "models/autoencoder.pt"

# ──────────────────────────────────────────────────────────────
# 1. LOAD DATA + FEATURE COLUMNS
# ──────────────────────────────────────────────────────────────
print("Loading data...")
df = pd.read_csv(DATA_CSV)

feature_cols = joblib.load(FEATURE_COLS)
print(f"Feature columns ({len(feature_cols)}): {feature_cols}")

X_all = df[feature_cols].values.astype(np.float32)
y_all = df["isFraud"].values

# Train only on LEGITIMATE transactions so the autoencoder
# learns the normal pattern — MSE spikes on fraud
X_legit = X_all[y_all == 0]
print(f"Legitimate samples for training: {len(X_legit):,}")

# ──────────────────────────────────────────────────────────────
# 2. NORMALISE (min-max per feature, fit on legit only)
# ──────────────────────────────────────────────────────────────
feat_min = X_legit.min(axis=0)
feat_max = X_legit.max(axis=0)
feat_range = np.where(feat_max - feat_min == 0, 1.0, feat_max - feat_min)

X_legit_norm = (X_legit - feat_min) / feat_range

# Save normalisation params alongside model so scoring can use them
scaler_params = {"min": feat_min.tolist(), "range": feat_range.tolist()}

n_features = X_legit_norm.shape[1]
print(f"Input size: {n_features}")

# ──────────────────────────────────────────────────────────────
# 3. DATALOADER
# ──────────────────────────────────────────────────────────────
BATCH_SIZE = 512
EPOCHS     = 30
LR         = 1e-3

tensor_X = torch.tensor(X_legit_norm, dtype=torch.float32)
dataset  = TensorDataset(tensor_X, tensor_X)   # input = target (reconstruction)
loader   = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# ──────────────────────────────────────────────────────────────
# 4. AUTOENCODER ARCHITECTURE
# ──────────────────────────────────────────────────────────────
class FraudAutoencoder(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        # Encoder: input → 16 → 8 → 4 (bottleneck)
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 4),
            nn.ReLU()
        )
        # Decoder: 4 → 8 → 16 → input
        self.decoder = nn.Sequential(
            nn.Linear(4, 8),
            nn.ReLU(),
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, input_dim),
            nn.Sigmoid()   # output in [0,1] — matches normalised input
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))


model     = FraudAutoencoder(input_dim=n_features)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LR)

# ──────────────────────────────────────────────────────────────
# 5. TRAIN
# ──────────────────────────────────────────────────────────────
print(f"\nTraining autoencoder for {EPOCHS} epochs...")
model.train()
for epoch in range(1, EPOCHS + 1):
    epoch_loss = 0.0
    for batch_x, batch_y in loader:
        optimizer.zero_grad()
        out  = model(batch_x)
        loss = criterion(out, batch_y)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item() * len(batch_x)
    avg_loss = epoch_loss / len(X_legit_norm)
    if epoch % 5 == 0 or epoch == 1:
        print(f"  Epoch {epoch:3d}/{EPOCHS}  |  MSE Loss: {avg_loss:.6f}")

# ──────────────────────────────────────────────────────────────
# 6. VALIDATE — compare legit vs fraud reconstruction error
# ──────────────────────────────────────────────────────────────
print("\nValidating reconstruction error...")

model.eval()
with torch.no_grad():
    # Legit sample
    X_legit_sample  = torch.tensor(X_legit_norm[:5000], dtype=torch.float32)
    legit_out        = model(X_legit_sample)
    legit_mse_vals   = ((X_legit_sample - legit_out) ** 2).mean(dim=1).numpy()

    # Fraud sample (normalised with same params)
    X_fraud          = X_all[y_all == 1]
    X_fraud_norm     = (X_fraud - feat_min) / feat_range
    X_fraud_norm     = np.clip(X_fraud_norm, 0, 1).astype(np.float32)
    n_fraud_sample   = min(5000, len(X_fraud_norm))
    X_fraud_tensor   = torch.tensor(X_fraud_norm[:n_fraud_sample], dtype=torch.float32)
    fraud_out        = model(X_fraud_tensor)
    fraud_mse_vals   = ((X_fraud_tensor - fraud_out) ** 2).mean(dim=1).numpy()

print(f"  Legit  MSE  → mean: {legit_mse_vals.mean():.6f}  |  p95: {np.percentile(legit_mse_vals, 95):.6f}")
print(f"  Fraud  MSE  → mean: {fraud_mse_vals.mean():.6f}  |  p95: {np.percentile(fraud_mse_vals, 95):.6f}")

# Pick threshold at 95th percentile of legit — this becomes our HIGH boundary
threshold = float(np.percentile(legit_mse_vals, 95))
print(f"\n  Recommended AE threshold (p95 legit): {threshold:.6f}")
print(f"  (Current hardcoded threshold in main.py: 0.05)")

# ──────────────────────────────────────────────────────────────
# 7. SAVE
#    We store the model + scaler params + threshold together
#    using torch.save so main.py can load it cleanly
# ──────────────────────────────────────────────────────────────
save_dict = {
    "model_state": model.state_dict(),
    "input_dim":   n_features,
    "feat_min":    feat_min.tolist(),
    "feat_range":  feat_range.tolist(),
    "threshold":   threshold
}

os.makedirs("models", exist_ok=True)
torch.save(save_dict, OUTPUT_MODEL)
print(f"\nAutoencoder saved → {OUTPUT_MODEL}")
print("Done!")
