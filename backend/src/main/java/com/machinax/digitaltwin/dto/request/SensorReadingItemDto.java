package com.machinax.digitaltwin.dto.request;

import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record SensorReadingItemDto(
    Long sensorId,
    String sensorType,
    @NotNull(message = "Reading value is required")
    BigDecimal value,
    String unit,
    ReadingQuality quality,
    SensorSource source,
    @NotNull(message = "recordedAt timestamp is required")
    Instant recordedAt
) {}
