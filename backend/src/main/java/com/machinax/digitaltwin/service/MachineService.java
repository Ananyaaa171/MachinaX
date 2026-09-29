package com.machinax.digitaltwin.service;

import com.machinax.digitaltwin.dto.request.CreateMachineRequest;
import com.machinax.digitaltwin.dto.request.UpdateMachineRequest;
import com.machinax.digitaltwin.dto.response.MachineResponse;
import com.machinax.digitaltwin.exception.ConflictException;
import com.machinax.digitaltwin.exception.ResourceNotFoundException;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.entity.MachineType;
import com.machinax.digitaltwin.model.enums.MachineStatus;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.MachineTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MachineService {

    private final MachineRepository machineRepository;
    private final MachineTypeRepository machineTypeRepository;

    public MachineService(MachineRepository machineRepository, MachineTypeRepository machineTypeRepository) {
        this.machineRepository = machineRepository;
        this.machineTypeRepository = machineTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<MachineResponse> getAll(MachineStatus status) {
        List<Machine> machines = (status != null)
                ? machineRepository.findByStatus(status)
                : machineRepository.findAll();

        return machines.stream()
                .map(MachineResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MachineResponse getById(Long id) {
        return machineRepository.findById(id)
                .map(MachineResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + id));
    }

    public MachineResponse create(CreateMachineRequest request) {
        String serialNumber = request.serialNumber().trim();
        if (machineRepository.existsBySerialNumber(serialNumber)) {
            throw new ConflictException("Machine with serial number '" + serialNumber + "' already exists");
        }

        MachineType machineType = machineTypeRepository.findById(request.machineTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Machine type not found with id: " + request.machineTypeId()));

        Machine machine = Machine.builder()
                .machineType(machineType)
                .name(request.name().trim())
                .serialNumber(serialNumber)
                .location(request.location())
                .ratedPowerKw(request.ratedPowerKw())
                .ratedVoltageV(request.ratedVoltageV())
                .ratedCurrentA(request.ratedCurrentA())
                .ratedSpeedRpm(request.ratedSpeedRpm())
                .installationDate(request.installationDate())
                .status(request.status() != null ? request.status() : MachineStatus.ACTIVE)
                .build();

        Machine saved = machineRepository.save(machine);
        return MachineResponse.fromEntity(saved);
    }

    public MachineResponse update(Long id, UpdateMachineRequest request) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + id));

        if (request.machineTypeId() != null && !request.machineTypeId().equals(machine.getMachineType().getId())) {
            MachineType newType = machineTypeRepository.findById(request.machineTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Machine type not found with id: " + request.machineTypeId()));
            machine.setMachineType(newType);
        }

        machine.setName(request.name().trim());
        machine.setLocation(request.location());
        machine.setRatedPowerKw(request.ratedPowerKw());
        machine.setRatedVoltageV(request.ratedVoltageV());
        machine.setRatedCurrentA(request.ratedCurrentA());
        machine.setRatedSpeedRpm(request.ratedSpeedRpm());
        machine.setInstallationDate(request.installationDate());
        if (request.status() != null) {
            machine.setStatus(request.status());
        }

        Machine updated = machineRepository.save(machine);
        return MachineResponse.fromEntity(updated);
    }

    public void delete(Long id) {
        if (!machineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Machine not found with id: " + id);
        }
        machineRepository.deleteById(id);
    }
}
