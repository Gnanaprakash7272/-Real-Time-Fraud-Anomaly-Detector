package com.frauddetector.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Column(name = "isolation_forest_score")
    private BigDecimal isolationForestScore;

    @Column(name = "gradient_boost_score")
    private BigDecimal gradientBoostScore;

    @Column(name = "final_score", nullable = false)
    private BigDecimal finalScore;

    @Column(name = "risk_level")
    private String riskLevel;

    // Whether Isolation Forest marked this transaction as anomaly
    @Column(name = "is_anomaly")
    private Boolean isAnomaly;

    // Store ML explanation reasons as JSON text
    @Column(name = "top_reasons", columnDefinition = "TEXT")
    private String topReasons;

    // Store SHAP feature values as JSON text
    @Column(name = "shap_values", columnDefinition = "TEXT")
    private String shapValues;

    // Autoencoder reconstruction error (MSE)
    // Lower = normal, Higher = anomalous
    @Column(name = "autoencoder_mse")
    private BigDecimal autoencoderMse;

    // Autoencoder status (NORMAL, HIGH, N/A)
    @Column(name = "autoencoder_status")
    private String autoencoderStatus;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    @PrePersist
    public void beforeSave() {
        if (computedAt == null) {
            computedAt = LocalDateTime.now();
        }
    }
}