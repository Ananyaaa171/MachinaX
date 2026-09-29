package com.machinax.digitaltwin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSensorTypeRequest(
    @NotBlank(message = "Unit is required")
    @Size(max = 30, message = "Unit must not exceed 30 characters")
    String unit,

    String description,

    @NotBlank(message = "Physical quantity is required")
    @Size(max = 100, message = "Physical quantity must not exceed 100 characters")
    String physicalQuantity
) {}
