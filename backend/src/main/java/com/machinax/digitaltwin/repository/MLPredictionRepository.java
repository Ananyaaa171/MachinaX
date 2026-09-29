package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.MLPrediction;
import com.machinax.digitaltwin.model.enums.MLStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MLPredictionRepository extends JpaRepository<MLPrediction, Long> {
    Optional<MLPrediction> findFirstByMachineIdOrderByCreatedAtDesc(Long machineId);
    List<MLPrediction> findByMachineIdOrderByCreatedAtDesc(Long machineId);
    List<MLPrediction> findByMachineIdAndStageOrderByCreatedAtDesc(Long machineId, MLStage stage);
}

