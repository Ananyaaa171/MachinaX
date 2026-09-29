package com.machinax.digitaltwin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinax.digitaltwin.dto.request.SensorReadingBatchRequest;
import com.machinax.digitaltwin.dto.request.SensorReadingItemDto;
import com.machinax.digitaltwin.model.enums.OperatingState;
import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class Phase5DigitalTwinIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private com.machinax.digitaltwin.repository.SensorReadingRepository sensorReadingRepository;

    @Autowired
    private com.machinax.digitaltwin.repository.DigitalTwinStateRepository digitalTwinStateRepository;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .findAndRegisterModules();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        sensorReadingRepository.deleteAll();
        digitalTwinStateRepository.deleteAll();
    }

    @Test
    @DisplayName("Test 1: GET /api/v1/machines/1/digital-twin returns valid digital twin state")
    void testGetDigitalTwinStateSuccess() throws Exception {
        mockMvc.perform(get("/api/v1/machines/1/digital-twin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.machineName", is("Motor IM-001")))
                .andExpect(jsonPath("$.healthScore", notNullValue()))
                .andExpect(jsonPath("$.operatingState", notNullValue()))
                .andExpect(jsonPath("$.anomalyDetected", notNullValue()))
                .andExpect(jsonPath("$.anomalyScore", notNullValue()))
                .andExpect(jsonPath("$.latestSensors", isA(List.class)));
    }

    @Test
    @DisplayName("Test 2: GET digital-twin for non-existent machine returns 404")
    void testGetDigitalTwinNonExistentMachine() throws Exception {
        mockMvc.perform(get("/api/v1/machines/99999/digital-twin"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    @DisplayName("Test 3: Ingest healthy readings -> Digital Twin reflects NORMAL state and high health")
    void testHealthyReadingsYieldsNormalState() throws Exception {
        Instant now = Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS);
        // Values within normal thresholds: Vib ~1.8 (normal <= 2.8), Curr ~12.4 (normal <= 16.0), Temp ~50 (normal <= 70), RPM ~2910 (normal 2850-2950)
        SensorReadingBatchRequest batch = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(null, "VIBRATION", new BigDecimal("1.80"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "CURRENT", new BigDecimal("12.40"), "A", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "TEMPERATURE", new BigDecimal("50.00"), "°C", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "RPM", new BigDecimal("2910.00"), "RPM", ReadingQuality.GOOD, SensorSource.SIMULATED, now)
        ));

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/machines/1/digital-twin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore", is(100.00)))
                .andExpect(jsonPath("$.operatingState", is(OperatingState.NORMAL.name())))
                .andExpect(jsonPath("$.anomalyDetected", is(false)))
                .andExpect(jsonPath("$.anomalyScore", is(0.0000)));
    }

    @Test
    @DisplayName("Test 4: Ingest critical fault readings -> Digital Twin reflects CRITICAL state and low health")
    void testCriticalFaultReadingsYieldsCriticalState() throws Exception {
        Instant now = Instant.now().plus(2, java.time.temporal.ChronoUnit.DAYS);
        // Critical values: Vibration = 6.5 mm/s (criticalMax = 4.5), Temp = 88.0 °C (criticalMax = 85), Current = 36.0 A (criticalMax = 22)
        SensorReadingBatchRequest batch = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(null, "VIBRATION", new BigDecimal("6.50"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "CURRENT", new BigDecimal("36.00"), "A", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "TEMPERATURE", new BigDecimal("88.00"), "°C", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "RPM", new BigDecimal("2750.00"), "RPM", ReadingQuality.GOOD, SensorSource.SIMULATED, now)
        ));

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/machines/1/digital-twin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operatingState", is(OperatingState.CRITICAL.name())))
                .andExpect(jsonPath("$.anomalyDetected", is(true)))
                .andExpect(jsonPath("$.healthScore", lessThan(50.0)))
                .andExpect(jsonPath("$.anomalyScore", greaterThan(0.5)));
    }
}
