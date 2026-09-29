package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.enums.MachineStatus;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Builder
public record MachineResponse(
    Long id,
    String name,
    String serialNumber,
    String location,
    MachineTypeResponse machineType,
    BigDecimal ratedPowerKw,
    BigDecimal ratedVoltageV,
    BigDecimal ratedCurrentA,
    BigDecimal ratedSpeedRpm,
    LocalDate installationDate,
    MachineStatus status,
    Instant createdAt,
    Instant updatedAt
) {
    public static MachineResponse fromEntity(Machine entity) {
        if (entity == null) return null;
        return MachineResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .serialNumber(entity.getSerialNumber())
                .location(entity.getLocation())
                .machineType(MachineTypeResponse.fromEntity(entity.getMachineType()))
                .ratedPowerKw(entity.getRatedPowerKw())
                .ratedVoltageV(entity.getRatedVoltageV())
                .ratedCurrentA(entity.getRatedCurrentA())
                .ratedSpeedRpm(entity.getRatedSpeedRpm())
                .installationDate(entity.getInstallationDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
