package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.request.CreateMachineSensorRequest;
import com.machinax.digitaltwin.dto.request.UpdateMachineSensorRequest;
import com.machinax.digitaltwin.dto.response.MachineSensorResponse;
import com.machinax.digitaltwin.service.MachineSensorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/machines/{machineId}/sensors")
public class MachineSensorController {

    private final MachineSensorService machineSensorService;

    public MachineSensorController(MachineSensorService machineSensorService) {
        this.machineSensorService = machineSensorService;
    }

    @GetMapping
    public ResponseEntity<List<MachineSensorResponse>> getSensorsByMachineId(@PathVariable Long machineId) {
        return ResponseEntity.ok(machineSensorService.getSensorsByMachineId(machineId));
    }

    @GetMapping("/{sensorId}")
    public ResponseEntity<MachineSensorResponse> getSensorById(@PathVariable Long machineId, @PathVariable Long sensorId) {
        return ResponseEntity.ok(machineSensorService.getSensorById(machineId, sensorId));
    }

    @PostMapping
    public ResponseEntity<MachineSensorResponse> create(@PathVariable Long machineId, @Valid @RequestBody CreateMachineSensorRequest request) {
        MachineSensorResponse created = machineSensorService.create(machineId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{sensorId}")
    public ResponseEntity<MachineSensorResponse> update(@PathVariable Long machineId,
                                                        @PathVariable Long sensorId,
                                                        @Valid @RequestBody UpdateMachineSensorRequest request) {
        return ResponseEntity.ok(machineSensorService.update(machineId, sensorId, request));
    }

    @DeleteMapping("/{sensorId}")
    public ResponseEntity<Void> delete(@PathVariable Long machineId, @PathVariable Long sensorId) {
        machineSensorService.delete(machineId, sensorId);
        return ResponseEntity.noContent().build();
    }
}
