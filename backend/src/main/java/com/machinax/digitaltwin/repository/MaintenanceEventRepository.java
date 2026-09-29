package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.MaintenanceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceEventRepository extends JpaRepository<MaintenanceEvent, Long> {
    List<MaintenanceEvent> findByMachineIdOrderByPerformedAtDesc(Long machineId);
}
