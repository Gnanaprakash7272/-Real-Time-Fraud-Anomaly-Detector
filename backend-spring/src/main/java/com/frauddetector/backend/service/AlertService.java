package com.frauddetector.backend.service;

import com.frauddetector.backend.model.Alert;
import com.frauddetector.backend.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    @Transactional
    public Alert createAlertForTransaction(Long transactionDbId, String riskLevel) {
        return alertRepository.findFirstByTransactionIdOrderByCreatedAtDesc(transactionDbId)
                .orElseGet(() -> alertRepository.save(Alert.builder()
                        .transactionId(transactionDbId)
                        .alertType("FRAUD_RISK")
                        .severity(riskLevel)
                        .status("OPEN")
                        .build()));
    }

    public List<Alert> getAllAlerts(String status) {
        if (status != null && !status.isBlank()) {
            return alertRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return alertRepository.findAll();
    }

    public Alert getAlertById(Long id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + id));
    }
}
