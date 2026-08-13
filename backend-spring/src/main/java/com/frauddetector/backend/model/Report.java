package com.frauddetector.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", unique = true, nullable = false)
    private String reportId;

    @Column(name = "report_type", nullable = false)
    private String reportType;

    @Column(name = "generated_by")
    private String generatedBy;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "date_from")
    private String dateFrom;

    @Column(name = "date_to")
    private String dateTo;

    @Column(name = "filters", columnDefinition = "TEXT")
    private String filters;

    @Column(name = "summary_statistics", columnDefinition = "TEXT")
    private String summaryStatistics;

    @Column(name = "report_status")
    private String reportStatus;

    @Column(name = "file_reference")
    private String fileReference;

    @PrePersist
    public void beforeSave() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
        if (reportStatus == null) {
            reportStatus = "COMPLETED";
        }
        if (generatedBy == null) {
            generatedBy = "ANALYST-007";
        }
    }
}
