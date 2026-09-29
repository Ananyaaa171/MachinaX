package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.response.RULPredictionResponse;
import com.machinax.digitaltwin.service.RULService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/machines")
public class RULController {

    private final RULService rulService;

    public RULController(RULService rulService) {
        this.rulService = rulService;
    }

    @GetMapping("/{machineId}/rul/latest")
    public ResponseEntity<RULPredictionResponse> getLatestRUL(@PathVariable Long machineId) {
        return rulService.getLatestRUL(machineId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
