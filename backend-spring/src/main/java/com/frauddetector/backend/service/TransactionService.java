package com.frauddetector.backend.service;

import com.frauddetector.backend.dto.MLScoreResponse;
import com.frauddetector.backend.model.RiskScore;
import com.frauddetector.backend.model.Transaction;
import com.frauddetector.backend.repository.RiskScoreRepository;
import com.frauddetector.backend.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final MLScoringClient mlScoringClient;
    private final AlertService alertService;

    /*
     * Jackson 3 ObjectMapper
     * Used to convert topReasons + shapValues into JSON strings
     * before storing them in PostgreSQL TEXT columns.
     */
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Transaction createTransaction(Transaction transaction) {
        return processAndScoreTransaction(transaction);
    }

    @Transactional
    public Transaction processAndScoreTransaction(Transaction transaction) {

        // Skip duplicate Kafka messages for the same business transaction ID
        Transaction saved = transactionRepository.findByTransactionId(transaction.getTransactionId())
                .map(existing -> {
                    existing.setAmount(transaction.getAmount());
                    existing.setOldBalanceOrg(transaction.getOldBalanceOrg());
                    existing.setNewBalanceOrig(transaction.getNewBalanceOrig());
                    existing.setOldBalanceDest(transaction.getOldBalanceDest());
                    existing.setNewBalanceDest(transaction.getNewBalanceDest());
                    existing.setType(transaction.getType());
                    existing.setLocation(transaction.getLocation());
                    existing.setMerchant(transaction.getMerchant());
                    existing.setUserId(transaction.getUserId());
                    if (transaction.getTimestamp() != null) {
                        existing.setTimestamp(transaction.getTimestamp());
                    }
                    return transactionRepository.save(existing);
                })
                .orElseGet(() -> transactionRepository.save(transaction));

        try {

            // ---------------------------------------------------------
            // 2. Call Python/FastAPI ML scoring service
            // ---------------------------------------------------------

            MLScoreResponse mlResponse = mlScoringClient.getScore(saved);

            // ---------------------------------------------------------
            // 3. Use ML service risk level directly
            //
            // Example:
            // ensemble_risk_score = 0.6727
            // risk_level = HIGH
            // ---------------------------------------------------------

            String riskLevel = mlResponse.getRiskLevel();

            if (riskLevel == null || riskLevel.isBlank()) {

                riskLevel = determineRiskLevel(
                        mlResponse.getGradientBoostRiskPercent(),
                        mlResponse.getIsolationForestAnomaly());
            }

            // ---------------------------------------------------------
            // 4. Convert explainability data into JSON
            // ---------------------------------------------------------

            String topReasonsJson = objectMapper.writeValueAsString(
                    mlResponse.getTopReasons());

            String shapValuesJson = objectMapper.writeValueAsString(
                    mlResponse.getShapValues());

            // ---------------------------------------------------------
            // 5. Build RiskScore entity
            // ---------------------------------------------------------

            RiskScore riskScore = riskScoreRepository.findByTransactionId(saved.getId())
                    .orElse(RiskScore.builder().transactionId(saved.getId()).build());

            riskScore.setIsolationForestScore(
                            toBigDecimal(mlResponse.getIsolationForestScore()));
            riskScore.setGradientBoostScore(
                            toBigDecimal(mlResponse.getGradientBoostProbability()));
            riskScore.setFinalScore(
                            toBigDecimal(mlResponse.getEnsembleRiskScore()));
            riskScore.setRiskLevel(riskLevel);
            riskScore.setIsAnomaly(mlResponse.getIsolationForestAnomaly());
            riskScore.setTopReasons(topReasonsJson);
            riskScore.setShapValues(shapValuesJson);
            riskScore.setAutoencoderMse(
                            toBigDecimal(mlResponse.getAutoencoderMse()));
            riskScore.setAutoencoderStatus(mlResponse.getAutoencoderStatus());

            // ---------------------------------------------------------
            // 6. Save ML risk result
            // ---------------------------------------------------------

            riskScoreRepository.save(riskScore);

            // ---------------------------------------------------------
            // 7. Update transaction status
            // ---------------------------------------------------------

            if ("HIGH".equalsIgnoreCase(riskLevel)
                    ||
                    "CRITICAL".equalsIgnoreCase(riskLevel)) {

                saved.setStatus("FLAGGED");
                alertService.createAlertForTransaction(saved.getId(), riskLevel);

            } else {

                saved.setStatus("APPROVED");
            }

            log.info(
                    "Transaction {} scored successfully: " +
                            "riskLevel={}, ensembleScore={}, anomaly={}",
                    saved.getTransactionId(),
                    riskLevel,
                    mlResponse.getEnsembleRiskScore(),
                    mlResponse.getIsolationForestAnomaly());

            return transactionRepository.save(saved);

        } catch (Exception e) {

            // ---------------------------------------------------------
            // ML failure should not destroy transaction record
            // ---------------------------------------------------------

            log.error(
                    "Error scoring transaction {}: {}",
                    saved.getTransactionId(),
                    e.getMessage(),
                    e);

            saved.setStatus("UNSCORED");

            return transactionRepository.save(saved);
        }
    }

    /*
     * Fallback risk calculation.
     *
     * Normally ML service already returns risk_level.
     * This is used only if risk_level is missing.
     */
    private String determineRiskLevel(
            Double riskPercent,
            Boolean isAnomaly) {

        if (riskPercent == null) {
            return "UNKNOWN";
        }

        if (riskPercent > 70.0
                ||
                (Boolean.TRUE.equals(isAnomaly)
                        &&
                        riskPercent > 40.0)) {

            return "CRITICAL";

        } else if (riskPercent > 40.0
                ||
                Boolean.TRUE.equals(isAnomaly)) {

            return "HIGH";

        } else if (riskPercent > 20.0) {

            return "MEDIUM";
        }

        return "LOW";
    }

    /*
     * Safe Double -> BigDecimal conversion
     */
    private BigDecimal toBigDecimal(Double value) {

        return value == null
                ? null
                : BigDecimal.valueOf(value);
    }

    // ---------------------------------------------------------
    // GET all transactions
    // ---------------------------------------------------------

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll(
                Sort.by(Sort.Direction.DESC, "timestamp"));
    }

    public List<Transaction> getTransactionsForToday(LocalDateTime start, LocalDateTime end) {
        return transactionRepository.findByTimestampBetween(start, end)
                .stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .collect(java.util.stream.Collectors.toList());
    }

    public Page<Transaction> getTransactionsPage(int page, int size) {
        return transactionRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp")));
    }

    // ---------------------------------------------------------
    // GET transaction by DB ID
    // ---------------------------------------------------------

    public Transaction getTransactionById(Long id) {
        return transactionRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transaction not found for ID: " + id));
    }
}