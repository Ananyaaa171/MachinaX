package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.RULPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RULPredictionRepository extends JpaRepository<RULPrediction, Long> {
    Optional<RULPrediction> findFirstByMachineIdOrderByIdDesc(Long machineId);
    List<RULPrediction> findByMachineIdOrderByIdDesc(Long machineId);
}
