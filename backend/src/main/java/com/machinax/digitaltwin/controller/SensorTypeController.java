package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.request.CreateSensorTypeRequest;
import com.machinax.digitaltwin.dto.request.UpdateSensorTypeRequest;
import com.machinax.digitaltwin.dto.response.SensorTypeResponse;
import com.machinax.digitaltwin.service.SensorTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sensor-types")
public class SensorTypeController {

    private final SensorTypeService sensorTypeService;

    public SensorTypeController(SensorTypeService sensorTypeService) {
        this.sensorTypeService = sensorTypeService;
    }

    @GetMapping
    public ResponseEntity<List<SensorTypeResponse>> getAll() {
        return ResponseEntity.ok(sensorTypeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SensorTypeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sensorTypeService.getById(id));
    }

    @PostMapping
    public ResponseEntity<SensorTypeResponse> create(@Valid @RequestBody CreateSensorTypeRequest request) {
        SensorTypeResponse created = sensorTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SensorTypeResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateSensorTypeRequest request) {
        return ResponseEntity.ok(sensorTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sensorTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
