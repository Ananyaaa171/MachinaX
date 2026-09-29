package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.SensorReading;
import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record SensorReadingResponse(
    Long id,
    Long machineSensorId,
    String sensorLabel,
    String sensorType,
    BigDecimal value,
    String unit,
    ReadingQuality quality,
    SensorSource source,
    Instant recordedAt,
    Instant ingestedAt
) {
    public static SensorReadingResponse fromEntity(SensorReading entity) {
        if (entity == null) return null;
        return SensorReadingResponse.builder()
                .id(entity.getId())
                .machineSensorId(entity.getMachineSensor() != null ? entity.getMachineSensor().getId() : null)
                .sensorLabel(entity.getMachineSensor() != null ? entity.getMachineSensor().getLabel() : null)
                .sensorType(entity.getMachineSensor() != null && entity.getMachineSensor().getSensorType() != null 
                        ? entity.getMachineSensor().getSensorType().getName() : null)
                .value(entity.getValue())
                .unit(entity.getUnit())
                .quality(entity.getQuality())
                .source(entity.getSource())
                .recordedAt(entity.getRecordedAt())
                .ingestedAt(entity.getIngestedAt())
                .build();
    }
}
