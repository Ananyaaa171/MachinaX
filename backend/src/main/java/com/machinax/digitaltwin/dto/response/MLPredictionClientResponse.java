package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Builder
public record MLPredictionClientResponse(
    Long machineId,
    Boolean anomalyDetected,
    BigDecimal anomalyScore,
    String faultType,
    BigDecimal faultProbability,
    String modelVersion,
    Map<String, BigDecimal> classProbabilities,
    Instant predictionTimestamp,
    Integer processingTimeMs,
    Map<String, Object> explanation,
    Map<String, Object> rul,
    Map<String, Object> maintenance
) {}

