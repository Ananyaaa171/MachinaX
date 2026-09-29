package com.machinax.digitaltwin.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sensor_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "physical_quantity", nullable = false, length = 100)
    private String physicalQuantity;
}
