package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.response.*;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.*;
import com.machinax.digitaltwin.model.enums.FaultType;
import com.machinax.digitaltwin.model.enums.OperatingState;
import com.machinax.digitaltwin.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DigitalTwinService {

    private final MachineRepository machineRepository;
    private final MachineSensorRepository machineSensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final DigitalTwinStateRepository digitalTwinStateRepository;
    private final RULPredictionRepository rulPredictionRepository;
    private final MaintenanceRecommendationRepository maintenanceRecommendationRepository;
    private final MLPredictionRepository mlPredictionRepository;
    private final PredictionExplanationRepository predictionExplanationRepository;

    public DigitalTwinService(MachineRepository machineRepository,
                              MachineSensorRepository machineSensorRepository,
                              SensorReadingRepository sensorReadingRepository,
                              DigitalTwinStateRepository digitalTwinStateRepository,
                              RULPredictionRepository rulPredictionRepository,
                              MaintenanceRecommendationRepository maintenanceRecommendationRepository,
                              MLPredictionRepository mlPredictionRepository,
                              PredictionExplanationRepository predictionExplanationRepository) {
        this.machineRepository = machineRepository;
        this.machineSensorRepository = machineSensorRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.digitalTwinStateRepository = digitalTwinStateRepository;
        this.rulPredictionRepository = rulPredictionRepository;
        this.maintenanceRecommendationRepository = maintenanceRecommendationRepository;
        this.mlPredictionRepository = mlPredictionRepository;
        this.predictionExplanationRepository = predictionExplanationRepository;
    }

    public DigitalTwinStateResponse updateAndGetDigitalTwinState(Long machineId) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + machineId));

        List<MachineSensor> sensors = machineSensorRepository.findByMachineId(machineId);
        List<LatestSensorValueDto> latestSensorDtos = new ArrayList<>();

        double totalWeightedPenalty = 0.0;
        int activeReadingCount = 0;
        boolean hasCriticalSensor = false;
        boolean hasWarningSensor = false;
        Instant latestBatchTime = null;

        for (MachineSensor sensor : sensors) {
            if (!Boolean.TRUE.equals(sensor.getIsActive())) {
                continue;
            }

            List<SensorReading> latestList = sensorReadingRepository.findLatestBySensorId(sensor.getId(), PageRequest.of(0, 1));
            if (latestList.isEmpty()) {
                latestSensorDtos.add(LatestSensorValueDto.builder()
                        .sensorId(sensor.getId())
                        .sensorLabel(sensor.getLabel())
                        .sensorType(sensor.getSensorType() != null ? sensor.getSensorType().getName() : null)
                        .value(null)
                        .unit(sensor.getSensorType() != null ? sensor.getSensorType().getUnit() : "")
                        .status("UNKNOWN")
                        .normalMin(sensor.getNormalMin())
                        .normalMax(sensor.getNormalMax())
                        .warningMin(sensor.getWarningMin())
                        .warningMax(sensor.getWarningMax())
                        .criticalMin(sensor.getCriticalMin())
                        .criticalMax(sensor.getCriticalMax())
                        .recordedAt(null)
                        .build());
                continue;
            }

            SensorReading reading = latestList.get(0);
            activeReadingCount++;

            if (latestBatchTime == null || reading.getRecordedAt().isAfter(latestBatchTime)) {
                latestBatchTime = reading.getRecordedAt();
            }

            SensorEvaluation eval = evaluateSensor(sensor, reading.getValue());
            if ("CRITICAL".equals(eval.status)) {
                hasCriticalSensor = true;
            } else if ("WARNING".equals(eval.status)) {
                hasWarningSensor = true;
            }

            totalWeightedPenalty += eval.penalty;

            latestSensorDtos.add(LatestSensorValueDto.builder()
                    .sensorId(sensor.getId())
                    .sensorLabel(sensor.getLabel())
                    .sensorType(sensor.getSensorType() != null ? sensor.getSensorType().getName() : null)
                    .value(reading.getValue())
                    .unit(reading.getUnit())
                    .status(eval.status)
                    .normalMin(sensor.getNormalMin())
                    .normalMax(sensor.getNormalMax())
                    .warningMin(sensor.getWarningMin())
                    .warningMax(sensor.getWarningMax())
                    .criticalMin(sensor.getCriticalMin())
                    .criticalMax(sensor.getCriticalMax())
                    .recordedAt(reading.getRecordedAt())
                    .build());
        }

        BigDecimal healthScore;
        BigDecimal anomalyScore;
        boolean anomalyDetected;
        OperatingState operatingState;

        if (activeReadingCount == 0) {
            healthScore = new BigDecimal("100.00");
            anomalyScore = new BigDecimal("0.0000");
            anomalyDetected = false;
            operatingState = OperatingState.UNKNOWN;
        } else {
            // Rule-based health score calculation
            double baseHealth = Math.max(0.0, Math.min(100.0, 100.0 - totalWeightedPenalty));
            healthScore = BigDecimal.valueOf(baseHealth).setScale(2, RoundingMode.HALF_UP);

            // Anomaly score: (100 - healthScore) / 100
            double rawAnomaly = (100.0 - healthScore.doubleValue()) / 100.0;
            anomalyScore = BigDecimal.valueOf(Math.max(0.0, Math.min(1.0, rawAnomaly))).setScale(4, RoundingMode.HALF_UP);

            anomalyDetected = hasCriticalSensor || (anomalyScore.compareTo(new BigDecimal("0.2500")) >= 0);

            // Operating state mapping
            if (hasCriticalSensor || healthScore.compareTo(new BigDecimal("40.00")) < 0) {
                operatingState = OperatingState.CRITICAL;
            } else if (hasWarningSensor || healthScore.compareTo(new BigDecimal("70.00")) < 0) {
                operatingState = OperatingState.WARNING;
            } else if (healthScore.compareTo(new BigDecimal("85.00")) < 0) {
                operatingState = OperatingState.WATCH;
            } else {
                operatingState = OperatingState.NORMAL;
            }
        }

        DigitalTwinState state = digitalTwinStateRepository.findByMachineId(machineId)
                .orElseGet(() -> DigitalTwinState.builder()
                        .machine(machine)
                        .currentFaultType(FaultType.NONE)
                        .build());

        state.setHealthScore(healthScore);
        state.setOperatingState(operatingState);
        state.setAnomalyDetected(anomalyDetected);
        state.setAnomalyScore(anomalyScore);
        state.setLastSensorBatchAt(latestBatchTime);
        state.setUpdatedAt(Instant.now());

        DigitalTwinState saved = digitalTwinStateRepository.save(state);

        // Fetch Phase 7 intelligence summaries
        RULSummaryDto rulSummary = rulPredictionRepository.findFirstByMachineIdOrderByIdDesc(machineId)
                .map(r -> RULSummaryDto.builder()
                        .estimatedHours(r.getEstimatedRulHours())
                        .confidence(r.getConfidence())
                        .degradationTrend(r.getDegradationTrend())
                        .build())
                .orElse(null);

        MaintenanceSummaryDto maintSummary = maintenanceRecommendationRepository.findFirstByMachineIdOrderByIdDesc(machineId)
                .map(m -> MaintenanceSummaryDto.builder()
                        .priority(m.getPriority())
                        .recommendation(m.getRecommendation())
                        .build())
                .orElse(null);

        ExplanationSummaryDto expSummary = null;
        Optional<MLPrediction> latestPredOpt = mlPredictionRepository.findFirstByMachineIdOrderByCreatedAtDesc(machineId);
        if (latestPredOpt.isPresent()) {
            MLPrediction pred = latestPredOpt.get();
            List<PredictionExplanation> explanations = predictionExplanationRepository.findByMlPredictionId(pred.getId());
            if (!explanations.isEmpty()) {
                expSummary = ExplanationSummaryDto.builder()
                        .summary(explanations.get(0).getExplanation())
                        .build();
            } else if (pred.getOutput() != null && pred.getOutput().get("explanation") instanceof java.util.Map<?, ?> map) {
                expSummary = ExplanationSummaryDto.builder()
                        .summary((String) map.get("summary"))
                        .build();
            }
        }

        return DigitalTwinStateResponse.builder()
                .machineId(machine.getId())
                .machineName(machine.getName())
                .serialNumber(machine.getSerialNumber())
                .healthScore(saved.getHealthScore())
                .operatingState(saved.getOperatingState())
                .anomalyDetected(saved.getAnomalyDetected())
                .anomalyScore(saved.getAnomalyScore())
                .currentFaultType(saved.getCurrentFaultType())
                .faultProbability(saved.getFaultProbability())
                .latestSensors(latestSensorDtos)
                .lastSensorBatchAt(saved.getLastSensorBatchAt())
                .lastUpdatedAt(saved.getUpdatedAt())
                .rul(rulSummary)
                .maintenance(maintSummary)
                .explanation(expSummary)
                .build();
    }


    public DigitalTwinStateResponse getDigitalTwinState(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
        return updateAndGetDigitalTwinState(machineId);
    }

    private SensorEvaluation evaluateSensor(MachineSensor sensor, BigDecimal value) {
        if (value == null) {
            return new SensorEvaluation("UNKNOWN", 0.0);
        }

        double val = value.doubleValue();
        Double normMin = sensor.getNormalMin() != null ? sensor.getNormalMin().doubleValue() : null;
        Double normMax = sensor.getNormalMax() != null ? sensor.getNormalMax().doubleValue() : null;
        Double warnMin = sensor.getWarningMin() != null ? sensor.getWarningMin().doubleValue() : null;
        Double warnMax = sensor.getWarningMax() != null ? sensor.getWarningMax().doubleValue() : null;
        Double critMin = sensor.getCriticalMin() != null ? sensor.getCriticalMin().doubleValue() : null;
        Double critMax = sensor.getCriticalMax() != null ? sensor.getCriticalMax().doubleValue() : null;

        // 1. Critical Violations
        boolean isHighCritical = (critMin != null && normMax != null && critMin >= normMax && val >= critMin)
                || (critMax != null && normMax != null && critMax >= normMax && val >= critMax);
        boolean isLowCritical = (critMax != null && normMin != null && critMax < normMin && val <= critMax)
                || (critMin != null && normMin != null && critMin < normMin && val <= critMin);

        if (isHighCritical || isLowCritical) {
            return new SensorEvaluation("CRITICAL", 60.0);
        }

        // 2. Warning Violations
        boolean isHighWarning = (warnMin != null && normMax != null && warnMin >= normMax && val >= warnMin)
                || (warnMax != null && normMax != null && warnMax >= normMax && val >= warnMax);
        boolean isLowWarning = (warnMax != null && normMin != null && warnMax <= normMin && val <= warnMax)
                || (warnMin != null && normMin != null && warnMin < normMin && val <= warnMin);

        if (isHighWarning || isLowWarning) {
            return new SensorEvaluation("WARNING", 30.0);
        }

        // 3. Watch / Out-of-normal Violations
        boolean isHighWatch = normMax != null && val > normMax;
        boolean isLowWatch = normMin != null && val < normMin;

        if (isHighWatch || isLowWatch) {
            return new SensorEvaluation("WATCH", 15.0);
        }

        return new SensorEvaluation("NORMAL", 0.0);
    }

    private record SensorEvaluation(String status, double penalty) {}
}
