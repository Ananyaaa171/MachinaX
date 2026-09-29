-- ============================================================================
-- MACHINA-X Digital Twin & Predictive Maintenance System
-- V1__initial_schema.sql — Core Database Foundation
-- Generic Architecture: Machine -> MachineType -> MachineSensor -> SensorReading
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. machine_types
-- Categorization for industrial equipment (e.g., 3-phase induction motor, pump, compressor)
-- ----------------------------------------------------------------------------
CREATE TABLE machine_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    manufacturer_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. machines
-- Specific physical machine instances being monitored
-- ----------------------------------------------------------------------------
CREATE TABLE machines (
    id BIGSERIAL PRIMARY KEY,
    machine_type_id BIGINT NOT NULL REFERENCES machine_types(id),
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(150),
    rated_power_kw NUMERIC(10, 2),
    rated_voltage_v NUMERIC(10, 2),
    rated_current_a NUMERIC(10, 2),
    rated_speed_rpm NUMERIC(10, 2),
    installation_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_machine_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED'))
);

CREATE INDEX idx_machines_machine_type_id ON machines(machine_type_id);
CREATE INDEX idx_machines_status ON machines(status);

-- ----------------------------------------------------------------------------
-- 3. sensor_types
-- Definition of physical sensor measurements (vibration, current, temperature, rpm, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE sensor_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    unit VARCHAR(30) NOT NULL,
    description TEXT,
    physical_quantity VARCHAR(100) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. machine_sensors
-- Sensor instances physically or logically attached to a machine
-- ----------------------------------------------------------------------------
CREATE TABLE machine_sensors (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    sensor_type_id BIGINT NOT NULL REFERENCES sensor_types(id),
    label VARCHAR(100) NOT NULL,
    normal_min NUMERIC(12, 4),
    normal_max NUMERIC(12, 4),
    warning_min NUMERIC(12, 4),
    warning_max NUMERIC(12, 4),
    critical_min NUMERIC(12, 4),
    critical_max NUMERIC(12, 4),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_machine_sensor_label UNIQUE (machine_id, label)
);

CREATE INDEX idx_machine_sensors_machine_id ON machine_sensors(machine_id);
CREATE INDEX idx_machine_sensors_sensor_type_id ON machine_sensors(sensor_type_id);

-- ----------------------------------------------------------------------------
-- 5. sensor_readings
-- Time-series telemetry readings from attached machine sensors
-- ----------------------------------------------------------------------------
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    machine_sensor_id BIGINT NOT NULL REFERENCES machine_sensors(id) ON DELETE CASCADE,
    value NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quality VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    source VARCHAR(30) NOT NULL DEFAULT 'SIMULATED',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reading_quality CHECK (quality IN ('GOOD', 'DEGRADED', 'MISSING')),
    CONSTRAINT chk_reading_source CHECK (source IN ('SIMULATED', 'IOT_EDGE', 'MANUAL'))
);

-- High-volume time-series composite index
CREATE INDEX idx_sensor_readings_sensor_time ON sensor_readings(machine_sensor_id, recorded_at DESC);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 6. digital_twin_states
-- One live digital twin state per machine
-- ----------------------------------------------------------------------------
CREATE TABLE digital_twin_states (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL UNIQUE REFERENCES machines(id) ON DELETE CASCADE,
    health_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    operating_state VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    anomaly_detected BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_score NUMERIC(6, 4),
    current_fault_type VARCHAR(50) NOT NULL DEFAULT 'NONE',
    fault_probability NUMERIC(5, 4),
    rul_hours NUMERIC(10, 2),
    rul_confidence_low NUMERIC(10, 2),
    rul_confidence_high NUMERIC(10, 2),
    last_sensor_batch_at TIMESTAMP WITH TIME ZONE,
    last_ml_inference_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_health_score_range CHECK (health_score >= 0.00 AND health_score <= 100.00),
    CONSTRAINT chk_operating_state CHECK (operating_state IN ('NORMAL', 'WATCH', 'WARNING', 'CRITICAL')),
    CONSTRAINT chk_fault_type CHECK (current_fault_type IN ('NONE', 'BROKEN_ROTOR_BAR', 'STATOR_SHORT', 'BEARING_DEFECT', 'ECCENTRICITY', 'UNCLASSIFIED'))
);

-- ----------------------------------------------------------------------------
-- 7. ml_predictions
-- Inference logs from 3-stage ML pipeline (Anomaly -> Fault -> RUL) with SHAP
-- ----------------------------------------------------------------------------
CREATE TABLE ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    input_features JSONB,
    output JSONB,
    anomaly_score NUMERIC(6, 4),
    fault_type VARCHAR(50),
    fault_probability NUMERIC(5, 4),
    rul_hours NUMERIC(10, 2),
    confidence_interval JSONB,
    shap_values JSONB,
    top_features JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ml_stage CHECK (stage IN ('ANOMALY', 'FAULT', 'RUL'))
);

CREATE INDEX idx_ml_predictions_machine_time ON ml_predictions(machine_id, created_at DESC);
CREATE INDEX idx_ml_predictions_stage ON ml_predictions(stage);

-- ----------------------------------------------------------------------------
-- 8. maintenance_alerts
-- Proactive alerts triggered by ML inference and rule engine
-- ----------------------------------------------------------------------------
CREATE TABLE maintenance_alerts (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    ml_prediction_id BIGINT REFERENCES ml_predictions(id) ON DELETE SET NULL,
    priority VARCHAR(10) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    recommended_action TEXT,
    shap_explanation JSONB,
    consecutive_count INTEGER NOT NULL DEFAULT 1,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_alert_priority CHECK (priority IN ('P1', 'P2', 'P3'))
);

CREATE INDEX idx_alerts_machine_status ON maintenance_alerts(machine_id, acknowledged, resolved);
CREATE INDEX idx_alerts_priority ON maintenance_alerts(priority);
CREATE INDEX idx_alerts_created_at ON maintenance_alerts(created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. maintenance_events
-- Recorded maintenance actions and work history
-- ----------------------------------------------------------------------------
CREATE TABLE maintenance_events (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    alert_id BIGINT REFERENCES maintenance_alerts(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    performed_by VARCHAR(100),
    parts_replaced TEXT,
    duration_hours NUMERIC(6, 2),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_machine_id ON maintenance_events(machine_id);
CREATE INDEX idx_events_performed_at ON maintenance_events(performed_at DESC);
