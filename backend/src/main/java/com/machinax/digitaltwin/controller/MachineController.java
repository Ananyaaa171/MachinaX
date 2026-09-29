package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.request.CreateMachineRequest;
import com.machinax.digitaltwin.dto.request.UpdateMachineRequest;
import com.machinax.digitaltwin.dto.response.MachineResponse;
import com.machinax.digitaltwin.model.enums.MachineStatus;
import com.machinax.digitaltwin.service.MachineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/machines")
public class MachineController {

    private final MachineService machineService;

    public MachineController(MachineService machineService) {
        this.machineService = machineService;
    }

    @GetMapping
    public ResponseEntity<List<MachineResponse>> getAll(@RequestParam(required = false) MachineStatus status) {
        return ResponseEntity.ok(machineService.getAll(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(machineService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MachineResponse> create(@Valid @RequestBody CreateMachineRequest request) {
        MachineResponse created = machineService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MachineResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateMachineRequest request) {
        return ResponseEntity.ok(machineService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        machineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
