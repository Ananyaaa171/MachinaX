package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.SensorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SensorTypeRepository extends JpaRepository<SensorType, Long> {
    Optional<SensorType> findByName(String name);
    boolean existsByName(String name);
}
