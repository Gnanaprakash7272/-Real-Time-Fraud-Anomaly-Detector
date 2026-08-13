package com.frauddetector.backend.controller;

import com.frauddetector.backend.model.RiskScore;
import com.frauddetector.backend.model.Transaction;
import com.frauddetector.backend.repository.RiskScoreRepository;
import com.frauddetector.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/risk-scores")
@RequiredArgsConstructor
public class RiskScoreController {

    private final RiskScoreRepository riskScoreRepository;
    private final TransactionRepository transactionRepository;

    @GetMapping
    public ResponseEntity<List<RiskScore>> getAllRiskScores(
            @RequestParam(defaultValue = "false") boolean today) {

        if (today) {
            // Only return risk scores for today's transactions
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime now = LocalDateTime.now();
            List<Long> todayTxnIds = transactionRepository
                    .findByTimestampBetween(startOfDay, now)
                    .stream()
                    .map(Transaction::getId)
                    .collect(Collectors.toList());

            if (todayTxnIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            return ResponseEntity.ok(
                    riskScoreRepository.findByTransactionIdIn(todayTxnIds)
            );
        }

        return ResponseEntity.ok(riskScoreRepository.findAll());
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<RiskScore> getRiskScoreByTransactionId(@PathVariable Long transactionId) {
        return riskScoreRepository.findByTransactionId(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
