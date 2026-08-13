import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional

def score_ensemble(
    X_df: pd.DataFrame, 
    gb_model: Any, 
    iso_forest: Any, 
    autoencoder: Any = None,
    ae_scaler: Optional[Dict] = None
) -> Tuple[float, float, bool, float, float, str]:
    """
    Computes ensemble fraud anomaly scores:
    1. Gradient Boosting Probability (0.0 to 1.0)
    2. Isolation Forest Decision Score & Anomaly Flag (-1 is anomaly)
    3. PyTorch Autoencoder Reconstruction Loss (MSE)
    4. Blended Risk Score & Level Classification
    """

    # 1. Gradient Boosting probability
    gb_prob = float(gb_model.predict_proba(X_df)[0][1])

    # 2. Isolation Forest
    iso_decision_score = float(iso_forest.decision_function(X_df)[0])
    iso_prediction = int(iso_forest.predict(X_df)[0])
    is_iso_anomaly = (iso_prediction == -1)

    # 3. Autoencoder Reconstruction Loss (if model available)
    ae_mse = 0.0
    ae_threshold = 0.05   # fallback if no scaler

    if autoencoder is not None:
        try:
            import torch
            raw_values = X_df.values.astype(np.float32)

            # Normalize using scaler params stored with the model
            if ae_scaler is not None:
                feat_min   = ae_scaler["min"]
                feat_range = ae_scaler["range"]
                ae_threshold = ae_scaler.get("threshold", 0.05)
                normalized = (raw_values - feat_min) / feat_range
                normalized = np.clip(normalized, 0.0, 1.0).astype(np.float32)
            else:
                # No scaler — pass raw (legacy model path)
                normalized = raw_values

            values = torch.tensor(normalized, dtype=torch.float32)
            autoencoder.eval()
            with torch.no_grad():
                reconstructed = autoencoder(values)
                loss = torch.mean((values - reconstructed) ** 2, dim=1).item()
                ae_mse = float(loss)
        except Exception:
            ae_mse = 0.0

    # 4. Ensemble Score Blending Logic
    # Iso Forest score is typically between -0.3 and 0.3. Normalize to 0-1 risk component.
    iso_risk = float(np.clip((0.2 - iso_decision_score) * 2.0, 0.0, 1.0))
    ae_risk = float(np.clip(ae_mse / max(ae_threshold, 1e-6), 0.0, 1.0))

    # Weighting: 60% Gradient Boost + 25% Isolation Forest + 15% Autoencoder MSE
    if autoencoder is not None and ae_mse > 0:
        blended_score = (0.60 * gb_prob) + (0.25 * iso_risk) + (0.15 * ae_risk)
    else:
        blended_score = (0.70 * gb_prob) + (0.30 * iso_risk)

    blended_score = float(np.clip(blended_score, 0.0, 1.0))

    if blended_score > 0.70 or (gb_prob > 0.85):
        risk_level = "CRITICAL"
    elif blended_score > 0.40 or is_iso_anomaly:
        risk_level = "HIGH"
    elif blended_score > 0.20:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return gb_prob, iso_decision_score, is_iso_anomaly, ae_mse, blended_score, risk_level
