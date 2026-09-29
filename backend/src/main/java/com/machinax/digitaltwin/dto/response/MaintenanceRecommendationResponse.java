package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.MaintenanceRecommendation;
import lombok.Builder;

import java.time.Instant;

@Builder
public record MaintenanceRecommendationResponse(
    Long id,
    Long machineId,
    String priority,
    String faultType,
    String recommendation,
    Instant generatedAt,
    String status
) {
    public static MaintenanceRecommendationResponse fromEntity(MaintenanceRecommendation entity) {
        if (entity == null) {
            return null;
        }
        return MaintenanceRecommendationResponse.builder()
                .id(entity.getId())
                .machineId(entity.getMachine() != null ? entity.getMachine().getId() : null)
                .priority(entity.getPriority())
                .faultType(entity.getFaultType())
                .recommendation(entity.getRecommendation())
                .generatedAt(entity.getGeneratedAt())
                .status(entity.getStatus())
                .build();
    }
}
