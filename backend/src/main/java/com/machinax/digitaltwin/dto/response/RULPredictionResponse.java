package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.RULPrediction;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record RULPredictionResponse(
    Long id,
    Long machineId,
    BigDecimal estimatedRulHours,
    String unit,
    String confidence,
    String degradationTrend,
    Instant predictionTimestamp,
    String modelVersion
) {
    public static RULPredictionResponse fromEntity(RULPrediction entity) {
        if (entity == null) {
            return null;
        }
        return RULPredictionResponse.builder()
                .id(entity.getId())
                .machineId(entity.getMachine() != null ? entity.getMachine().getId() : null)
                .estimatedRulHours(entity.getEstimatedRulHours())
                .unit("HOURS")
                .confidence(entity.getConfidence())
                .degradationTrend(entity.getDegradationTrend())
                .predictionTimestamp(entity.getPredictionTimestamp())
                .modelVersion(entity.getModelVersion())
                .build();
    }
}
