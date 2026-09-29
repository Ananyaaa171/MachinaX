package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.response.ExplanationResponse;
import com.machinax.digitaltwin.dto.response.FeatureContributionResponse;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.MLPrediction;
import com.machinax.digitaltwin.model.entity.PredictionExplanation;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MLPredictionRepository;
import com.machinax.digitaltwin.repository.PredictionExplanationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class ExplainabilityService {

    private final MachineRepository machineRepository;
    private final MLPredictionRepository mlPredictionRepository;
    private final PredictionExplanationRepository predictionExplanationRepository;

    public ExplainabilityService(MachineRepository machineRepository,
                                 MLPredictionRepository mlPredictionRepository,
                                 PredictionExplanationRepository predictionExplanationRepository) {
        this.machineRepository = machineRepository;
        this.mlPredictionRepository = mlPredictionRepository;
        this.predictionExplanationRepository = predictionExplanationRepository;
    }

    public void saveExplanations(MLPrediction mlPrediction, Map<String, Object> explanationData) {
        if (mlPrediction == null || explanationData == null) {
            return;
        }

        try {
            String summary = (String) explanationData.get("summary");
            Object featuresObj = explanationData.get("features");

            if (featuresObj instanceof List<?> featureList) {
                List<PredictionExplanation> entities = new ArrayList<>();
                for (Object item : featureList) {
                    if (item instanceof Map<?, ?> map) {
                        String featureName = String.valueOf(map.get("feature"));
                        BigDecimal featureVal = toBigDecimal(map.get("value"));
                        BigDecimal shapVal = toBigDecimal(map.get("shapValue"));
                        String impact = String.valueOf(map.get("impact"));

                        PredictionExplanation entity = PredictionExplanation.builder()
                                .mlPrediction(mlPrediction)
                                .featureName(featureName)
                                .featureValue(featureVal != null ? featureVal : BigDecimal.ZERO)
                                .shapValue(shapVal != null ? shapVal : BigDecimal.ZERO)
                                .impact(impact)
                                .explanation(summary)
                                .build();
                        entities.add(entity);
                    }
                }
                if (!entities.isEmpty()) {
                    predictionExplanationRepository.saveAll(entities);
                    log.debug("Persisted {} SHAP feature explanations for prediction ID {}", entities.size(), mlPrediction.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to persist SHAP explanations for prediction {}: {}", mlPrediction.getId(), e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Optional<ExplanationResponse> getLatestExplanation(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }

        Optional<MLPrediction> latestPredOpt = mlPredictionRepository.findFirstByMachineIdOrderByCreatedAtDesc(machineId);
        if (latestPredOpt.isEmpty()) {
            return Optional.empty();
        }

        MLPrediction pred = latestPredOpt.get();
        List<PredictionExplanation> explanations = predictionExplanationRepository.findByMlPredictionId(pred.getId());
        
        List<FeatureContributionResponse> featureDtos = explanations.stream()
                .map(e -> FeatureContributionResponse.builder()
                        .feature(e.getFeatureName())
                        .value(e.getFeatureValue())
                        .shapValue(e.getShapValue())
                        .impact(e.getImpact())
                        .build())
                .toList();

        String summary = explanations.isEmpty() ? null : explanations.get(0).getExplanation();
        if (summary == null && pred.getOutput() != null && pred.getOutput().containsKey("explanation")) {
            Object expObj = pred.getOutput().get("explanation");
            if (expObj instanceof Map<?, ?> map) {
                summary = (String) map.get("summary");
            }
        }

        return Optional.of(ExplanationResponse.builder()
                .machineId(machineId)
                .mlPredictionId(pred.getId())
                .faultType(pred.getFaultType() != null ? pred.getFaultType().name() : "NORMAL")
                .faultProbability(pred.getFaultProbability())
                .features(featureDtos)
                .summary(summary)
                .modelVersion(pred.getModelVersion())
                .build());
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return null;
        if (obj instanceof BigDecimal bd) return bd;
        if (obj instanceof Number num) return BigDecimal.valueOf(num.doubleValue());
        try {
            return new BigDecimal(String.valueOf(obj));
        } catch (Exception e) {
            return null;
        }
    }
}
