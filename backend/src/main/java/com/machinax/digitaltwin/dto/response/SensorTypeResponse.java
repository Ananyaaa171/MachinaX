package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.SensorType;
import lombok.Builder;

@Builder
public record SensorTypeResponse(
    Long id,
    String name,
    String unit,
    String description,
    String physicalQuantity
) {
    public static SensorTypeResponse fromEntity(SensorType entity) {
        if (entity == null) return null;
        return SensorTypeResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .unit(entity.getUnit())
                .description(entity.getDescription())
                .physicalQuantity(entity.getPhysicalQuantity())
                .build();
    }
}
