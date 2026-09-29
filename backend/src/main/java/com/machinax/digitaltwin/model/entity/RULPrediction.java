package com.machinax.digitaltwin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "rul_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RULPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "estimated_rul_hours", nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedRulHours;

    @Column(name = "confidence", nullable = false, length = 20)
    private String confidence;

    @Column(name = "degradation_trend", nullable = false, length = 30)
    private String degradationTrend;

    @Column(name = "prediction_timestamp", nullable = false)
    private Instant predictionTimestamp;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
