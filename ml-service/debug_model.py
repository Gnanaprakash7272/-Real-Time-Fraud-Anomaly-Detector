import pandas as pd
import joblib

df = pd.read_csv("data/paysim_processed.csv")

gb_model = joblib.load("models/gradient_boost.pkl")
feature_cols = joblib.load("models/feature_cols.pkl")

# Find fraud rows with amount close to 181
fraud_rows = df[
    (df["isFraud"] == 1) &
    (df["amount"].between(180, 182))
]

print("Matching fraud rows:", len(fraud_rows))

if len(fraud_rows) > 0:
    row = fraud_rows.iloc[[0]]

    print("\nOriginal transaction:")
    print(row[
        [
            "amount",
            "oldbalanceOrg",
            "newbalanceOrig",
            "oldbalanceDest",
            "newbalanceDest",
            "isFraud"
        ]
    ])

    probability = gb_model.predict_proba(
        row[feature_cols]
    )[0][1]

    print("\nDirect model fraud probability:")
    print(probability)

print("\n=== FEATURE IMPORTANCE ===")

importance = sorted(
    zip(feature_cols, gb_model.feature_importances_),
    key=lambda x: x[1],
    reverse=True
)

for feature, score in importance:
    print(f"{feature:25s} {score:.4f}")