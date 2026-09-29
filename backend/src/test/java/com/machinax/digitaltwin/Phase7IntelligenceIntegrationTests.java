package com.machinax.digitaltwin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinax.digitaltwin.client.MLPredictionClient;
import com.machinax.digitaltwin.dto.request.MLPredictionClientRequest;
import com.machinax.digitaltwin.dto.response.MLPredictionClientResponse;
import com.machinax.digitaltwin.model.entity.Machine;
import com.machinax.digitaltwin.model.entity.MaintenanceRecommendation;
import com.machinax.digitaltwin.model.entity.RULPrediction;
import com.machinax.digitaltwin.repository.*;
import com.machinax.digitaltwin.service.MLPredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class Phase7IntelligenceIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private MLPredictionRepository mlPredictionRepository;

    @Autowired
    private PredictionExplanationRepository predictionExplanationRepository;

    @Autowired
    private RULPredictionRepository rulPredictionRepository;

    @Autowired
    private MaintenanceRecommendationRepository maintenanceRecommendationRepository;

    @Autowired
    private MLPredictionService mlPredictionService;

    @MockitoBean
    private MLPredictionClient mlPredictionClient;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        predictionExplanationRepository.deleteAll();
        rulPredictionRepository.deleteAll();
        maintenanceRecommendationRepository.deleteAll();
        mlPredictionRepository.deleteAll();
    }

    @Test
    @DisplayName("Phase 7 Test 1: Full intelligence persistence (ML Prediction + SHAP + RUL + Maintenance)")
    void testFullIntelligencePersistence() throws Exception {
        Map<String, Object> explanationMap = Map.of(
                "faultType", "BEARING_DEFECT",
                "faultProbability", 0.92,
                "summary", "High vibration is the strongest contributing factor to the BEARING_DEFECT model prediction.",
                "features", List.of(
                        Map.of("feature", "vibration", "value", 3.85, "shapValue", 0.72, "impact", "HIGH POSITIVE IMPACT"),
                        Map.of("feature", "temperature", "value", 72.0, "shapValue", 0.35, "impact", "MODERATE POSITIVE IMPACT")
                )
        );

        Map<String, Object> rulMap = Map.of(
                "estimatedRulHours", 450.5,
                "confidence", "MEDIUM",
                "degradationTrend", "DEGRADING"
        );

        Map<String, Object> maintMap = Map.of(
                "priority", "P2_SCHEDULE",
                "faultType", "BEARING_DEFECT",
                "recommendation", "Inspect drive-end bearing and check vibration trend."
        );

        when(mlPredictionClient.predict(any(MLPredictionClientRequest.class)))
                .thenReturn(Optional.of(MLPredictionClientResponse.builder()
                        .machineId(1L)
                        .anomalyDetected(true)
                        .anomalyScore(new BigDecimal("0.7500"))
                        .faultType("BEARING_DEFECT")
                        .faultProbability(new BigDecimal("0.9200"))
                        .modelVersion("1.0")
                        .predictionTimestamp(Instant.now())
                        .processingTimeMs(25)
                        .explanation(explanationMap)
                        .rul(rulMap)
                        .maintenance(maintMap)
                        .build()));

        Map<String, Double> sensors = Map.of("VIBRATION", 3.85, "CURRENT", 13.2, "TEMPERATURE", 72.0, "RPM", 2900.0);
        mlPredictionService.predictAndSave(1L, sensors, Instant.now());

        // 1. Verify GET /api/v1/machines/1/explanations/latest
        mockMvc.perform(get("/api/v1/machines/1/explanations/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.faultType", is("BEARING_DEFECT")))
                .andExpect(jsonPath("$.summary", containsString("vibration")))
                .andExpect(jsonPath("$.features", hasSize(2)));

        // 2. Verify GET /api/v1/machines/1/rul/latest
        mockMvc.perform(get("/api/v1/machines/1/rul/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.estimatedRulHours", is(450.5)))
                .andExpect(jsonPath("$.confidence", is("MEDIUM")))
                .andExpect(jsonPath("$.degradationTrend", is("DEGRADING")));

        // 3. Verify GET /api/v1/machines/1/maintenance/latest
        mockMvc.perform(get("/api/v1/machines/1/maintenance/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.priority", is("P2_SCHEDULE")))
                .andExpect(jsonPath("$.recommendation", containsString("bearing")));

        // 4. Verify Digital Twin response incorporates Phase 7 intelligence summaries
        mockMvc.perform(get("/api/v1/machines/1/digital-twin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.rul.estimatedHours", is(450.5)))
                .andExpect(jsonPath("$.rul.confidence", is("MEDIUM")))
                .andExpect(jsonPath("$.maintenance.priority", is("P2_SCHEDULE")))
                .andExpect(jsonPath("$.maintenance.recommendation", containsString("bearing")))
                .andExpect(jsonPath("$.explanation.summary", containsString("vibration")));
    }

    @Test
    @DisplayName("Phase 7 Test 2: Empty intelligence endpoints return 204 No Content")
    void testEmptyIntelligenceEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/machines/1/explanations/latest"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/machines/1/rul/latest"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/machines/1/maintenance/latest"))
                .andExpect(status().isNoContent());
    }
}
