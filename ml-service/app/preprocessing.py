import pandas as pd
import numpy as np
from typing import List, Dict, Any

TRANSACTION_TYPES = [
    "CASH_IN",
    "CASH_OUT",
    "DEBIT",
    "PAYMENT",
    "TRANSFER"
]

def transform_transaction(txn_data: Dict[str, Any], feature_cols: List[str]) -> pd.DataFrame:
    """
    Transforms raw transaction dictionary into exact pandas DataFrame features required by ML models.
    """
    amount = float(txn_data.get("amount", 0.0))
    old_org = float(txn_data.get("oldbalanceOrg", 0.0))
    new_orig = float(txn_data.get("newbalanceOrig", 0.0))
    old_dest = float(txn_data.get("oldbalanceDest", 0.0))
    new_dest = float(txn_data.get("newbalanceDest", 0.0))
    txn_type = str(txn_data.get("type", "")).upper()

    row = {
        "amount": amount,
        "oldbalanceOrg": old_org,
        "newbalanceOrig": new_orig,
        "oldbalanceDest": old_dest,
        "newbalanceDest": new_dest,
        "balanceDiffOrig": old_org - new_orig,
        "balanceDiffDest": new_dest - old_dest,
        "origBalanceZero": int(new_orig == 0),
        "destBalanceZero": int(old_dest == 0),
        "amountToBalanceRatio": amount / (old_org + 1e-5),
        "destAmountDiff": abs(amount - (new_dest - old_dest))
    }

    for t_type in TRANSACTION_TYPES:
        row[f"type_{t_type}"] = 1 if txn_type == t_type else 0

    df = pd.DataFrame([row])
    
    # Ensure all trained feature columns exist
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0

    return df[feature_cols]
