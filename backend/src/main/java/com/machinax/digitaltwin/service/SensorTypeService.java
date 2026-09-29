package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.request.CreateSensorTypeRequest;
import com.machinax.digitaltwin.dto.request.UpdateSensorTypeRequest;
import com.machinax.digitaltwin.dto.response.SensorTypeResponse;
import com.machinax.digitaltwin.exception.ConflictException;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.SensorType;
import com.machinax.digitaltwin.repository.MachineSensorRepository;
import com.machinax.digitaltwin.repository.SensorTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SensorTypeService {

    private final SensorTypeRepository sensorTypeRepository;
    private final MachineSensorRepository machineSensorRepository;

    public SensorTypeService(SensorTypeRepository sensorTypeRepository, MachineSensorRepository machineSensorRepository) {
        this.sensorTypeRepository = sensorTypeRepository;
        this.machineSensorRepository = machineSensorRepository;
    }

    @Transactional(readOnly = true)
    public List<SensorTypeResponse> getAll() {
        return sensorTypeRepository.findAll().stream()
                .map(SensorTypeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SensorTypeResponse getById(Long id) {
        return sensorTypeRepository.findById(id)
                .map(SensorTypeResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor type not found with id: " + id));
    }

    public SensorTypeResponse create(CreateSensorTypeRequest request) {
        String normalizedName = request.name().trim().toUpperCase();
        if (sensorTypeRepository.existsByName(normalizedName)) {
            throw new ConflictException("Sensor type with name '" + normalizedName + "' already exists");
        }

        SensorType sensorType = SensorType.builder()
                .name(normalizedName)
                .unit(request.unit().trim())
                .description(request.description())
                .physicalQuantity(request.physicalQuantity().trim())
                .build();

        SensorType saved = sensorTypeRepository.save(sensorType);
        return SensorTypeResponse.fromEntity(saved);
    }

    public SensorTypeResponse update(Long id, UpdateSensorTypeRequest request) {
        SensorType sensorType = sensorTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor type not found with id: " + id));

        sensorType.setUnit(request.unit().trim());
        sensorType.setDescription(request.description());
        sensorType.setPhysicalQuantity(request.physicalQuantity().trim());

        SensorType updated = sensorTypeRepository.save(sensorType);
        return SensorTypeResponse.fromEntity(updated);
    }

    public void delete(Long id) {
        if (!sensorTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sensor type not found with id: " + id);
        }

        long associatedCount = machineSensorRepository.countBySensorTypeId(id);
        if (associatedCount > 0) {
            throw new ConflictException("Cannot delete sensor type with id " + id + " because " + associatedCount + " machine sensor(s) reference it");
        }

        sensorTypeRepository.deleteById(id);
    }
}
