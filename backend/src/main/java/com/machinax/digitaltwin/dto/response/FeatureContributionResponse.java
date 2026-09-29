package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record FeatureContributionResponse(
    String feature,
    BigDecimal value,
    BigDecimal shapValue,
    String impact
) {}
