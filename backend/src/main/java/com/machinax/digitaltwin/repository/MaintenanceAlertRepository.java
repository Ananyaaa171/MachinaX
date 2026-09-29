package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.MaintenanceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceAlertRepository extends JpaRepository<MaintenanceAlert, Long> {
    List<MaintenanceAlert> findByMachineIdOrderByCreatedAtDesc(Long machineId);
    List<MaintenanceAlert> findByMachineIdAndResolvedFalseOrderByCreatedAtDesc(Long machineId);
}
