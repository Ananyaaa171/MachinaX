package com.machinax.digitaltwin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateMachineSensorRequest(
    Long sensorTypeId,

    @NotBlank(message = "Sensor label is required")
    @Size(max = 100, message = "Label must not exceed 100 characters")
    String label,

    BigDecimal normalMin,
    BigDecimal normalMax,
    BigDecimal warningMin,
    BigDecimal warningMax,
    BigDecimal criticalMin,
    BigDecimal criticalMax,
    Boolean isActive
) {}
