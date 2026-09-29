package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record LatestSensorValueDto(
    Long sensorId,
    String sensorLabel,
    String sensorType,
    BigDecimal value,
    String unit,
    String status,
    BigDecimal normalMin,
    BigDecimal normalMax,
    BigDecimal warningMin,
    BigDecimal warningMax,
    BigDecimal criticalMin,
    BigDecimal criticalMax,
    Instant recordedAt
) {}
