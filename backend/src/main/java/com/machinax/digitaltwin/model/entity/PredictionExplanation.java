package com.machinax.digitaltwin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "prediction_explanations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionExplanation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ml_prediction_id", nullable = false)
    private MLPrediction mlPrediction;

    @Column(name = "feature_name", nullable = false, length = 50)
    private String featureName;

    @Column(name = "feature_value", nullable = false, precision = 12, scale = 4)
    private BigDecimal featureValue;

    @Column(name = "shap_value", nullable = false, precision = 10, scale = 6)
    private BigDecimal shapValue;

    @Column(name = "impact", nullable = false, length = 50)
    private String impact;

    @Column(name = "explanation", columnDefinition = "text")
    private String explanation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
