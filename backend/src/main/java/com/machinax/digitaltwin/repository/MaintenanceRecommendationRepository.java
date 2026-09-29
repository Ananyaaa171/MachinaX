package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.MaintenanceRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRecommendationRepository extends JpaRepository<MaintenanceRecommendation, Long> {
    Optional<MaintenanceRecommendation> findFirstByMachineIdOrderByIdDesc(Long machineId);
    List<MaintenanceRecommendation> findByMachineIdOrderByIdDesc(Long machineId);
}
