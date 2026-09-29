package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.request.SensorReadingBatchRequest;
import com.machinax.digitaltwin.dto.request.SensorReadingItemDto;
import com.machinax.digitaltwin.dto.response.SensorIngestionResponse;
import com.machinax.digitaltwin.dto.response.SensorReadingResponse;
import com.machinax.digitaltwin.dto.response.SensorTrendPointResponse;
import com.machinax.digitaltwin.exception.BadRequestException;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.MachineSensor;
import com.machinax.digitaltwin.model.entity.SensorReading;
import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MachineSensorRepository;
import com.machinax.digitaltwin.repository.SensorReadingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SensorIngestionService {

    private final MachineRepository machineRepository;
    private final MachineSensorRepository machineSensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final DigitalTwinService digitalTwinService;
    private final MLPredictionService mlPredictionService;

    public SensorIngestionService(MachineRepository machineRepository,
                                  MachineSensorRepository machineSensorRepository,
                                  SensorReadingRepository sensorReadingRepository,
                                  DigitalTwinService digitalTwinService,
                                  MLPredictionService mlPredictionService) {
        this.machineRepository = machineRepository;
        this.machineSensorRepository = machineSensorRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.digitalTwinService = digitalTwinService;
        this.mlPredictionService = mlPredictionService;
    }

    public SensorIngestionResponse ingestBatch(Long machineId, SensorReadingBatchRequest request) {
        verifyMachineExists(machineId);

        if (request == null || request.readings() == null || request.readings().isEmpty()) {
            throw new BadRequestException("Readings batch must not be empty");
        }

        List<MachineSensor> machineSensors = machineSensorRepository.findByMachineId(machineId);
        Map<Long, MachineSensor> sensorById = machineSensors.stream()
                .collect(Collectors.toMap(MachineSensor::getId, s -> s));
        Map<String, MachineSensor> sensorByType = machineSensors.stream()
                .filter(s -> s.getSensorType() != null && s.getSensorType().getName() != null)
                .collect(Collectors.toMap(
                        s -> s.getSensorType().getName().trim().toUpperCase(),
                        s -> s,
                        (existing, replacement) -> existing
                ));

        List<SensorReading> readingsToSave = new ArrayList<>(request.readings().size());
        Map<String, Double> sensorValuesForML = new HashMap<>();
        Instant latestBatchTime = null;

        for (int i = 0; i < request.readings().size(); i++) {
            SensorReadingItemDto item = request.readings().get(i);
            MachineSensor sensor = resolveSensor(item, machineId, sensorById, sensorByType, i);

            if (!Boolean.TRUE.equals(sensor.getIsActive())) {
                throw new BadRequestException("Sensor " + sensor.getLabel() + " (ID: " + sensor.getId() + ") is inactive on machine " + machineId);
            }

            if (item.value() == null) {
                throw new BadRequestException("Reading value is required at index " + i);
            }
            if (item.recordedAt() == null) {
                throw new BadRequestException("Reading recordedAt timestamp is required at index " + i);
            }

            if (latestBatchTime == null || item.recordedAt().isAfter(latestBatchTime)) {
                latestBatchTime = item.recordedAt();
            }

            String unit = (item.unit() != null && !item.unit().isBlank())
                    ? item.unit().trim()
                    : (sensor.getSensorType() != null ? sensor.getSensorType().getUnit() : "");

            ReadingQuality quality = item.quality() != null ? item.quality() : ReadingQuality.GOOD;
            SensorSource source = item.source() != null ? item.source() : SensorSource.SIMULATED;

            SensorReading reading = SensorReading.builder()
                    .machineSensor(sensor)
                    .value(item.value())
                    .unit(unit)
                    .quality(quality)
                    .source(source)
                    .recordedAt(item.recordedAt())
                    .build();

            readingsToSave.add(reading);

            if (sensor.getSensorType() != null && sensor.getSensorType().getName() != null) {
                sensorValuesForML.put(sensor.getSensorType().getName().trim().toUpperCase(), item.value().doubleValue());
            }
        }

        List<SensorReading> saved = sensorReadingRepository.saveAllAndFlush(readingsToSave);

        // Update live Digital Twin state for this machine (rule-based)
        digitalTwinService.updateAndGetDigitalTwinState(machineId);

        // Trigger ML prediction (as an enhancement layer — failures are non-blocking)
        try {
            if (!sensorValuesForML.isEmpty()) {
                mlPredictionService.predictAndSave(machineId, sensorValuesForML, latestBatchTime);
            }
        } catch (Exception ex) {
            org.slf4j.LoggerFactory.getLogger(SensorIngestionService.class)
                    .warn("Non-fatal error running ML prediction for machine {}: {}", machineId, ex.getMessage());
        }

        return SensorIngestionResponse.builder()
                .machineId(machineId)
                .accepted(saved.size())
                .rejected(0)
                .ingestedAt(Instant.now())
                .errors(List.of())
                .build();
    }


    @Transactional(readOnly = true)
    public Page<SensorReadingResponse> getReadings(Long machineId, Long sensorId, Instant startTime, Instant endTime, Pageable pageable) {
        verifyMachineExists(machineId);
        if (sensorId != null) {
            machineSensorRepository.findByIdAndMachineId(sensorId, machineId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sensor with ID " + sensorId + " not found for machine " + machineId));
        }

        org.springframework.data.jpa.domain.Specification<SensorReading> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("machineSensor").get("machine").get("id"), machineId));
            if (sensorId != null) {
                predicates.add(cb.equal(root.get("machineSensor").get("id"), sensorId));
            }
            if (startTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("recordedAt"), startTime));
            }
            if (endTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("recordedAt"), endTime));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return sensorReadingRepository.findAll(spec, pageable)
                .map(SensorReadingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SensorTrendPointResponse> getSensorTrend(Long machineId, Long sensorId, int limit) {
        verifyMachineExists(machineId);

        MachineSensor sensor = machineSensorRepository.findByIdAndMachineId(sensorId, machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor with ID " + sensorId + " not found for machine " + machineId));

        int clampedLimit = Math.max(1, Math.min(limit, 1000));
        List<SensorReading> latestDescending = sensorReadingRepository.findLatestBySensorId(sensorId, PageRequest.of(0, clampedLimit));

        // Return chronological order (oldest to newest among latest N readings)
        List<SensorReading> chronological = new ArrayList<>(latestDescending);
        Collections.reverse(chronological);

        return chronological.stream()
                .map(r -> SensorTrendPointResponse.builder()
                        .id(r.getId())
                        .sensorId(sensor.getId())
                        .sensorType(sensor.getSensorType() != null ? sensor.getSensorType().getName() : null)
                        .value(r.getValue())
                        .unit(r.getUnit())
                        .timestamp(r.getRecordedAt())
                        .build())
                .toList();
    }

    private MachineSensor resolveSensor(SensorReadingItemDto item,
                                        Long machineId,
                                        Map<Long, MachineSensor> sensorById,
                                        Map<String, MachineSensor> sensorByType,
                                        int index) {
        if (item.sensorId() != null) {
            MachineSensor sensor = sensorById.get(item.sensorId());
            if (sensor == null) {
                // Check if it exists globally or belongs to another machine
                boolean existsGlobally = machineSensorRepository.existsById(item.sensorId());
                if (existsGlobally) {
                    throw new BadRequestException("Sensor with ID " + item.sensorId() + " does not belong to machine " + machineId + " (index " + index + ")");
                }
                throw new ResourceNotFoundException("Sensor with ID " + item.sensorId() + " not found for machine " + machineId);
            }
            return sensor;
        }

        if (item.sensorType() != null && !item.sensorType().isBlank()) {
            MachineSensor sensor = sensorByType.get(item.sensorType().trim().toUpperCase());
            if (sensor == null) {
                throw new BadRequestException("No sensor of type '" + item.sensorType() + "' found on machine " + machineId + " (index " + index + ")");
            }
            return sensor;
        }

        throw new BadRequestException("Each reading must specify either sensorId or sensorType (index " + index + ")");
    }

    private void verifyMachineExists(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
    }
}
