package com.machinax.digitaltwin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinax.digitaltwin.dto.request.SensorReadingBatchRequest;
import com.machinax.digitaltwin.dto.request.SensorReadingItemDto;
import com.machinax.digitaltwin.model.enums.ReadingQuality;
import com.machinax.digitaltwin.model.enums.SensorSource;
import com.machinax.digitaltwin.repository.SensorReadingRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class Phase4IngestionIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .findAndRegisterModules();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("Test 1: Ingest batch of 4 sensor readings by sensor ID successfully")
    void testIngestBatchByIdSuccess() throws Exception {
        long initialCount = sensorReadingRepository.countByMachineSensorMachineId(1L);
        Instant recordedTime = Instant.now().minus(10, ChronoUnit.SECONDS);

        SensorReadingBatchRequest request = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(1L, null, new BigDecimal("2.1500"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime),
                new SensorReadingItemDto(2L, null, new BigDecimal("12.4000"), "A", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime),
                new SensorReadingItemDto(3L, null, new BigDecimal("65.2000"), "°C", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime),
                new SensorReadingItemDto(4L, null, new BigDecimal("1490.0000"), "RPM", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime)
        ));

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.machineId", is(1)))
                .andExpect(jsonPath("$.accepted", is(4)))
                .andExpect(jsonPath("$.rejected", is(0)))
                .andExpect(jsonPath("$.ingestedAt", notNullValue()));

        long newCount = sensorReadingRepository.countByMachineSensorMachineId(1L);
        assertEquals(initialCount + 4, newCount, "Database should contain 4 more rows for machine 1");
    }

    @Test
    @DisplayName("Test 1b: Ingest batch using sensorType names (e.g. VIBRATION, CURRENT, TEMPERATURE, RPM)")
    void testIngestBatchByTypeSuccess() throws Exception {
        Instant recordedTime = Instant.now();

        SensorReadingBatchRequest request = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(null, "VIBRATION", new BigDecimal("1.8200"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime),
                new SensorReadingItemDto(null, "CURRENT", new BigDecimal("11.9000"), "A", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime),
                new SensorReadingItemDto(null, "TEMPERATURE", new BigDecimal("55.0000"), "°C", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime),
                new SensorReadingItemDto(null, "RPM", new BigDecimal("1498.0000"), "RPM", ReadingQuality.GOOD, SensorSource.SIMULATED, recordedTime)
        ));

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accepted", is(4)));
    }

    @Test
    @DisplayName("Test 2: Non-existent machine ID should return HTTP 404")
    void testIngestInvalidMachine() throws Exception {
        SensorReadingBatchRequest request = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(1L, null, new BigDecimal("2.15"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, Instant.now())
        ));

        mockMvc.perform(post("/api/v1/machines/99999/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Test 3: Sensor ID belonging to another machine or invalid returns HTTP 400/404")
    void testIngestInvalidSensor() throws Exception {
        // Sensor 99999 does not belong to machine 1
        SensorReadingBatchRequest request = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(99999L, null, new BigDecimal("2.15"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, Instant.now())
        ));

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Test 4: Empty readings array should return HTTP 400")
    void testIngestEmptyReadings() throws Exception {
        String json = "{\"readings\": []}";

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Test 5: Support multiple sources: SIMULATED, IOT_EDGE, MANUAL")
    void testIngestMultipleSources() throws Exception {
        Instant now = Instant.now();
        SensorReadingBatchRequest request = new SensorReadingBatchRequest(List.of(
                new SensorReadingItemDto(1L, null, new BigDecimal("3.14"), "mm/s", ReadingQuality.GOOD, SensorSource.IOT_EDGE, now),
                new SensorReadingItemDto(2L, null, new BigDecimal("14.2"), "A", ReadingQuality.GOOD, SensorSource.MANUAL, now)
        ));

        mockMvc.perform(post("/api/v1/machines/1/readings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accepted", is(2)));
    }

    @Test
    @DisplayName("Test 6: Query readings GET /api/v1/machines/{machineId}/readings")
    void testQueryReadings() throws Exception {
        mockMvc.perform(post("/api/v1/machines/1/readings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SensorReadingBatchRequest(List.of(
                        new SensorReadingItemDto(null, "VIBRATION", new BigDecimal("1.80"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, Instant.now())
                ))))).andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/machines/1/readings?size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()))
                .andExpect(jsonPath("$.content", not(empty())));
    }

    @Test
    @DisplayName("Test 7: Query readings filtered by sensorId")
    void testQueryReadingsFilteredBySensorId() throws Exception {
        mockMvc.perform(post("/api/v1/machines/1/readings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SensorReadingBatchRequest(List.of(
                        new SensorReadingItemDto(1L, null, new BigDecimal("1.80"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, Instant.now())
                ))))).andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/machines/1/readings?sensorId=1&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()))
                .andExpect(jsonPath("$.content[0].machineSensorId", is(1)));
    }

    @Test
    @DisplayName("Test 8: Sensor trend API GET /api/v1/machines/{machineId}/sensors/{sensorId}/trend")
    void testSensorTrend() throws Exception {
        // Ingest a series of points with ascending timestamps
        Instant t1 = Instant.now().minus(30, ChronoUnit.SECONDS);
        Instant t2 = Instant.now().minus(20, ChronoUnit.SECONDS);
        Instant t3 = Instant.now().minus(10, ChronoUnit.SECONDS);

        mockMvc.perform(post("/api/v1/machines/1/readings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SensorReadingBatchRequest(List.of(
                        new SensorReadingItemDto(1L, null, new BigDecimal("1.50"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, t1),
                        new SensorReadingItemDto(1L, null, new BigDecimal("2.50"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, t2),
                        new SensorReadingItemDto(1L, null, new BigDecimal("3.50"), "mm/s", ReadingQuality.GOOD, SensorSource.SIMULATED, t3)
                ))))).andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/api/v1/machines/1/sensors/1/trend?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)))
                .andExpect(jsonPath("$", not(empty())))
                .andReturn();

        JsonNode array = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(array.size() >= 3);

        // Verify chronological order: timestamp[i] <= timestamp[i+1]
        for (int i = 0; i < array.size() - 1; i++) {
            Instant ts1 = Instant.parse(array.get(i).get("timestamp").asText());
            Instant ts2 = Instant.parse(array.get(i + 1).get("timestamp").asText());
            assertFalse(ts1.isAfter(ts2), "Trend points must be in chronological ascending order");
        }
    }
}
