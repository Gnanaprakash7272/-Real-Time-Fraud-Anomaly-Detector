package com.frauddetector.backend.service;

import com.frauddetector.backend.dto.MLScoreRequest;
import com.frauddetector.backend.dto.MLScoreResponse;
import com.frauddetector.backend.dto.ModelMetricsResponse;
import com.frauddetector.backend.model.Transaction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class MLScoringClient {

        private static final Logger log = LoggerFactory.getLogger(MLScoringClient.class);

        private final HttpClient httpClient;
        private final ObjectMapper objectMapper;
        private final MetricsService metricsService;

        @Value("${ml.service.url:http://127.0.0.1:8001}")
        private String mlServiceUrl;

        public MLScoringClient(MetricsService metricsService) {
                this.metricsService = metricsService;
                this.httpClient = HttpClient
                                .newBuilder()
                                .version(HttpClient.Version.HTTP_1_1)
                                .build();
                this.objectMapper = new ObjectMapper();
        }

        public MLScoreResponse getScore(Transaction transaction) {
                try {
                        MLScoreRequest request = new MLScoreRequest(
                                        transaction.getTransactionId(),
                                        transaction.getAmount(),
                                        transaction.getOldBalanceOrg(),
                                        transaction.getNewBalanceOrig(),
                                        transaction.getOldBalanceDest(),
                                        transaction.getNewBalanceDest(),
                                        transaction.getType());

                        String jsonBody = objectMapper.writeValueAsString(request);

                        log.debug("ML scoring request for transaction {} to {}/score",
                                        transaction.getTransactionId(), mlServiceUrl);

                        HttpRequest httpRequest = HttpRequest.newBuilder()
                                        .uri(URI.create(mlServiceUrl + "/score"))
                                        .version(HttpClient.Version.HTTP_1_1)
                                        .timeout(Duration.ofSeconds(3))
                                        .header("Content-Type", "application/json")
                                        .header("Accept", "application/json")
                                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                                        .build();

                        long startTime = System.nanoTime();
                        HttpResponse<String> response = httpClient.send(
                                        httpRequest,
                                        HttpResponse.BodyHandlers.ofString());
                        double latencyMs = (System.nanoTime() - startTime) / 1_000_000.0;

                        metricsService.recordLatency(latencyMs);
                        log.debug("ML scoring latency for {}: {} ms",
                                        transaction.getTransactionId(), String.format("%.2f", latencyMs));

                        if (response.statusCode() >= 400 && response.statusCode() < 500) {
                                throw new RuntimeException(
                                                "ML service validation error ("
                                                                + response.statusCode()
                                                                + "): "
                                                                + response.body());
                        }

                        if (response.statusCode() >= 500) {
                                throw new RuntimeException(
                                                "ML service server error ("
                                                                + response.statusCode()
                                                                + "): "
                                                                + response.body());
                        }

                        if (response.statusCode() < 200 || response.statusCode() >= 300) {
                                throw new RuntimeException(
                                                "Unexpected ML service response ("
                                                                + response.statusCode()
                                                                + "): "
                                                                + response.body());
                        }

                        return objectMapper.readValue(response.body(), MLScoreResponse.class);

                } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("ML scoring request was interrupted", e);
                } catch (RuntimeException e) {
                        throw e;
                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to call ML scoring service: " + e.getMessage(), e);
                }
        }

        public ModelMetricsResponse getModelMetrics() {
                try {
                        HttpRequest request = HttpRequest.newBuilder()
                                        .uri(URI.create(mlServiceUrl + "/model-metrics"))
                                        .version(HttpClient.Version.HTTP_1_1)
                                        .timeout(Duration.ofSeconds(3))
                                        .header("Accept", "application/json")
                                        .GET()
                                        .build();

                        HttpResponse<String> response = httpClient.send(
                                        request,
                                        HttpResponse.BodyHandlers.ofString());

                        if (response.statusCode() < 200 || response.statusCode() >= 300) {
                                throw new RuntimeException(
                                                "Failed to fetch model metrics ("
                                                                + response.statusCode()
                                                                + "): "
                                                                + response.body());
                        }

                        return objectMapper.readValue(response.body(), ModelMetricsResponse.class);

                } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Model metrics request was interrupted", e);
                } catch (RuntimeException e) {
                        throw e;
                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to fetch model metrics: " + e.getMessage(), e);
                }
        }
}
