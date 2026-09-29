package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.entity.MLPrediction;
import com.machinax.digitaltwin.model.enums.FaultType;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Builder
public record MLPredictionResponse(
    Long id,
    Long machineId,
    Boolean anomalyDetected,
    BigDecimal anomalyScore,
    FaultType faultType,
    BigDecimal faultProbability,
    String modelVersion,
    String modelName,
    Map<String, Object> inputFeatures,
    Map<String, Object> output,
    Integer processingTimeMs,
    Instant predictionTimestamp,
    Instant createdAt
) {
    public static MLPredictionResponse fromEntity(MLPrediction entity) {
        if (entity == null) {
            return null;
        }

        boolean anomalyDetected = entity.getAnomalyScore() != null 
                && entity.getAnomalyScore().compareTo(new BigDecimal("0.5000")) >= 0;

        return MLPredictionResponse.builder()
                .id(entity.getId())
                .machineId(entity.getMachine() != null ? entity.getMachine().getId() : null)
                .anomalyDetected(anomalyDetected)
                .anomalyScore(entity.getAnomalyScore())
                .faultType(entity.getFaultType())
                .faultProbability(entity.getFaultProbability())
                .modelVersion(entity.getModelVersion())
                .modelName(entity.getModelName())
                .inputFeatures(entity.getInputFeatures())
                .output(entity.getOutput())
                .processingTimeMs(entity.getProcessingTimeMs())
                .predictionTimestamp(entity.getCreatedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
