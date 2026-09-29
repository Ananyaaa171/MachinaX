package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record RULSummaryDto(
    BigDecimal estimatedHours,
    String confidence,
    String degradationTrend
) {}
