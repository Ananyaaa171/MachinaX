package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.MachineSensor;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record MachineSensorResponse(
    Long id,
    Long machineId,
    SensorTypeResponse sensorType,
    String label,
    BigDecimal normalMin,
    BigDecimal normalMax,
    BigDecimal warningMin,
    BigDecimal warningMax,
    BigDecimal criticalMin,
    BigDecimal criticalMax,
    Boolean isActive
) {
    public static MachineSensorResponse fromEntity(MachineSensor entity) {
        if (entity == null) return null;
        return MachineSensorResponse.builder()
                .id(entity.getId())
                .machineId(entity.getMachine() != null ? entity.getMachine().getId() : null)
                .sensorType(SensorTypeResponse.fromEntity(entity.getSensorType()))
                .label(entity.getLabel())
                .normalMin(entity.getNormalMin())
                .normalMax(entity.getNormalMax())
                .warningMin(entity.getWarningMin())
                .warningMax(entity.getWarningMax())
                .criticalMin(entity.getCriticalMin())
                .criticalMax(entity.getCriticalMax())
                .isActive(entity.getIsActive())
                .build();
    }
}
