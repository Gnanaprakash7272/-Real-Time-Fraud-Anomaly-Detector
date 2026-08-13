package com.frauddetector.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", unique = true, nullable = false)
    private String transactionId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private BigDecimal amount;

    // PaySim / ML input fields

    @Column(name = "old_balance_org")
    private BigDecimal oldBalanceOrg;

    @Column(name = "new_balance_orig")
    private BigDecimal newBalanceOrig;

    @Column(name = "old_balance_dest")
    private BigDecimal oldBalanceDest;

    @Column(name = "new_balance_dest")
    private BigDecimal newBalanceDest;

    @Column(name = "transaction_type")
    private String type;

    // Dashboard / application metadata

    private String location;

    private String merchant;

    @Column(name = "transaction_time", nullable = false)
    private LocalDateTime timestamp;

    private String status;

    @PrePersist
    public void beforeSave() {

        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }

        if (status == null) {
            status = "PENDING";
        }
    }
}