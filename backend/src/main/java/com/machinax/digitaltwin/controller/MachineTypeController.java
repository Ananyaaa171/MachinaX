package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.request.CreateMachineTypeRequest;
import com.machinax.digitaltwin.dto.request.UpdateMachineTypeRequest;
import com.machinax.digitaltwin.dto.response.MachineTypeResponse;
import com.machinax.digitaltwin.service.MachineTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/machine-types")
public class MachineTypeController {

    private final MachineTypeService machineTypeService;

    public MachineTypeController(MachineTypeService machineTypeService) {
        this.machineTypeService = machineTypeService;
    }

    @GetMapping
    public ResponseEntity<List<MachineTypeResponse>> getAll() {
        return ResponseEntity.ok(machineTypeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineTypeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(machineTypeService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MachineTypeResponse> create(@Valid @RequestBody CreateMachineTypeRequest request) {
        MachineTypeResponse created = machineTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MachineTypeResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateMachineTypeRequest request) {
        return ResponseEntity.ok(machineTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        machineTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
