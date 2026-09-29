package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record SensorTrendPointResponse(
    Long id,
    Long sensorId,
    String sensorType,
    BigDecimal value,
    String unit,
    Instant timestamp
) {}
