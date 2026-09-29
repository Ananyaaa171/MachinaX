package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.MachineSensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineSensorRepository extends JpaRepository<MachineSensor, Long> {
    List<MachineSensor> findByMachineId(Long machineId);
    Optional<MachineSensor> findByMachineIdAndLabel(Long machineId, String label);
    Optional<MachineSensor> findByIdAndMachineId(Long id, Long machineId);
    boolean existsByMachineIdAndLabel(Long machineId, String label);
    boolean existsBySensorTypeId(Long sensorTypeId);
    long countBySensorTypeId(Long sensorTypeId);
}
