package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.MachineType;
import lombok.Builder;

import java.time.Instant;

@Builder
public record MachineTypeResponse(
    Long id,
    String name,
    String displayName,
    String description,
    String manufacturerModel,
    Instant createdAt
) {
    public static MachineTypeResponse fromEntity(MachineType entity) {
        if (entity == null) return null;
        return MachineTypeResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .displayName(entity.getDisplayName())
                .description(entity.getDescription())
                .manufacturerModel(entity.getManufacturerModel())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
