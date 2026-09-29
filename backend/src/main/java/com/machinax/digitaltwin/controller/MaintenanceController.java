package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.response.MaintenanceRecommendationResponse;
import com.machinax.digitaltwin.service.MaintenanceIntelligenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/machines")
public class MaintenanceController {

    private final MaintenanceIntelligenceService maintenanceIntelligenceService;

    public MaintenanceController(MaintenanceIntelligenceService maintenanceIntelligenceService) {
        this.maintenanceIntelligenceService = maintenanceIntelligenceService;
    }

    @GetMapping("/{machineId}/maintenance/latest")
    public ResponseEntity<MaintenanceRecommendationResponse> getLatestMaintenance(@PathVariable Long machineId) {
        return maintenanceIntelligenceService.getLatestRecommendation(machineId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
