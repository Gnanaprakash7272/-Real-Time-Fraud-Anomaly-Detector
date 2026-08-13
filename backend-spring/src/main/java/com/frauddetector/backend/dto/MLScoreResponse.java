package com.frauddetector.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class MLScoreResponse {

    private String transaction_id;

    private Double gradient_boost_probability;

    private Double gradient_boost_risk_percent;

    private Double isolation_forest_score;

    private Boolean isolation_forest_anomaly;

    private Double autoencoder_mse;

    private String autoencoder_status;

    private Double ensemble_risk_score;

    private String risk_level;

    private List<String> top_reasons;

    private Map<String, Double> shap_values;

    public String getTransactionId() {
        return transaction_id;
    }

    public Double getGradientBoostProbability() {
        return gradient_boost_probability;
    }

    public Double getGradientBoostRiskPercent() {
        return gradient_boost_risk_percent;
    }

    public Double getIsolationForestScore() {
        return isolation_forest_score;
    }

    public Boolean getIsolationForestAnomaly() {
        return isolation_forest_anomaly;
    }

    public Double getAutoencoderMse() {
        return autoencoder_mse;
    }

    public String getAutoencoderStatus() {
        return autoencoder_status;
    }

    public Double getEnsembleRiskScore() {
        return ensemble_risk_score;
    }

    public String getRiskLevel() {
        return risk_level;
    }

    public List<String> getTopReasons() {
        return top_reasons;
    }

    public Map<String, Double> getShapValues() {
        return shap_values;
    }
}