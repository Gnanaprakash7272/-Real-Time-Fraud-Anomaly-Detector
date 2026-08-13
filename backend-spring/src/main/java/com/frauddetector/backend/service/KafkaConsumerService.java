package com.frauddetector.backend.service;

import tools.jackson.databind.ObjectMapper;
import com.frauddetector.backend.model.Transaction;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final TransactionService transactionService;
    private final ObjectMapper objectMapper;

    // Real Kafka throughput metrics
    private final MetricsService metricsService;

    @KafkaListener(topics = "${kafka.topic.name:transactions-topic}", groupId = "${spring.kafka.consumer.group-id:fraud-detector-group}")
    public void consumeTransaction(String transactionJson) {

        try {
            log.info(
                    "Received transaction message from Kafka: {}",
                    transactionJson);

            /*
             * Count the transaction as soon as it is received
             * from Kafka.
             *
             * MetricsService uses this timestamp to calculate
             * rolling real TPS.
             */
            metricsService.recordTransaction();

            // Convert Kafka JSON -> Transaction object
            Transaction transaction = objectMapper.readValue(
                    transactionJson,
                    Transaction.class);

            // Save + ML score + persist result
            transactionService.processAndScoreTransaction(
                    transaction);

        } catch (Exception e) {
            log.error(
                    "Failed to process transaction from Kafka payload: {}",
                    transactionJson,
                    e);
        }
    }
}