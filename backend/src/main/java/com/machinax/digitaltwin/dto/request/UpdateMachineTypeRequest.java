package com.machinax.digitaltwin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateMachineTypeRequest(
    @NotBlank(message = "Display name is required")
    @Size(max = 150, message = "Display name must not exceed 150 characters")
    String displayName,

    String description,

    @Size(max = 100, message = "Manufacturer model must not exceed 100 characters")
    String manufacturerModel
) {}
