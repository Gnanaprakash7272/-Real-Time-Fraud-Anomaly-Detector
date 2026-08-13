import os
import json
import joblib
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.ensemble import (
    IsolationForest,
    GradientBoostingClassifier
)
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    ConfusionMatrixDisplay
)


# ============================================================
# 1. LOAD PROCESSED PAYSIM DATASET
# ============================================================

df = pd.read_csv(
    "data/paysim_processed.csv"
)

print(
    "Dataset shape:",
    df.shape
)


# ============================================================
# 2. SELECT MODEL FEATURES
# ============================================================

# Remove IDs, target label,
# and PaySim's existing fraud flag.

exclude_cols = [
    "nameOrig",
    "nameDest",
    "isFraud",
    "isFlaggedFraud",
    "step",
    "errorBalanceOrig",
    "errorBalanceDest"
]

feature_cols = [
    col
    for col in df.columns
    if col not in exclude_cols
]

X = df[feature_cols]

y = df["isFraud"]


print(
    "Number of features:",
    len(feature_cols)
)

print(
    "Features:",
    feature_cols
)


# ============================================================
# 3. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print(
    "\nTraining rows:",
    len(X_train)
)

print(
    "Testing rows:",
    len(X_test)
)


# ============================================================
# 4. MODEL 1: ISOLATION FOREST
# ============================================================

print(
    "\nTraining Isolation Forest..."
)


iso_forest = IsolationForest(
    n_estimators=100,
    contamination="auto",
    random_state=42,
    n_jobs=-1
)


# Unsupervised model:
# train only on features,
# not fraud labels.

iso_forest.fit(
    X_train
)


print(
    "Isolation Forest training completed."
)


# ============================================================
# 5. MODEL 2: GRADIENT BOOSTING
# ============================================================

print(
    "\nTraining Gradient Boosting..."
)


gb_model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)


gb_model.fit(
    X_train,
    y_train
)


print(
    "Gradient Boosting training completed."
)


# ============================================================
# 6. EVALUATE GRADIENT BOOSTING
# ============================================================

y_pred = gb_model.predict(
    X_test
)


# ------------------------------------------------------------
# REAL FRAUD-CLASS METRICS
#
# Positive class:
# isFraud = 1
# ------------------------------------------------------------

precision = precision_score(
    y_test,
    y_pred,
    pos_label=1,
    zero_division=0
)


recall = recall_score(
    y_test,
    y_pred,
    pos_label=1,
    zero_division=0
)


f1 = f1_score(
    y_test,
    y_pred,
    pos_label=1,
    zero_division=0
)


# ============================================================
# 7. PRINT MODEL EVALUATION RESULTS
# ============================================================

print(
    "\n=== Gradient Boosting Results ==="
)


print(
    f"\nFraud Precision: "
    f"{precision:.4f} "
    f"({precision * 100:.2f}%)"
)


print(
    f"Fraud Recall: "
    f"{recall:.4f} "
    f"({recall * 100:.2f}%)"
)


print(
    f"Fraud F1 Score: "
    f"{f1:.4f} "
    f"({f1 * 100:.2f}%)"
)


print(
    "\nClassification Report:"
)


print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# 8. CONFUSION MATRIX
# ============================================================

conf_matrix = confusion_matrix(
    y_test,
    y_pred
)


print(
    "Confusion Matrix:"
)

print(
    conf_matrix
)


# Extract individual values

tn, fp, fn, tp = conf_matrix.ravel()


print(
    "\nConfusion Matrix Details:"
)

print(
    "True Negatives :",
    int(tn)
)

print(
    "False Positives:",
    int(fp)
)

print(
    "False Negatives:",
    int(fn)
)

print(
    "True Positives :",
    int(tp)
)


# ============================================================
# 9. CREATE MODELS DIRECTORY
# ============================================================

os.makedirs(
    "models",
    exist_ok=True
)


# ============================================================
# 10. CREATE CONFUSION MATRIX IMAGE
# ============================================================

print(
    "\nGenerating confusion matrix image..."
)


disp = ConfusionMatrixDisplay(
    confusion_matrix=conf_matrix,
    display_labels=[
        "Legitimate",
        "Fraud"
    ]
)


disp.plot(
    values_format="d"
)


plt.title(
    "Gradient Boosting - Fraud Detection Confusion Matrix"
)


plt.xlabel(
    "Predicted Label"
)


plt.ylabel(
    "Actual Label"
)


plt.tight_layout()


# Save high-resolution image
# suitable for PPT / project report.

confusion_matrix_file = (
    "models/confusion_matrix.png"
)


plt.savefig(
    confusion_matrix_file,
    dpi=300,
    bbox_inches="tight"
)
plt.close()

print(
    "Confusion matrix image saved successfully!"
)


# ============================================================
# 11. SAVE REAL MODEL EVALUATION METRICS
# ============================================================

evaluation_metrics = {

    # --------------------------------------------------------
    # Fraud-class metrics
    # --------------------------------------------------------

    "precision": round(
        float(precision),
        4
    ),

    "recall": round(
        float(recall),
        4
    ),

    "f1Score": round(
        float(f1),
        4
    ),


    # --------------------------------------------------------
    # Percentage versions
    # useful for dashboard / API / PPT
    # --------------------------------------------------------

    "precisionPercent": round(
        float(
            precision * 100
        ),
        2
    ),

    "recallPercent": round(
        float(
            recall * 100
        ),
        2
    ),

    "f1ScorePercent": round(
        float(
            f1 * 100
        ),
        2
    ),


    # --------------------------------------------------------
    # Evaluation dataset information
    # --------------------------------------------------------

    "testSamples": int(
        len(y_test)
    ),

    "fraudSamples": int(
        (y_test == 1).sum()
    ),

    "legitimateSamples": int(
        (y_test == 0).sum()
    ),


    # --------------------------------------------------------
    # Confusion matrix values
    # --------------------------------------------------------

    "truePositives": int(
        tp
    ),

    "trueNegatives": int(
        tn
    ),

    "falsePositives": int(
        fp
    ),

    "falseNegatives": int(
        fn
    )
}


# ============================================================
# 12. SAVE EVALUATION METRICS JSON
# ============================================================

metrics_file = (
    "models/evaluation_metrics.json"
)


with open(
    metrics_file,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        evaluation_metrics,
        f,
        indent=4
    )


print(
    "\nEvaluation metrics saved successfully!"
)


print(
    json.dumps(
        evaluation_metrics,
        indent=4
    )
)


# ============================================================
# 13. SAVE TRAINED MODELS
# ============================================================

joblib.dump(
    iso_forest,
    "models/isolation_forest.pkl"
)


joblib.dump(
    gb_model,
    "models/gradient_boost.pkl"
)


joblib.dump(
    feature_cols,
    "models/feature_cols.pkl"
)


# ============================================================
# 14. FINAL OUTPUT
# ============================================================

print(
    "\n=========================================="
)

print(
    "TRAINING + EVALUATION COMPLETED"
)

print(
    "=========================================="
)


print(
    "\nModels saved successfully!"
)


print(
    "models/isolation_forest.pkl"
)

print(
    "models/gradient_boost.pkl"
)

print(
    "models/feature_cols.pkl"
)


print(
    "\nEvaluation artifacts:"
)

print(
    "models/evaluation_metrics.json"
)

print(
    "models/confusion_matrix.png"
)


print(
    "\n=========================================="
)