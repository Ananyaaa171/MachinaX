package com.machinax.digitaltwin.dto.response;

import com.machinax.digitaltwin.model.enums.FaultType;
import com.machinax.digitaltwin.model.enums.OperatingState;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Builder
public record DigitalTwinStateResponse(
    Long machineId,
    String machineName,
    String serialNumber,
    BigDecimal healthScore,
    OperatingState operatingState,
    Boolean anomalyDetected,
    BigDecimal anomalyScore,
    FaultType currentFaultType,
    BigDecimal faultProbability,
    List<LatestSensorValueDto> latestSensors,
    Instant lastSensorBatchAt,
    Instant lastUpdatedAt,
    RULSummaryDto rul,
    MaintenanceSummaryDto maintenance,
    ExplanationSummaryDto explanation
) {}

