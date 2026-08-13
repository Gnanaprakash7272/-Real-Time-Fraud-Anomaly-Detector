package com.frauddetector.backend.dto;

import lombok.Data;

@Data
public class ModelMetricsResponse {

    private Double precision;
    private Double recall;
    private Double f1Score;

    private Double precisionPercent;
    private Double recallPercent;
    private Double f1ScorePercent;

    private Integer testSamples;
    private Integer fraudSamples;
    private Integer legitimateSamples;

    private Integer truePositives;
    private Integer trueNegatives;
    private Integer falsePositives;
    private Integer falseNegatives;
}