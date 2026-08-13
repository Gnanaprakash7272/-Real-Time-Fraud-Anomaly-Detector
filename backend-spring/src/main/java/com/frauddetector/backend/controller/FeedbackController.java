package com.frauddetector.backend.controller;

import com.frauddetector.backend.model.Feedback;
import com.frauddetector.backend.repository.AlertRepository;
import com.frauddetector.backend.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final AlertRepository alertRepository;

    @PostMapping
    public ResponseEntity<Feedback> submitFeedback(@RequestBody Feedback feedback) {
        if (feedback.getAlertId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "alertId is required");
        }

        // Frontend may send transaction DB id as alertId fallback; resolve to actual alert id
        if (alertRepository.findById(feedback.getAlertId()).isEmpty()) {
            alertRepository.findFirstByTransactionIdOrderByCreatedAtDesc(feedback.getAlertId())
                    .ifPresent(alert -> feedback.setAlertId(alert.getId()));
        }

        if (alertRepository.findById(feedback.getAlertId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No alert found for the given alertId");
        }

        if (feedback.getDecision() == null || feedback.getDecision().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision is required");
        }

        Feedback saved = feedbackRepository.save(feedback);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackRepository.findAll());
    }

    @GetMapping("/analyst/{analystId}")
    public ResponseEntity<List<Feedback>> getFeedbackByAnalyst(@PathVariable String analystId) {
        return ResponseEntity.ok(feedbackRepository.findByAnalystId(analystId));
    }
}
