import pandas as pd

# 1. Load PaySim dataset
df = pd.read_csv("data/paysim.csv")

print("Full dataset shape:", df.shape)
print("\nFraud distribution:")
print(df["isFraud"].value_counts())

# 2. Keep ALL fraud transactions
fraud_df = df[df["isFraud"] == 1]

# 3. Sample genuine transactions
# Target: approximately 100,000 total rows
target_size = 100000
genuine_needed = target_size - len(fraud_df)

genuine_df = (
    df[df["isFraud"] == 0]
    .sample(n=genuine_needed, random_state=42)
)

# 4. Combine + shuffle
df_sample = pd.concat(
    [fraud_df, genuine_df],
    ignore_index=True
)

df_sample = df_sample.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

print("\nWorking dataset shape:", df_sample.shape)

print("\nWorking dataset fraud distribution:")
print(df_sample["isFraud"].value_counts())

print("\nFraud percentage:")
print(df_sample["isFraud"].value_counts(normalize=True) * 100)

# 5. Feature engineering

# Sender balance change
df_sample["balanceDiffOrig"] = (
    df_sample["oldbalanceOrg"]
    - df_sample["newbalanceOrig"]
)

# Receiver balance change
df_sample["balanceDiffDest"] = (
    df_sample["newbalanceDest"]
    - df_sample["oldbalanceDest"]
)

# Balance inconsistencies
df_sample["errorBalanceOrig"] = (
    df_sample["newbalanceOrig"]
    + df_sample["amount"]
    - df_sample["oldbalanceOrg"]
)

df_sample["errorBalanceDest"] = (
    df_sample["oldbalanceDest"]
    + df_sample["amount"]
    - df_sample["newbalanceDest"]
)

# Zero-balance indicators
df_sample["origBalanceZero"] = (
    df_sample["newbalanceOrig"] == 0
).astype(int)

df_sample["destBalanceZero"] = (
    df_sample["oldbalanceDest"] == 0
).astype(int)

# 6. One-hot encode transaction type
df_sample = pd.get_dummies(
    df_sample,
    columns=["type"],
    prefix="type",
    dtype=int
)

# 7. Save processed dataset
df_sample.to_csv(
    "data/paysim_processed.csv",
    index=False
)

print("\nSaved successfully: data/paysim_processed.csv")
print("\nFinal columns:")
print(df_sample.columns.tolist())