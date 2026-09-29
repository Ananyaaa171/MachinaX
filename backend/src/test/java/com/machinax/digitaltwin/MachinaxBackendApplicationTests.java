package com.machinax.digitaltwin;

import com.machinax.digitaltwin.model.entity.MachineType;
import com.machinax.digitaltwin.model.entity.SensorType;
import com.machinax.digitaltwin.repository.MachineTypeRepository;
import com.machinax.digitaltwin.repository.SensorTypeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MachinaxBackendApplicationTests {

    @Autowired
    private MachineTypeRepository machineTypeRepository;

    @Autowired
    private SensorTypeRepository sensorTypeRepository;

    @Test
    void contextLoads() {
        // Confirms Spring context loads, Flyway executes V1 & V2, and Hibernate validation passes
    }

    @Test
    void verifySeedDataLoaded() {
        // Verify MachineType seed data
        Optional<MachineType> motorType = machineTypeRepository.findByName("THREE_PHASE_INDUCTION_MOTOR");
        assertTrue(motorType.isPresent(), "Machine type THREE_PHASE_INDUCTION_MOTOR should be seeded");
        assertEquals("3-Phase Induction Motor", motorType.get().getDisplayName());

        // Verify SensorTypes seed data
        List<SensorType> sensorTypes = sensorTypeRepository.findAll();
        assertEquals(4, sensorTypes.size(), "Should have 4 seeded sensor types");

        List<String> names = sensorTypes.stream().map(SensorType::getName).toList();
        assertTrue(names.contains("VIBRATION"));
        assertTrue(names.contains("CURRENT"));
        assertTrue(names.contains("TEMPERATURE"));
        assertTrue(names.contains("RPM"));
    }
}
