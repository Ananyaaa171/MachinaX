package com.machinax.digitaltwin.model.entity;

import com.machinax.digitaltwin.model.enums.FaultType;
import com.machinax.digitaltwin.model.enums.MLStage;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "ml_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MLPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 30)
    private MLStage stage;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_features", columnDefinition = "jsonb")
    private Map<String, Object> inputFeatures;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output", columnDefinition = "jsonb")
    private Map<String, Object> output;

    @Column(name = "anomaly_score", precision = 6, scale = 4)
    private BigDecimal anomalyScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "fault_type", length = 50)
    private FaultType faultType;

    @Column(name = "fault_probability", precision = 5, scale = 4)
    private BigDecimal faultProbability;

    @Column(name = "rul_hours", precision = 10, scale = 2)
    private BigDecimal rulHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "confidence_interval", columnDefinition = "jsonb")
    private Map<String, Object> confidenceInterval;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "shap_values", columnDefinition = "jsonb")
    private Map<String, Object> shapValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "top_features", columnDefinition = "jsonb")
    private Object topFeatures;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
