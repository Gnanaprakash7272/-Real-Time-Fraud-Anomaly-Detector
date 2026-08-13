package com.frauddetector.backend.repository;

import com.frauddetector.backend.model.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {
    Optional<RiskScore> findByTransactionId(Long transactionId);
    List<RiskScore> findByTransactionIdIn(List<Long> transactionIds);
}