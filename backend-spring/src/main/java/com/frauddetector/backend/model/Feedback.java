package com.frauddetector.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false)
    private Long alertId;

    @Column(name = "analyst_id")
    private String analystId;

    private String decision;

    private String notes;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @PrePersist
    public void beforeSave() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}