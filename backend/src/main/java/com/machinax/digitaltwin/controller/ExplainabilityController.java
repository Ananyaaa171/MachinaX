package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.response.ExplanationResponse;
import com.machinax.digitaltwin.service.ExplainabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/machines")
public class ExplainabilityController {

    private final ExplainabilityService explainabilityService;

    public ExplainabilityController(ExplainabilityService explainabilityService) {
        this.explainabilityService = explainabilityService;
    }

    @GetMapping("/{machineId}/explanations/latest")
    public ResponseEntity<ExplanationResponse> getLatestExplanation(@PathVariable Long machineId) {
        return explainabilityService.getLatestExplanation(machineId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
