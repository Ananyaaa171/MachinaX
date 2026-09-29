package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.request.CreateMachineTypeRequest;
import com.machinax.digitaltwin.dto.request.UpdateMachineTypeRequest;
import com.machinax.digitaltwin.dto.response.MachineTypeResponse;
import com.machinax.digitaltwin.exception.ConflictException;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.MachineType;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MachineTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MachineTypeService {

    private final MachineTypeRepository machineTypeRepository;
    private final MachineRepository machineRepository;

    public MachineTypeService(MachineTypeRepository machineTypeRepository, MachineRepository machineRepository) {
        this.machineTypeRepository = machineTypeRepository;
        this.machineRepository = machineRepository;
    }

    @Transactional(readOnly = true)
    public List<MachineTypeResponse> getAll() {
        return machineTypeRepository.findAll().stream()
                .map(MachineTypeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MachineTypeResponse getById(Long id) {
        return machineTypeRepository.findById(id)
                .map(MachineTypeResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Machine type not found with id: " + id));
    }

    public MachineTypeResponse create(CreateMachineTypeRequest request) {
        if (machineTypeRepository.existsByName(request.name())) {
            throw new ConflictException("Machine type with name '" + request.name() + "' already exists");
        }

        MachineType machineType = MachineType.builder()
                .name(request.name().trim().toUpperCase())
                .displayName(request.displayName().trim())
                .description(request.description())
                .manufacturerModel(request.manufacturerModel())
                .build();

        MachineType saved = machineTypeRepository.save(machineType);
        return MachineTypeResponse.fromEntity(saved);
    }

    public MachineTypeResponse update(Long id, UpdateMachineTypeRequest request) {
        MachineType machineType = machineTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine type not found with id: " + id));

        machineType.setDisplayName(request.displayName().trim());
        machineType.setDescription(request.description());
        machineType.setManufacturerModel(request.manufacturerModel());

        MachineType updated = machineTypeRepository.save(machineType);
        return MachineTypeResponse.fromEntity(updated);
    }

    public void delete(Long id) {
        if (!machineTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Machine type not found with id: " + id);
        }

        long associatedCount = machineRepository.countByMachineTypeId(id);
        if (associatedCount > 0) {
            throw new ConflictException("Cannot delete machine type with id " + id + " because " + associatedCount + " machine(s) are associated with it");
        }

        machineTypeRepository.deleteById(id);
    }
}
