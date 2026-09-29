package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.time.Instant;
import java.util.List;

@Builder
public record SensorIngestionResponse(
    Long machineId,
    int accepted,
    int rejected,
    Instant ingestedAt,
    List<String> errors
) {}
