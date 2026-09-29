package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.client.MLPredictionClient;
import com.machinax.digitaltwin.dto.request.MLPredictionClientRequest;
import com.machinax.digitaltwin.dto.response.MLPredictionClientResponse;
import com.machinax.digitaltwin.dto.response.MLPredictionResponse;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.DigitalTwinState;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.entity.MLPrediction;
import com.machinax.digitaltwin.model.enums.FaultType;
import com.machinax.digitaltwin.model.enums.MLStage;
import com.machinax.digitaltwin.repository.DigitalTwinStateRepository;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MLPredictionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class MLPredictionService {

    private final MachineRepository machineRepository;
    private final MLPredictionRepository mlPredictionRepository;
    private final DigitalTwinStateRepository digitalTwinStateRepository;
    private final MLPredictionClient mlPredictionClient;
    private final ExplainabilityService explainabilityService;
    private final RULService rulService;
    private final MaintenanceIntelligenceService maintenanceIntelligenceService;

    public MLPredictionService(MachineRepository machineRepository,
                               MLPredictionRepository mlPredictionRepository,
                               DigitalTwinStateRepository digitalTwinStateRepository,
                               MLPredictionClient mlPredictionClient,
                               ExplainabilityService explainabilityService,
                               RULService rulService,
                               MaintenanceIntelligenceService maintenanceIntelligenceService) {
        this.machineRepository = machineRepository;
        this.mlPredictionRepository = mlPredictionRepository;
        this.digitalTwinStateRepository = digitalTwinStateRepository;
        this.mlPredictionClient = mlPredictionClient;
        this.explainabilityService = explainabilityService;
        this.rulService = rulService;
        this.maintenanceIntelligenceService = maintenanceIntelligenceService;
    }

    public Optional<MLPrediction> predictAndSave(Long machineId, Map<String, Double> sensorValues, Instant recordedAt) {
        Machine machine = machineRepository.findById(machineId).orElse(null);
        if (machine == null) {
            log.warn("Cannot run ML prediction: Machine {} does not exist", machineId);
            return Optional.empty();
        }

        if (sensorValues == null || sensorValues.isEmpty()) {
            log.warn("Cannot run ML prediction: Sensor values empty for machine {}", machineId);
            return Optional.empty();
        }

        MLPredictionClientRequest request = MLPredictionClientRequest.builder()
                .machineId(machineId)
                .timestamp(recordedAt != null ? recordedAt : Instant.now())
                .sensors(sensorValues)
                .build();

        Optional<MLPredictionClientResponse> clientResponseOpt = mlPredictionClient.predict(request);
        if (clientResponseOpt.isEmpty()) {
            log.warn("ML Service did not return a prediction for machine {}", machineId);
            return Optional.empty();
        }

        MLPredictionClientResponse clientResponse = clientResponseOpt.get();
        FaultType mappedFault = mapFaultType(clientResponse.faultType());

        Map<String, Object> inputMap = new HashMap<>(sensorValues);
        Map<String, Object> outputMap = new HashMap<>();
        outputMap.put("faultType", clientResponse.faultType());
        outputMap.put("faultProbability", clientResponse.faultProbability());
        outputMap.put("anomalyDetected", clientResponse.anomalyDetected());
        outputMap.put("anomalyScore", clientResponse.anomalyScore());
        if (clientResponse.classProbabilities() != null) {
            outputMap.put("classProbabilities", clientResponse.classProbabilities());
        }
        if (clientResponse.explanation() != null) {
            outputMap.put("explanation", clientResponse.explanation());
        }
        if (clientResponse.rul() != null) {
            outputMap.put("rul", clientResponse.rul());
        }
        if (clientResponse.maintenance() != null) {
            outputMap.put("maintenance", clientResponse.maintenance());
        }

        Instant timestamp = clientResponse.predictionTimestamp() != null ? clientResponse.predictionTimestamp() : Instant.now();
        String modelVersion = clientResponse.modelVersion() != null ? clientResponse.modelVersion() : "1.0";

        MLPrediction prediction = MLPrediction.builder()
                .machine(machine)
                .stage(MLStage.FAULT)
                .modelName("XGBoost + Isolation Forest")
                .modelVersion(modelVersion)
                .inputFeatures(inputMap)
                .output(outputMap)
                .anomalyScore(clientResponse.anomalyScore())
                .faultType(mappedFault)
                .faultProbability(clientResponse.faultProbability())
                .processingTimeMs(clientResponse.processingTimeMs())
                .createdAt(timestamp)
                .build();

        MLPrediction savedPrediction = mlPredictionRepository.save(prediction);

        // Phase 7: Persist SHAP Explanations
        if (clientResponse.explanation() != null) {
            explainabilityService.saveExplanations(savedPrediction, clientResponse.explanation());
        }

        // Phase 7: Persist RUL Prediction
        if (clientResponse.rul() != null) {
            rulService.saveRULPrediction(machineId, clientResponse.rul(), timestamp, modelVersion);
        }

        // Phase 7: Persist Maintenance Recommendation
        if (clientResponse.maintenance() != null) {
            maintenanceIntelligenceService.saveRecommendation(machineId, clientResponse.maintenance(), timestamp);
        }

        // Update Digital Twin state with ML predictions
        digitalTwinStateRepository.findByMachineId(machineId).ifPresent(state -> {
            state.setCurrentFaultType(mappedFault);
            state.setFaultProbability(clientResponse.faultProbability());
            if (Boolean.TRUE.equals(clientResponse.anomalyDetected())) {
                state.setAnomalyDetected(true);
            }
            digitalTwinStateRepository.save(state);
        });

        log.info("Saved ML prediction ID {} for machine {}: Fault={}, Prob={}, AnomalyScore={}",
                savedPrediction.getId(), machineId, mappedFault, clientResponse.faultProbability(), clientResponse.anomalyScore());

        return Optional.of(savedPrediction);
    }


    @Transactional(readOnly = true)
    public Optional<MLPredictionResponse> getLatestPrediction(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }

        return mlPredictionRepository.findFirstByMachineIdOrderByCreatedAtDesc(machineId)
                .map(MLPredictionResponse::fromEntity);
    }

    private FaultType mapFaultType(String rawType) {
        if (rawType == null || rawType.isBlank() || "NORMAL".equalsIgnoreCase(rawType)) {
            return FaultType.NONE;
        }
        try {
            return FaultType.valueOf(rawType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.warn("Unrecognized fault type: {}. Defaulting to UNCLASSIFIED", rawType);
            return FaultType.UNCLASSIFIED;
        }
    }
}
