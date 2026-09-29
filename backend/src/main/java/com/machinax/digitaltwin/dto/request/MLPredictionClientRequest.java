package com.machinax.digitaltwin.dto.request;

import lombok.Builder;

import java.time.Instant;
import java.util.Map;

@Builder
public record MLPredictionClientRequest(
    Long machineId,
    Instant timestamp,
    Map<String, Double> sensors
) {}
