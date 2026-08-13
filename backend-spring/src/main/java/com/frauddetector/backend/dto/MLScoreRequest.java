package com.frauddetector.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MLScoreRequest {

    private String transaction_id;
    private BigDecimal amount;
    private BigDecimal oldbalanceOrg;
    private BigDecimal newbalanceOrig;
    private BigDecimal oldbalanceDest;
    private BigDecimal newbalanceDest;
    private String type;
}