package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.PredictionExplanation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionExplanationRepository extends JpaRepository<PredictionExplanation, Long> {
    List<PredictionExplanation> findByMlPredictionId(Long mlPredictionId);
    List<PredictionExplanation> findByMlPrediction_Machine_IdOrderByCreatedAtDesc(Long machineId);
}
