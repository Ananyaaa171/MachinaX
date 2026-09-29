package com.machinax.digitaltwin.model.entity;

import com.machinax.digitaltwin.model.enums.FaultType;
import com.machinax.digitaltwin.model.enums.OperatingState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "digital_twin_states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalTwinState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false, unique = true)
    private Machine machine;

    @Column(name = "health_score", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal healthScore = new BigDecimal("100.00");

    @Enumerated(EnumType.STRING)
    @Column(name = "operating_state", nullable = false, length = 30)
    @Builder.Default
    private OperatingState operatingState = OperatingState.NORMAL;

    @Column(name = "anomaly_detected", nullable = false)
    @Builder.Default
    private Boolean anomalyDetected = false;

    @Column(name = "anomaly_score", precision = 6, scale = 4)
    private BigDecimal anomalyScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_fault_type", nullable = false, length = 50)
    @Builder.Default
    private FaultType currentFaultType = FaultType.NONE;

    @Column(name = "fault_probability", precision = 5, scale = 4)
    private BigDecimal faultProbability;

    @Column(name = "rul_hours", precision = 10, scale = 2)
    private BigDecimal rulHours;

    @Column(name = "rul_confidence_low", precision = 10, scale = 2)
    private BigDecimal rulConfidenceLow;

    @Column(name = "rul_confidence_high", precision = 10, scale = 2)
    private BigDecimal rulConfidenceHigh;

    @Column(name = "last_sensor_batch_at")
    private Instant lastSensorBatchAt;

    @Column(name = "last_ml_inference_at")
    private Instant lastMlInferenceAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
