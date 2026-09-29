package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.request.CreateMachineSensorRequest;
import com.machinax.digitaltwin.dto.request.UpdateMachineSensorRequest;
import com.machinax.digitaltwin.dto.response.MachineSensorResponse;
import com.machinax.digitaltwin.exception.BadRequestException;
import com.machinax.digitaltwin.exception.ConflictException;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.entity.MachineSensor;
import com.machinax.digitaltwin.model.entity.SensorType;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MachineSensorRepository;
import com.machinax.digitaltwin.repository.SensorTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class MachineSensorService {

    private final MachineSensorRepository machineSensorRepository;
    private final MachineRepository machineRepository;
    private final SensorTypeRepository sensorTypeRepository;

    public MachineSensorService(MachineSensorRepository machineSensorRepository,
                                MachineRepository machineRepository,
                                SensorTypeRepository sensorTypeRepository) {
        this.machineSensorRepository = machineSensorRepository;
        this.machineRepository = machineRepository;
        this.sensorTypeRepository = sensorTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<MachineSensorResponse> getSensorsByMachineId(Long machineId) {
        verifyMachineExists(machineId);
        return machineSensorRepository.findByMachineId(machineId).stream()
                .map(MachineSensorResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MachineSensorResponse getSensorById(Long machineId, Long sensorId) {
        verifyMachineExists(machineId);
        MachineSensor sensor = machineSensorRepository.findByIdAndMachineId(sensorId, machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor with id " + sensorId + " not found for machine " + machineId));
        return MachineSensorResponse.fromEntity(sensor);
    }

    public MachineSensorResponse create(Long machineId, CreateMachineSensorRequest request) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + machineId));

        SensorType sensorType = sensorTypeRepository.findById(request.sensorTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Sensor type not found with id: " + request.sensorTypeId()));

        String label = request.label().trim();
        if (machineSensorRepository.existsByMachineIdAndLabel(machineId, label)) {
            throw new ConflictException("Sensor with label '" + label + "' already exists on machine " + machineId);
        }

        validateThresholds(
                request.normalMin(), request.normalMax(),
                request.warningMin(), request.warningMax(),
                request.criticalMin(), request.criticalMax()
        );

        MachineSensor sensor = MachineSensor.builder()
                .machine(machine)
                .sensorType(sensorType)
                .label(label)
                .normalMin(request.normalMin())
                .normalMax(request.normalMax())
                .warningMin(request.warningMin())
                .warningMax(request.warningMax())
                .criticalMin(request.criticalMin())
                .criticalMax(request.criticalMax())
                .isActive(request.isActive() != null ? request.isActive() : true)
                .build();

        MachineSensor saved = machineSensorRepository.save(sensor);
        return MachineSensorResponse.fromEntity(saved);
    }

    public MachineSensorResponse update(Long machineId, Long sensorId, UpdateMachineSensorRequest request) {
        verifyMachineExists(machineId);
        MachineSensor sensor = machineSensorRepository.findByIdAndMachineId(sensorId, machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor with id " + sensorId + " not found for machine " + machineId));

        if (request.sensorTypeId() != null && !request.sensorTypeId().equals(sensor.getSensorType().getId())) {
            SensorType newSensorType = sensorTypeRepository.findById(request.sensorTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sensor type not found with id: " + request.sensorTypeId()));
            sensor.setSensorType(newSensorType);
        }

        String newLabel = request.label().trim();
        if (!newLabel.equalsIgnoreCase(sensor.getLabel()) && machineSensorRepository.existsByMachineIdAndLabel(machineId, newLabel)) {
            throw new ConflictException("Sensor with label '" + newLabel + "' already exists on machine " + machineId);
        }

        validateThresholds(
                request.normalMin(), request.normalMax(),
                request.warningMin(), request.warningMax(),
                request.criticalMin(), request.criticalMax()
        );

        sensor.setLabel(newLabel);
        sensor.setNormalMin(request.normalMin());
        sensor.setNormalMax(request.normalMax());
        sensor.setWarningMin(request.warningMin());
        sensor.setWarningMax(request.warningMax());
        sensor.setCriticalMin(request.criticalMin());
        sensor.setCriticalMax(request.criticalMax());
        if (request.isActive() != null) {
            sensor.setIsActive(request.isActive());
        }

        MachineSensor updated = machineSensorRepository.save(sensor);
        return MachineSensorResponse.fromEntity(updated);
    }

    public void delete(Long machineId, Long sensorId) {
        verifyMachineExists(machineId);
        MachineSensor sensor = machineSensorRepository.findByIdAndMachineId(sensorId, machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor with id " + sensorId + " not found for machine " + machineId));

        machineSensorRepository.delete(sensor);
    }

    private void verifyMachineExists(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with id: " + machineId);
        }
    }

    private void validateThresholds(BigDecimal normalMin, BigDecimal normalMax,
                                    BigDecimal warningMin, BigDecimal warningMax,
                                    BigDecimal criticalMin, BigDecimal criticalMax) {
        if (normalMin != null && normalMax != null && normalMin.compareTo(normalMax) > 0) {
            throw new BadRequestException("normalMin (" + normalMin + ") cannot be greater than normalMax (" + normalMax + ")");
        }
        if (warningMin != null && warningMax != null && warningMin.compareTo(warningMax) > 0) {
            throw new BadRequestException("warningMin (" + warningMin + ") cannot be greater than warningMax (" + warningMax + ")");
        }
        if (criticalMin != null && criticalMax != null && criticalMin.compareTo(criticalMax) > 0) {
            throw new BadRequestException("criticalMin (" + criticalMin + ") cannot be greater than criticalMax (" + criticalMax + ")");
        }
    }
}
