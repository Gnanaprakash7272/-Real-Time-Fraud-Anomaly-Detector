package com.frauddetector.backend.service;

import tools.jackson.databind.ObjectMapper;
import com.frauddetector.backend.model.Transaction;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final TransactionService transactionService;

    @Value("${kafka.topic.name:transactions-topic}")
    private String topicName;

    @Value("${kafka.producer.fallback-to-direct:true}")
    private boolean fallbackToDirect;

    @Value("${kafka.producer.send-timeout-seconds:3}")
    private int sendTimeoutSeconds;

    public void sendTransaction(Transaction transaction) {
        try {
            String transactionJson = objectMapper.writeValueAsString(transaction);

            kafkaTemplate.send(
                    topicName,
                    transaction.getTransactionId(),
                    transactionJson).get(sendTimeoutSeconds, TimeUnit.SECONDS);

            log.info("Published transaction to Kafka: {}", transaction.getTransactionId());

        } catch (Exception e) {
            if (fallbackToDirect) {
                log.warn(
                        "Kafka unavailable, processing transaction {} synchronously",
                        transaction.getTransactionId());
                transactionService.processAndScoreTransaction(transaction);
                return;
            }

            log.error("Failed to publish transaction {} to Kafka", transaction.getTransactionId(), e);
            throw new RuntimeException("Failed to publish transaction to Kafka: " + e.getMessage(), e);
        }
    }
}
