from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class MLScoreRequest(BaseModel):
    transaction_id: str
    amount: float = Field(ge=0, description="Transaction amount")
    oldbalanceOrg: float = Field(ge=0, description="Initial balance of origin account")
    newbalanceOrig: float = Field(ge=0, description="New balance of origin account")
    oldbalanceDest: float = Field(ge=0, description="Initial balance of destination account")
    newbalanceDest: float = Field(ge=0, description="New balance of destination account")
    type: str = Field(description="Transaction type: CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER")

class MLScoreResponse(BaseModel):
    transaction_id: str
    gradient_boost_probability: float
    gradient_boost_risk_percent: float
    isolation_forest_score: float
    isolation_forest_anomaly: bool
    autoencoder_mse: Optional[float] = 0.0
    autoencoder_status: Optional[str] = "NORMAL"
    ensemble_risk_score: float
    risk_level: str
    top_reasons: List[str] = []
    shap_values: Optional[Dict[str, float]] = None
