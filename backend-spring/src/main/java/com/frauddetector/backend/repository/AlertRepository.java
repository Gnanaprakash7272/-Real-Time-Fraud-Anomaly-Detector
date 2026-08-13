package com.frauddetector.backend.repository;

import com.frauddetector.backend.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByStatus(String status);

    List<Alert> findBySeverity(String severity);

    List<Alert> findByStatusOrderByCreatedAtDesc(String status);

    Optional<Alert> findFirstByTransactionIdOrderByCreatedAtDesc(
            Long transactionId);
}