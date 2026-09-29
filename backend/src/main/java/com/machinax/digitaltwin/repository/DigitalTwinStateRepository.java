package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.DigitalTwinState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DigitalTwinStateRepository extends JpaRepository<DigitalTwinState, Long> {
    Optional<DigitalTwinState> findByMachineId(Long machineId);
}
