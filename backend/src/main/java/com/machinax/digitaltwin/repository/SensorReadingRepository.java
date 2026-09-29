package com.machinax.digitaltwin.repository;

import com.machinax.digitaltwin.model.entity.SensorReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long>, JpaSpecificationExecutor<SensorReading> {

    List<SensorReading> findByMachineSensorIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            Long machineSensorId, Instant startTime, Instant endTime
    );

    Page<SensorReading> findByMachineSensorMachineId(Long machineId, Pageable pageable);

    Page<SensorReading> findByMachineSensorId(Long machineSensorId, Pageable pageable);

    @Query("SELECT r FROM SensorReading r WHERE r.machineSensor.id = :sensorId ORDER BY r.recordedAt DESC, r.id DESC")
    List<SensorReading> findLatestBySensorId(@Param("sensorId") Long sensorId, Pageable pageable);

    long countByMachineSensorMachineId(Long machineId);
}
