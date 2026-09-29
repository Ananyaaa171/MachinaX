package com.machinax.digitaltwin.controller;

import com.machinax.digitaltwin.dto.request.SensorReadingBatchRequest;
import com.machinax.digitaltwin.dto.response.SensorIngestionResponse;
import com.machinax.digitaltwin.dto.response.SensorReadingResponse;
import com.machinax.digitaltwin.dto.response.SensorTrendPointResponse;
import com.machinax.digitaltwin.service.SensorIngestionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/machines/{machineId}")
public class SensorController {

    private final SensorIngestionService sensorIngestionService;

    public SensorController(SensorIngestionService sensorIngestionService) {
        this.sensorIngestionService = sensorIngestionService;
    }

    @PostMapping("/readings")
    public ResponseEntity<SensorIngestionResponse> ingestReadings(
            @PathVariable Long machineId,
            @Valid @RequestBody SensorReadingBatchRequest request) {
        SensorIngestionResponse response = sensorIngestionService.ingestBatch(machineId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/readings")
    public ResponseEntity<Page<SensorReadingResponse>> getReadings(
            @PathVariable Long machineId,
            @RequestParam(required = false) Long sensorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime,
            @PageableDefault(size = 50, sort = "recordedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SensorReadingResponse> readings = sensorIngestionService.getReadings(machineId, sensorId, startTime, endTime, pageable);
        return ResponseEntity.ok(readings);
    }

    @GetMapping("/sensors/{sensorId}/trend")
    public ResponseEntity<List<SensorTrendPointResponse>> getSensorTrend(
            @PathVariable Long machineId,
            @PathVariable Long sensorId,
            @RequestParam(defaultValue = "60") int limit) {
        List<SensorTrendPointResponse> trend = sensorIngestionService.getSensorTrend(machineId, sensorId, limit);
        return ResponseEntity.ok(trend);
    }
}
