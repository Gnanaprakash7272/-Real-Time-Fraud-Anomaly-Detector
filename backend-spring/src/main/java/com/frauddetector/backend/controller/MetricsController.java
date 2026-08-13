package com.frauddetector.backend.controller;

import com.frauddetector.backend.dto.ModelMetricsResponse;
import com.frauddetector.backend.service.MLScoringClient;
import com.frauddetector.backend.service.MetricsService;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsService metricsService;
    private final MLScoringClient mlScoringClient;

    // Model metrics are fetched by a background daemon thread every 30s.
    // The HTTP endpoint reads from cache and returns in < 5ms always.
    private final AtomicReference<ModelMetricsResponse> cachedModelMetrics = new AtomicReference<>();
    private final AtomicReference<Boolean> modelMetricsAvailable = new AtomicReference<>(false);
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "model-metrics-bg");
        t.setDaemon(true);
        return t;
    });

    public MetricsController(MetricsService metricsService, MLScoringClient mlScoringClient) {
        this.metricsService = metricsService;
        this.mlScoringClient = mlScoringClient;
    }

    @PostConstruct
    public void startBackgroundRefresh() {
        scheduler.scheduleWithFixedDelay(this::refreshCache, 1L, 30L, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void stopBackgroundRefresh() {
        scheduler.shutdownNow();
    }

    private void refreshCache() {
        try {
            ModelMetricsResponse m = mlScoringClient.getModelMetrics();
            cachedModelMetrics.set(m);
            modelMetricsAvailable.set(true);
        } catch (Exception e) {
            modelMetricsAvailable.set(false);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sampleCount",             metricsService.getSampleCount());
        result.put("latestLatencyMs",         metricsService.getLatestLatencyMs());
        result.put("averageLatencyMs",        metricsService.getAverageLatencyMs());
        result.put("p95LatencyMs",            metricsService.getP95LatencyMs());
        result.put("p99LatencyMs",            metricsService.getP99LatencyMs());
        result.put("throughputTps",           metricsService.getThroughputTps());
        result.put("transactionCount",        metricsService.getTransactionCount());
        result.put("throughputWindowSeconds", metricsService.getThroughputWindowSeconds());

        boolean available = Boolean.TRUE.equals(modelMetricsAvailable.get());
        ModelMetricsResponse cached = cachedModelMetrics.get();

        if (available && cached != null) {
            result.put("modelMetricsAvailable",  true);
            result.put("modelPrecision",         cached.getPrecision());
            result.put("modelRecall",            cached.getRecall());
            result.put("modelF1Score",           cached.getF1Score());
            result.put("modelPrecisionPercent",  cached.getPrecisionPercent());
            result.put("modelRecallPercent",     cached.getRecallPercent());
            result.put("modelF1ScorePercent",    cached.getF1ScorePercent());
            result.put("modelTestSamples",       cached.getTestSamples());
            result.put("modelFraudSamples",      cached.getFraudSamples());
            result.put("modelLegitimateSamples", cached.getLegitimateSamples());
            result.put("modelTruePositives",     cached.getTruePositives());
            result.put("modelTrueNegatives",     cached.getTrueNegatives());
            result.put("modelFalsePositives",    cached.getFalsePositives());
            result.put("modelFalseNegatives",    cached.getFalseNegatives());
        } else {
            result.put("modelMetricsAvailable",  false);
            result.put("modelMetricsError",      "ML service offline");
            result.put("modelPrecision",         0.0);
            result.put("modelRecall",            0.0);
            result.put("modelF1Score",           0.0);
            result.put("modelPrecisionPercent",  0.0);
            result.put("modelRecallPercent",     0.0);
            result.put("modelF1ScorePercent",    0.0);
            result.put("modelTestSamples",       0);
            result.put("modelFraudSamples",      0);
            result.put("modelLegitimateSamples", 0);
            result.put("modelTruePositives",     0);
            result.put("modelTrueNegatives",     0);
            result.put("modelFalsePositives",    0);
            result.put("modelFalseNegatives",    0);
        }
        return ResponseEntity.ok(result);
    }
}
