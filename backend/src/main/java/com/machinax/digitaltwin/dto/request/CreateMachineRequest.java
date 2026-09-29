package com.machinax.digitaltwin.dto.request;

import com.machinax.digitaltwin.model.enums.MachineStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateMachineRequest(
    @NotNull(message = "machineTypeId is required")
    Long machineTypeId,

    @NotBlank(message = "Machine name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @NotBlank(message = "Serial number is required")
    @Size(max = 100, message = "Serial number must not exceed 100 characters")
    String serialNumber,

    @Size(max = 150, message = "Location must not exceed 150 characters")
    String location,

    @Positive(message = "Rated power must be positive")
    BigDecimal ratedPowerKw,

    @Positive(message = "Rated voltage must be positive")
    BigDecimal ratedVoltageV,

    @Positive(message = "Rated current must be positive")
    BigDecimal ratedCurrentA,

    @Positive(message = "Rated speed must be positive")
    BigDecimal ratedSpeedRpm,

    LocalDate installationDate,

    MachineStatus status
) {}
