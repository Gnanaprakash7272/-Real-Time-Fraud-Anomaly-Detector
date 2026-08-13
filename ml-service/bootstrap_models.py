"""
Fast bootstrap trainer for demo/dev when full train_model.py is too slow.
Trains GB + Isolation Forest on a stratified sample and writes model artifacts.
"""
import json
import os
import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(ROOT, "data", "paysim_processed.csv")
MODELS_DIR = os.path.join(ROOT, "models")
SAMPLE_SIZE = 25000


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = pd.read_csv(DATA_PATH)
    if len(df) > SAMPLE_SIZE:
        fraud = df[df["isFraud"] == 1]
        legit = df[df["isFraud"] == 0]
        n_fraud = min(len(fraud), max(500, SAMPLE_SIZE // 10))
        n_legit = min(len(legit), SAMPLE_SIZE - n_fraud)
        df = pd.concat([
            fraud.sample(n=n_fraud, random_state=42),
            legit.sample(n=n_legit, random_state=42),
        ], ignore_index=True)

    exclude_cols = {
        "nameOrig", "nameDest", "isFraud", "isFlaggedFraud", "step",
        "errorBalanceOrig", "errorBalanceDest",
    }
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    X = df[feature_cols]
    y = df["isFraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    iso = IsolationForest(n_estimators=50, contamination="auto", random_state=42, n_jobs=-1)
    iso.fit(X_train)

    gb = GradientBoostingClassifier(n_estimators=50, learning_rate=0.1, max_depth=3, random_state=42)
    gb.fit(X_train, y_train)

    y_pred = gb.predict(X_test)
    metrics = {
        "precision": round(float(precision_score(y_test, y_pred, pos_label=1, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, pos_label=1, zero_division=0)), 4),
        "f1Score": round(float(f1_score(y_test, y_pred, pos_label=1, zero_division=0)), 4),
        "precisionPercent": round(float(precision_score(y_test, y_pred, pos_label=1, zero_division=0)) * 100, 2),
        "recallPercent": round(float(recall_score(y_test, y_pred, pos_label=1, zero_division=0)) * 100, 2),
        "f1ScorePercent": round(float(f1_score(y_test, y_pred, pos_label=1, zero_division=0)) * 100, 2),
        "testSamples": int(len(y_test)),
        "fraudSamples": int(y_test.sum()),
        "legitimateSamples": int(len(y_test) - y_test.sum()),
        "truePositives": int(((y_pred == 1) & (y_test == 1)).sum()),
        "trueNegatives": int(((y_pred == 0) & (y_test == 0)).sum()),
        "falsePositives": int(((y_pred == 1) & (y_test == 0)).sum()),
        "falseNegatives": int(((y_pred == 0) & (y_test == 1)).sum()),
    }

    joblib.dump(gb, os.path.join(MODELS_DIR, "gradient_boost.pkl"))
    joblib.dump(gb, os.path.join(MODELS_DIR, "gb_model.pkl"))
    joblib.dump(iso, os.path.join(MODELS_DIR, "isolation_forest.pkl"))
    joblib.dump(feature_cols, os.path.join(MODELS_DIR, "feature_cols.pkl"))

    with open(os.path.join(MODELS_DIR, "evaluation_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Bootstrap models saved to {MODELS_DIR} ({len(df)} training rows sampled)")


if __name__ == "__main__":
    main()
