package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.response.RULPredictionResponse;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.entity.RULPrediction;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.RULPredictionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;


@Service
@Transactional
@Slf4j
public class RULService {

    private final MachineRepository machineRepository;
    private final RULPredictionRepository rulPredictionRepository;

    public RULService(MachineRepository machineRepository,
                      RULPredictionRepository rulPredictionRepository) {
        this.machineRepository = machineRepository;
        this.rulPredictionRepository = rulPredictionRepository;
    }

    public Optional<RULPrediction> saveRULPrediction(Long machineId, Map<String, Object> rulData, Instant predictionTime, String modelVersion) {
        if (rulData == null) {
            return Optional.empty();
        }

        Machine machine = machineRepository.findById(machineId).orElse(null);
        if (machine == null) {
            return Optional.empty();
        }

        try {
            BigDecimal hours = toBigDecimal(rulData.get("estimatedRulHours"));
            String confidence = String.valueOf(rulData.getOrDefault("confidence", "MEDIUM"));
            String trend = String.valueOf(rulData.getOrDefault("degradationTrend", "STABLE"));
            String version = modelVersion != null ? modelVersion : "1.0";

            RULPrediction prediction = RULPrediction.builder()
                    .machine(machine)
                    .estimatedRulHours(hours != null ? hours : BigDecimal.valueOf(5000.0))
                    .confidence(confidence)
                    .degradationTrend(trend)
                    .predictionTimestamp(predictionTime != null ? predictionTime : Instant.now())
                    .modelVersion(version)
                    .build();

            RULPrediction saved = rulPredictionRepository.save(prediction);
            log.debug("Saved RUL prediction ID {} for machine {}: {} hours ({})", saved.getId(), machineId, hours, trend);
            return Optional.of(saved);
        } catch (Exception e) {
            log.warn("Failed to persist RUL prediction for machine {}: {}", machineId, e.getMessage());
            return Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public Optional<RULPredictionResponse> getLatestRUL(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
        return rulPredictionRepository.findFirstByMachineIdOrderByIdDesc(machineId)
                .map(RULPredictionResponse::fromEntity);
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
