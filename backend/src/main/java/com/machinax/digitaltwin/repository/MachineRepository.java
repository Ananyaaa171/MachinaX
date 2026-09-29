package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.enums.MachineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    Optional<Machine> findBySerialNumber(String serialNumber);
    List<Machine> findByStatus(MachineStatus status);
    boolean existsBySerialNumber(String serialNumber);
    boolean existsByMachineTypeId(Long machineTypeId);
    long countByMachineTypeId(Long machineTypeId);
}
