package com.machinax.digitaltwin.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "machine_sensors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineSensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensor_type_id", nullable = false)
    private SensorType sensorType;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "normal_min", precision = 12, scale = 4)
    private BigDecimal normalMin;

    @Column(name = "normal_max", precision = 12, scale = 4)
    private BigDecimal normalMax;

    @Column(name = "warning_min", precision = 12, scale = 4)
    private BigDecimal warningMin;

    @Column(name = "warning_max", precision = 12, scale = 4)
    private BigDecimal warningMax;

    @Column(name = "critical_min", precision = 12, scale = 4)
    private BigDecimal criticalMin;

    @Column(name = "critical_max", precision = 12, scale = 4)
    private BigDecimal criticalMax;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
