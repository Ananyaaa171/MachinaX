package com.machinax.digitaltwin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinax.digitaltwin.dto.request.*;
import com.machinax.digitaltwin.model.enums.MachineStatus;
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
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class Phase2ApiIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .findAndRegisterModules();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    // ========================================================================
    // 1. SEEDED DEMO MACHINE & SENSORS VERIFICATION
    // ========================================================================

    @Test
    @DisplayName("Verify Flyway V3 seeded demo machine 'Motor IM-001' and its 4 sensors")
    void testVerifySeededDemoMachineAndSensors() throws Exception {
        // 1. Get all machines and verify Motor IM-001 is present
        MvcResult machinesResult = mockMvc.perform(get("/api/v1/machines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[?(@.serialNumber == 'IM-001')].name").value("Motor IM-001"))
                .andExpect(jsonPath("$[?(@.serialNumber == 'IM-001')].machineType.name").value("THREE_PHASE_INDUCTION_MOTOR"))
                .andReturn();

        JsonNode machinesJson = objectMapper.readTree(machinesResult.getResponse().getContentAsString());
        Long motorId = null;
        for (JsonNode m : machinesJson) {
            if ("IM-001".equals(m.get("serialNumber").asText())) {
                motorId = m.get("id").asLong();
                break;
            }
        }
        assertNotNull(motorId, "Seeded machine Motor IM-001 must have an ID");

        // 2. Query sensors for Motor IM-001
        mockMvc.perform(get("/api/v1/machines/" + motorId + "/sensors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[?(@.sensorType.name == 'VIBRATION')].label").value("Drive-End Bearing Vibration"))
                .andExpect(jsonPath("$[?(@.sensorType.name == 'CURRENT')].label").value("Stator Phase Current RMS"))
                .andExpect(jsonPath("$[?(@.sensorType.name == 'TEMPERATURE')].label").value("Winding Temperature"))
                .andExpect(jsonPath("$[?(@.sensorType.name == 'RPM')].label").value("Rotor Speed"));
    }

    // ========================================================================
    // 2. MACHINE TYPE API TESTS
    // ========================================================================

    @Test
    @DisplayName("Test Machine Type CRUD lifecycle and conflict prevention")
    void testMachineTypeLifecycle() throws Exception {
        // 1. Create a new Machine Type
        CreateMachineTypeRequest createReq = new CreateMachineTypeRequest(
                "CENTRIFUGAL_PUMP",
                "Centrifugal Pump",
                "Industrial centrifugal water pump",
                "Grundfos CR-32"
        );

        MvcResult createRes = mockMvc.perform(post("/api/v1/machine-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("CENTRIFUGAL_PUMP"))
                .andExpect(jsonPath("$.displayName").value("Centrifugal Pump"))
                .andReturn();

        Long typeId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Get by ID
        mockMvc.perform(get("/api/v1/machine-types/" + typeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("CENTRIFUGAL_PUMP"));

        // 3. Update
        UpdateMachineTypeRequest updateReq = new UpdateMachineTypeRequest(
                "Centrifugal Water Pump Updated",
                "Updated description",
                "Grundfos CR-64"
        );

        mockMvc.perform(put("/api/v1/machine-types/" + typeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Centrifugal Water Pump Updated"))
                .andExpect(jsonPath("$.manufacturerModel").value("Grundfos CR-64"));

        // 4. Duplicate name check -> 409 Conflict
        mockMvc.perform(post("/api/v1/machine-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("already exists")));

        // 5. Delete
        mockMvc.perform(delete("/api/v1/machine-types/" + typeId))
                .andExpect(status().isNoContent());

        // 6. Verify 404 after deletion
        mockMvc.perform(get("/api/v1/machine-types/" + typeId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Prevent deleting a Machine Type that has associated machines")
    void testMachineTypeDeleteConflict() throws Exception {
        // Find THREE_PHASE_INDUCTION_MOTOR which has Motor IM-001
        MvcResult typesResult = mockMvc.perform(get("/api/v1/machine-types"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode typesJson = objectMapper.readTree(typesResult.getResponse().getContentAsString());
        Long motorTypeId = null;
        for (JsonNode t : typesJson) {
            if ("THREE_PHASE_INDUCTION_MOTOR".equals(t.get("name").asText())) {
                motorTypeId = t.get("id").asLong();
                break;
            }
        }
        assertNotNull(motorTypeId);

        mockMvc.perform(delete("/api/v1/machine-types/" + motorTypeId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("associated with it")));
    }

    // ========================================================================
    // 3. MACHINE API TESTS
    // ========================================================================

    @Test
    @DisplayName("Test Machine CRUD lifecycle, update, and deletion")
    void testMachineLifecycle() throws Exception {
        // Find machine type ID for THREE_PHASE_INDUCTION_MOTOR
        MvcResult typesResult = mockMvc.perform(get("/api/v1/machine-types"))
                .andExpect(status().isOk())
                .andReturn();
        Long typeId = objectMapper.readTree(typesResult.getResponse().getContentAsString()).get(0).get("id").asLong();

        // 1. Create a new Machine
        CreateMachineRequest createReq = new CreateMachineRequest(
                typeId,
                "Motor IM-TEST-02",
                "IM-TEST-02",
                "Testing Facility Room 101",
                new BigDecimal("22.00"),
                new BigDecimal("415.00"),
                new BigDecimal("39.50"),
                new BigDecimal("1450.00"),
                LocalDate.of(2026, 3, 1),
                MachineStatus.ACTIVE
        );

        MvcResult createRes = mockMvc.perform(post("/api/v1/machines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Motor IM-TEST-02"))
                .andExpect(jsonPath("$.serialNumber").value("IM-TEST-02"))
                .andExpect(jsonPath("$.ratedPowerKw").value(22.0))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        Long machineId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Get by ID
        mockMvc.perform(get("/api/v1/machines/" + machineId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serialNumber").value("IM-TEST-02"));

        // 3. Update Machine
        UpdateMachineRequest updateReq = new UpdateMachineRequest(
                typeId,
                "Motor IM-TEST-02 Updated",
                "Testing Facility Room 102",
                new BigDecimal("25.00"),
                new BigDecimal("415.00"),
                new BigDecimal("44.00"),
                new BigDecimal("1480.00"),
                LocalDate.of(2026, 3, 1),
                MachineStatus.INACTIVE
        );

        mockMvc.perform(put("/api/v1/machines/" + machineId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Motor IM-TEST-02 Updated"))
                .andExpect(jsonPath("$.location").value("Testing Facility Room 102"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        // 4. Duplicate serial number conflict
        mockMvc.perform(post("/api/v1/machines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));

        // 5. Delete Machine
        mockMvc.perform(delete("/api/v1/machines/" + machineId))
                .andExpect(status().isNoContent());

        // 6. Verify 404 after deletion
        mockMvc.perform(get("/api/v1/machines/" + machineId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Validate Machine required fields and foreign keys")
    void testMachineValidationErrors() throws Exception {
        // Missing name and serialNumber
        CreateMachineRequest invalidReq = new CreateMachineRequest(
                1L,
                "",
                "",
                "Loc",
                null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/machines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.name").exists())
                .andExpect(jsonPath("$.validationErrors.serialNumber").exists());

        // Non-existent machine type ID
        CreateMachineRequest nonExistentTypeReq = new CreateMachineRequest(
                999999L,
                "Valid Machine",
                "SERIAL-UNIQUE-999",
                "Loc",
                null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/machines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nonExistentTypeReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Machine type not found")));
    }

    // ========================================================================
    // 4. SENSOR TYPE API TESTS
    // ========================================================================

    @Test
    @DisplayName("Test Sensor Type CRUD lifecycle")
    void testSensorTypeLifecycle() throws Exception {
        // 1. Create a new sensor type
        CreateSensorTypeRequest createReq = new CreateSensorTypeRequest(
                "PRESSURE",
                "bar",
                "Fluid hydraulic pressure",
                "Pressure"
        );

        MvcResult createRes = mockMvc.perform(post("/api/v1/sensor-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("PRESSURE"))
                .andExpect(jsonPath("$.unit").value("bar"))
                .andReturn();

        Long sensorTypeId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Get by ID
        mockMvc.perform(get("/api/v1/sensor-types/" + sensorTypeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unit").value("bar"));

        // 3. Update
        UpdateSensorTypeRequest updateReq = new UpdateSensorTypeRequest(
                "psi",
                "Pounds per square inch pressure",
                "Pressure"
        );

        mockMvc.perform(put("/api/v1/sensor-types/" + sensorTypeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unit").value("psi"));

        // 4. Duplicate name -> 409 Conflict
        mockMvc.perform(post("/api/v1/sensor-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));

        // 5. Delete
        mockMvc.perform(delete("/api/v1/sensor-types/" + sensorTypeId))
                .andExpect(status().isNoContent());

        // 6. Verify 404 after deletion
        mockMvc.perform(get("/api/v1/sensor-types/" + sensorTypeId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Prevent deleting a Sensor Type that is assigned to machines")
    void testSensorTypeDeleteConflict() throws Exception {
        // Find VIBRATION sensor type
        MvcResult typesResult = mockMvc.perform(get("/api/v1/sensor-types"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode typesJson = objectMapper.readTree(typesResult.getResponse().getContentAsString());
        Long vibrationTypeId = null;
        for (JsonNode t : typesJson) {
            if ("VIBRATION".equals(t.get("name").asText())) {
                vibrationTypeId = t.get("id").asLong();
                break;
            }
        }
        assertNotNull(vibrationTypeId);

        mockMvc.perform(delete("/api/v1/sensor-types/" + vibrationTypeId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("reference it")));
    }

    // ========================================================================
    // 5. MACHINE SENSOR API TESTS & THRESHOLD VALIDATION
    // ========================================================================

    @Test
    @DisplayName("Test Machine Sensor assignment, thresholds update, and removal")
    void testMachineSensorLifecycle() throws Exception {
        // Get Motor IM-001 id and VIBRATION sensor type id
        MvcResult machinesRes = mockMvc.perform(get("/api/v1/machines")).andExpect(status().isOk()).andReturn();
        Long motorId = objectMapper.readTree(machinesRes.getResponse().getContentAsString()).get(0).get("id").asLong();

        MvcResult sensorTypesRes = mockMvc.perform(get("/api/v1/sensor-types")).andExpect(status().isOk()).andReturn();
        Long vibTypeId = null;
        for (JsonNode st : objectMapper.readTree(sensorTypesRes.getResponse().getContentAsString())) {
            if ("VIBRATION".equals(st.get("name").asText())) {
                vibTypeId = st.get("id").asLong();
                break;
            }
        }
        assertNotNull(vibTypeId);

        // 1. Assign a new sensor to the machine
        CreateMachineSensorRequest createSensorReq = new CreateMachineSensorRequest(
                vibTypeId,
                "Non-Drive-End Vibration Y-Axis",
                new BigDecimal("0.4000"),
                new BigDecimal("2.2000"),
                new BigDecimal("2.2000"),
                new BigDecimal("4.0000"),
                new BigDecimal("4.0000"),
                new BigDecimal("7.5000"),
                true
        );

        MvcResult createSensorRes = mockMvc.perform(post("/api/v1/machines/" + motorId + "/sensors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSensorReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.label").value("Non-Drive-End Vibration Y-Axis"))
                .andExpect(jsonPath("$.normalMin").value(0.4))
                .andExpect(jsonPath("$.normalMax").value(2.2))
                .andReturn();

        Long sensorId = objectMapper.readTree(createSensorRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Get specific sensor
        mockMvc.perform(get("/api/v1/machines/" + motorId + "/sensors/" + sensorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Non-Drive-End Vibration Y-Axis"));

        // 3. Update sensor thresholds
        UpdateMachineSensorRequest updateSensorReq = new UpdateMachineSensorRequest(
                vibTypeId,
                "Non-Drive-End Vibration Y-Axis (Calibrated)",
                new BigDecimal("0.5000"),
                new BigDecimal("2.3000"),
                new BigDecimal("2.3000"),
                new BigDecimal("4.2000"),
                new BigDecimal("4.2000"),
                new BigDecimal("8.0000"),
                true
        );

        mockMvc.perform(put("/api/v1/machines/" + motorId + "/sensors/" + sensorId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateSensorReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Non-Drive-End Vibration Y-Axis (Calibrated)"))
                .andExpect(jsonPath("$.normalMin").value(0.5))
                .andExpect(jsonPath("$.criticalMax").value(8.0));

        // 4. Delete sensor
        mockMvc.perform(delete("/api/v1/machines/" + motorId + "/sensors/" + sensorId))
                .andExpect(status().isNoContent());

        // 5. Verify 404 after deletion
        mockMvc.perform(get("/api/v1/machines/" + motorId + "/sensors/" + sensorId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Validate Machine Sensor errors: invalid IDs, invalid thresholds, duplicate labels")
    void testMachineSensorValidationErrors() throws Exception {
        MvcResult machinesRes = mockMvc.perform(get("/api/v1/machines")).andExpect(status().isOk()).andReturn();
        Long motorId = objectMapper.readTree(machinesRes.getResponse().getContentAsString()).get(0).get("id").asLong();

        // 1. Invalid Machine ID -> 404
        mockMvc.perform(get("/api/v1/machines/999999/sensors"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Machine not found")));

        // 2. Invalid Sensor Type ID -> 404
        CreateMachineSensorRequest invalidTypeReq = new CreateMachineSensorRequest(
                999999L,
                "Invalid Type Sensor",
                null, null, null, null, null, null, true
        );

        mockMvc.perform(post("/api/v1/machines/" + motorId + "/sensors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidTypeReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Sensor type not found")));

        // 3. Inverted threshold values (normalMin > normalMax) -> 400 Bad Request
        CreateMachineSensorRequest invertedThresholdReq = new CreateMachineSensorRequest(
                1L,
                "Inverted Threshold Sensor",
                new BigDecimal("50.00"), // normalMin > normalMax
                new BigDecimal("10.00"),
                null, null, null, null, true
        );

        mockMvc.perform(post("/api/v1/machines/" + motorId + "/sensors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invertedThresholdReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot be greater than normalMax")));

        // 4. Duplicate label on same machine -> 409 Conflict
        CreateMachineSensorRequest duplicateLabelReq = new CreateMachineSensorRequest(
                1L,
                "Drive-End Bearing Vibration", // already exists on Motor IM-001
                null, null, null, null, null, null, true
        );

        mockMvc.perform(post("/api/v1/machines/" + motorId + "/sensors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateLabelReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists on machine")));
    }
}
