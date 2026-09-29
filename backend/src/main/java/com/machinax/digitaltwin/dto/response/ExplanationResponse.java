package com.machinax.digitaltwin.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

@Builder
public record ExplanationResponse(
    Long machineId,
    Long mlPredictionId,
    String faultType,
    BigDecimal faultProbability,
    List<FeatureContributionResponse> features,
    String summary,
    String modelVersion
) {}
