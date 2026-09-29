package com.machinax.digitaltwin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "maintenance_recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "priority", nullable = false, length = 30)
    private String priority;

    @Column(name = "fault_type", nullable = false, length = 50)
    private String faultType;

    @Column(name = "recommendation", nullable = false, columnDefinition = "text")
    private String recommendation;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
