package com.frauddetector.backend.controller;

import com.frauddetector.backend.model.Transaction;
import com.frauddetector.backend.service.KafkaProducerService;
import com.frauddetector.backend.service.TransactionService;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final KafkaProducerService kafkaProducerService;
    private final TransactionService transactionService;

    public TransactionController(
            KafkaProducerService kafkaProducerService,
            TransactionService transactionService) {

        this.kafkaProducerService = kafkaProducerService;
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createTransaction(
            @RequestBody Transaction transaction) {

        if (transaction.getTransactionId() == null || transaction.getTransactionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "transactionId is required");
        }

        try {
            kafkaProducerService.sendTransaction(transaction);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to queue transaction: " + e.getMessage());
        }

        return ResponseEntity.accepted().body(
                Map.of(
                        "status", "QUEUED",
                        "transactionId", transaction.getTransactionId(),
                        "message", "Transaction published to Kafka"));
    }

    @GetMapping
    public ResponseEntity<?> getAllTransactions(
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "false") boolean today) {

        if (today) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime now = LocalDateTime.now();
            return ResponseEntity.ok(transactionService.getTransactionsForToday(startOfDay, now));
        }

        if (page != null) {
            return ResponseEntity.ok(transactionService.getTransactionsPage(page, size));
        }
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }
}
