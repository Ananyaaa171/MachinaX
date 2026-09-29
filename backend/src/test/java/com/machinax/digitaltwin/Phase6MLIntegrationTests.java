package com.machinax.digitaltwin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinax.digitaltwin.client.MLPredictionClient;
import com.machinax.digitaltwin.dto.request.MLPredictionClientRequest;
import com.machinax.digitaltwin.dto.request.SensorReadingBatchRequest;
import com.machinax.digitaltwin.dto.request.SensorReadingItemDto;
import com.machinax.digitaltwin.dto.response.MLPredictionClientResponse;
import com.machinax.digitaltwin.model.entity.MLPrediction;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.enums.FaultType;
import com.machinax.digitaltwin.model.enums.MLStage;
import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import com.machinax.digitaltwin.repository.MLPredictionRepository;
import com.machinax.digitaltwin.repository.MachineRepository;
import com.machinax.digitaltwin.repository.SensorReadingRepository;
import com.machinax.digitaltwin.service.MLPredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class Phase6MLIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private MLPredictionRepository mlPredictionRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private MLPredictionService mlPredictionService;

    @MockitoBean
    private MLPredictionClient mlPredictionClient;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .findAndRegisterModules();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        mlPredictionRepository.deleteAll();
        sensorReadingRepository.deleteAll();
    }

    @Test
    @DisplayName("Test 1: ML prediction persistence via MLPredictionService")
    void testMLPredictionPersistence() {
        when(mlPredictionClient.predict(any(MLPredictionClientRequest.class)))
                .thenReturn(Optional.of(MLPredictionClientResponse.builder()
                        .machineId(1L)
                        .anomalyDetected(true)
                        .anomalyScore(new BigDecimal("0.8200"))
                        .faultType("BEARING_DEFECT")
                        .faultProbability(new BigDecimal("0.8950"))
                        .modelVersion("1.0")
                        .classProbabilities(Map.of("BEARING_DEFECT", new BigDecimal("0.8950"), "NORMAL", new BigDecimal("0.0500")))
                        .predictionTimestamp(Instant.now())
                        .processingTimeMs(15)
                        .build()));

        Map<String, Double> sensors = Map.of(
                "VIBRATION", 3.45,
                "CURRENT", 13.2,
                "TEMPERATURE", 71.0,
                "RPM", 2905.0
        );

        Optional<MLPrediction> savedOpt = mlPredictionService.predictAndSave(1L, sensors, Instant.now());
        assertTrue(savedOpt.isPresent());
        MLPrediction saved = savedOpt.get();

        assertNotNull(saved.getId());
        assertEquals(1L, saved.getMachine().getId());
        assertEquals(FaultType.BEARING_DEFECT, saved.getFaultType());
        assertEquals(new BigDecimal("0.8950"), saved.getFaultProbability());
        assertEquals(new BigDecimal("0.8200"), saved.getAnomalyScore());
        assertEquals("1.0", saved.getModelVersion());
    }

    @Test
    @DisplayName("Test 2: GET /api/v1/machines/1/ml-prediction/latest returns latest prediction")
    void testGetLatestPrediction() throws Exception {
        Machine machine = machineRepository.findById(1L).orElseThrow();
        MLPrediction prediction = MLPrediction.builder()
                .machine(machine)
                .stage(MLStage.FAULT)
                .modelName("XGBoost + Isolation Forest")
                .modelVersion("1.0")
                .anomalyScore(new BigDecimal("0.7800"))
                .faultType(FaultType.STATOR_SHORT)
                .faultProbability(new BigDecimal("0.9200"))
                .inputFeatures(Map.of("VIBRATION", 1.98, "CURRENT", 17.5))
                .output(Map.of("faultType", "STATOR_SHORT"))
                .processingTimeMs(12)
                .createdAt(Instant.now())
                .build();

        mlPredictionRepository.save(prediction);

        mockMvc.perform(get("/api/v1/machines/1/ml-prediction/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.faultType", is("STATOR_SHORT")))
                .andExpect(jsonPath("$.faultProbability", is(0.9200)))
                .andExpect(jsonPath("$.anomalyDetected", is(true)))
                .andExpect(jsonPath("$.anomalyScore", is(0.7800)))
                .andExpect(jsonPath("$.modelVersion", is("1.0")));
    }

    @Test
    @DisplayName("Test 3: GET latest prediction when none exists returns 204 No Content")
    void testGetLatestPredictionEmpty() throws Exception {
        mockMvc.perform(get("/api/v1/machines/1/ml-prediction/latest"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Test 4: Sensor ingestion succeeds and Digital Twin works even when ML Service is unavailable")
    void testIngestionResilientWhenMLServiceFails() throws Exception {
        // Mock ML client failure (empty response)
        when(mlPredictionClient.predict(any(MLPredictionClientRequest.class)))
                .thenReturn(Optional.empty());

        Instant now = Instant.now().plus(3, java.time.temporal.ChronoUnit.DAYS);
        SensorReadingBatchRequest batch = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(null, "VIBRATION", new BigDecimal("1.80"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "CURRENT", new BigDecimal("12.40"), "A", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "TEMPERATURE", new BigDecimal("55.00"), "°C", ReadingQuality.GOOD, SensorSource.SIMULATED, now),
                new SensorReadingItemDto(null, "RPM", new BigDecimal("2915.00"), "RPM", ReadingQuality.GOOD, SensorSource.SIMULATED, now)
        ));

        // Sensor ingestion must succeed (201 Created)
        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accepted", is(4)));

        // Digital Twin state must still be calculated and functional
        mockMvc.perform(get("/api/v1/machines/1/digital-twin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore", is(100.00)))
                .andExpect(jsonPath("$.operatingState", is("NORMAL")));
    }
}
