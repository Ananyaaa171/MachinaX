package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.response.MaintenanceRecommendationResponse;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.entity.MaintenanceRecommendation;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MaintenanceRecommendationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class MaintenanceIntelligenceService {

    private final MachineRepository machineRepository;
    private final MaintenanceRecommendationRepository maintenanceRecommendationRepository;

    public MaintenanceIntelligenceService(MachineRepository machineRepository,
                                          MaintenanceRecommendationRepository maintenanceRecommendationRepository) {
        this.machineRepository = machineRepository;
        this.maintenanceRecommendationRepository = maintenanceRecommendationRepository;
    }

    public Optional<MaintenanceRecommendation> saveRecommendation(Long machineId, Map<String, Object> maintData, Instant generatedAt) {
        if (maintData == null) {
            return Optional.empty();
        }

        Machine machine = machineRepository.findById(machineId).orElse(null);
        if (machine == null) {
            return Optional.empty();
        }

        try {
            String priority = String.valueOf(maintData.getOrDefault("priority", "P3_MONITOR"));
            String faultType = String.valueOf(maintData.getOrDefault("faultType", "NORMAL"));
            String recommendation = String.valueOf(maintData.getOrDefault("recommendation", "Continue standard monitoring."));

            MaintenanceRecommendation entity = MaintenanceRecommendation.builder()
                    .machine(machine)
                    .priority(priority)
                    .faultType(faultType)
                    .recommendation(recommendation)
                    .generatedAt(generatedAt != null ? generatedAt : Instant.now())
                    .status("ACTIVE")
                    .build();

            MaintenanceRecommendation saved = maintenanceRecommendationRepository.save(entity);
            log.debug("Saved Maintenance recommendation ID {} for machine {}: Priority={}", saved.getId(), machineId, priority);
            return Optional.of(saved);
        } catch (Exception e) {
            log.warn("Failed to persist maintenance recommendation for machine {}: {}", machineId, e.getMessage());
            return Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public Optional<MaintenanceRecommendationResponse> getLatestRecommendation(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
        return maintenanceRecommendationRepository.findFirstByMachineIdOrderByIdDesc(machineId)
                .map(MaintenanceRecommendationResponse::fromEntity);
    }
}
