package com.machinax.digitaltwin.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SensorReadingBatchRequest(
    @NotEmpty(message = "readings array must not be empty")
    List<@Valid SensorReadingItemDto> readings
) {}
