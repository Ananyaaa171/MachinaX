package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.MachineType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MachineTypeRepository extends JpaRepository<MachineType, Long> {
    Optional<MachineType> findByName(String name);
    boolean existsByName(String name);
}
