import numpy as np
import pandas as pd
import shap
from typing import List, Dict, Tuple, Any


def generate_rule_reasons(
    df_features: pd.DataFrame,
    raw_txn: Dict[str, Any]
) -> List[str]:
    """
    Generates deterministic rule-based explainability reasons
    for suspicious transactions.
    """

    reasons = []

    amount = float(raw_txn.get("amount", 0.0))
    old_org = float(raw_txn.get("oldbalanceOrg", 0.0))
    new_orig = float(raw_txn.get("newbalanceOrig", 0.0))
    old_dest = float(raw_txn.get("oldbalanceDest", 0.0))
    new_dest = float(raw_txn.get("newbalanceDest", 0.0))
    txn_type = str(raw_txn.get("type", "")).upper()

    # Rules mainly applicable to TRANSFER / CASH_OUT
    if txn_type in ["TRANSFER", "CASH_OUT"]:

        # Origin account completely drained
        if old_org > 0 and new_orig == 0:
            reasons.append(
                "Entire origin account balance drained to zero."
            )

        # Very large transaction
        if amount > 500000:
            reasons.append(
                f"High-value transfer exceeding "
                f"\u20b9500,000 threshold ("
                f"\u20b9{amount:,.2f})."
            )

        # Suspicious destination balance behaviour
        if old_dest == 0 and new_dest == 0:
            reasons.append(
                "Destination account had zero initial and ending "
                "balance during high amount transfer."
            )

        # Destination balance does not match transferred amount
        if (
            abs(amount - (new_dest - old_dest)) > 1000
            and old_dest > 0
        ):
            reasons.append(
                "Discrepancy detected between transfer amount "
                "and destination balance update."
            )

    # Extremely large transaction
    if amount > 2000000:
        reasons.append(
            f"Unusually large transaction amount: "
            f"\u20b9{amount:,.2f}."
        )

    # No rule-based anomaly found
    if not reasons:
        reasons.append(
            "Transaction behavioral features align with "
            "typical operational distribution."
        )

    return reasons


import numpy as np
import pandas as pd
import shap
from typing import List, Dict, Tuple, Any, Optional

_shap_explainer: Optional[Any] = None
_shap_model_id: Optional[int] = None


def init_shap_explainer(gb_model) -> None:
    """Create SHAP TreeExplainer once at startup."""
    global _shap_explainer, _shap_model_id
    _shap_explainer = shap.TreeExplainer(gb_model)
    _shap_model_id = id(gb_model)


def compute_shap_explanations(
    gb_model,
    df_features: pd.DataFrame
) -> Tuple[Dict[str, float], List[str]]:
    """
    Computes genuine transaction-level SHAP values for the
    Gradient Boosting model.
    """

    try:
        global _shap_explainer, _shap_model_id
        if _shap_explainer is None or _shap_model_id != id(gb_model):
            init_shap_explainer(gb_model)

        explainer = _shap_explainer

        # Calculate SHAP values for this transaction
        shap_values = explainer.shap_values(df_features)

        # Convert SHAP output into numpy array.
        #
        # Different SHAP/model versions may return slightly
        # different shapes, so handle common formats.
        if isinstance(shap_values, list):

            # For classifiers that return one array per class,
            # use the positive/fraud class.
            values = np.asarray(shap_values[-1])[0]

        else:

            values = np.asarray(shap_values)

            # Common shape:
            # (number_of_rows, number_of_features)
            if values.ndim == 2:
                values = values[0]

            # Some classifier explainers can return:
            # (rows, features, classes)
            elif values.ndim == 3:
                values = values[0, :, -1]

        values = np.asarray(values).flatten()

        feature_names = list(df_features.columns)

        # Safety check
        if len(values) != len(feature_names):
            raise ValueError(
                "SHAP feature count mismatch: "
                f"{len(values)} SHAP values for "
                f"{len(feature_names)} features"
            )

        # Store transaction-specific SHAP values
        feature_impact = {
            feature: float(value)
            for feature, value in zip(feature_names, values)
        }

        # Rank features by absolute impact.
        #
        # Important:
        # We preserve the original sign because:
        #   + value = increases fraud prediction
        #   - value = decreases fraud prediction
        sorted_features = sorted(
            feature_impact.items(),
            key=lambda item: abs(item[1]),
            reverse=True
        )

        # Keep only top 5 features for frontend/dashboard
        top_features = sorted_features[:5]

        top_shap = {
            feature: round(value, 4)
            for feature, value in top_features
        }

        # Create human-readable SHAP explanations
        shap_reasons = []

        for feature, value in top_features[:3]:

            # Ignore tiny impacts
            if abs(value) < 0.01:
                continue

            if value > 0:

                shap_reasons.append(
                    f"Feature '{feature}' increased the fraud prediction "
                    f"(SHAP impact: {value:.4f})."
                )

            else:

                shap_reasons.append(
                    f"Feature '{feature}' reduced the fraud prediction "
                    f"(SHAP impact: {value:.4f})."
                )

        return top_shap, shap_reasons

    except Exception as e:

        # Do not fail transaction scoring just because
        # explainability failed.
        print("===== SHAP EXPLANATION ERROR =====")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")
        print("==================================")

        return {}, []