package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

@Builder
public record MaintenanceSummaryDto(
    String priority,
    String recommendation
) {}
