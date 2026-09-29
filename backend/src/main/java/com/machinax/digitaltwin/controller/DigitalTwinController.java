package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.response.DigitalTwinStateResponse;
import com.machinax.digitaltwin.service.DigitalTwinService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/machines/{machineId}/digital-twin")
public class DigitalTwinController {

    private final DigitalTwinService digitalTwinService;

    public DigitalTwinController(DigitalTwinService digitalTwinService) {
        this.digitalTwinService = digitalTwinService;
    }

    @GetMapping
    public ResponseEntity<DigitalTwinStateResponse> getDigitalTwinState(@PathVariable Long machineId) {
        DigitalTwinStateResponse state = digitalTwinService.getDigitalTwinState(machineId);
        return ResponseEntity.ok(state);
    }
}
