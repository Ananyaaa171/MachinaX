package com.machinax.digitaltwin.model.entity;

import com.machinax.digitaltwin.model.enums.MachineStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "machines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_type_id", nullable = false)
    private MachineType machineType;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;

    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "rated_power_kw", precision = 10, scale = 2)
    private BigDecimal ratedPowerKw;

    @Column(name = "rated_voltage_v", precision = 10, scale = 2)
    private BigDecimal ratedVoltageV;

    @Column(name = "rated_current_a", precision = 10, scale = 2)
    private BigDecimal ratedCurrentA;

    @Column(name = "rated_speed_rpm", precision = 10, scale = 2)
    private BigDecimal ratedSpeedRpm;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private MachineStatus status = MachineStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
