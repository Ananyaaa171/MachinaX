package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.response.MLPredictionResponse;
import com.machinax.digitaltwin.service.MLPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/machines")
public class MLPredictionController {

    private final MLPredictionService mlPredictionService;

    public MLPredictionController(MLPredictionService mlPredictionService) {
        this.mlPredictionService = mlPredictionService;
    }

    @GetMapping("/{machineId}/ml-prediction/latest")
    public ResponseEntity<MLPredictionResponse> getLatestPrediction(@PathVariable Long machineId) {
        return mlPredictionService.getLatestPrediction(machineId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
