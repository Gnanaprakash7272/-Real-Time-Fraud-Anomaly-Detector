package com.frauddetector.backend.config;

import com.frauddetector.backend.model.Transaction;
import com.frauddetector.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder {

    private final TransactionRepository transactionRepository;

    @Bean
    CommandLineRunner seedDevTransactions() {
        return args -> {
            if (transactionRepository.count() == 0) {
                transactionRepository.save(Transaction.builder()
                        .transactionId("TXN-DEV-001")
                        .userId("USR-DEV-1")
                        .amount(new BigDecimal("142500.00"))
                        .oldBalanceOrg(new BigDecimal("142500.00"))
                        .newBalanceOrig(BigDecimal.ZERO)
                        .oldBalanceDest(BigDecimal.ZERO)
                        .newBalanceDest(BigDecimal.ZERO)
                        .type("TRANSFER")
                        .location("Mumbai, IN")
                        .merchant("Dev Seed Transfer")
                        .timestamp(LocalDateTime.now())
                        .status("FLAGGED")
                        .build());
            }
        };
    }
}
