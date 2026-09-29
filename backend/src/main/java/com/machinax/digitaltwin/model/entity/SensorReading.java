package com.machinax.digitaltwin.model.entity;

import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sensor_readings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_sensor_id", nullable = false)
    private MachineSensor machineSensor;

    @Column(name = "value", nullable = false, precision = 14, scale = 4)
    private BigDecimal value;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality", nullable = false, length = 30)
    @Builder.Default
    private ReadingQuality quality = ReadingQuality.GOOD;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 30)
    @Builder.Default
    private SensorSource source = SensorSource.SIMULATED;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @CreationTimestamp
    @Column(name = "ingested_at", nullable = false, updatable = false)
    private Instant ingestedAt;
}
