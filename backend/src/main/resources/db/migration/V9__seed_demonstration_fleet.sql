-- ============================================================================
-- MACHINA-X Digital Twin & Predictive Maintenance System
-- V9__seed_demonstration_fleet.sql — Seed Industrial Fleet (Motors IM-002 to IM-008)
-- Total Fleet: 8 Machines (5 Healthy, 2 Warning, 1 Critical)
-- ============================================================================

-- 1. Insert Demo Machines IM-002 through IM-008
INSERT INTO machines (
    machine_type_id,
    name,
    serial_number,
    location,
    rated_power_kw,
    rated_voltage_v,
    rated_current_a,
    rated_speed_rpm,
    installation_date,
    status
)
SELECT 
    mt.id,
    m.name,
    m.serial_number,
    m.location,
    m.rated_power_kw,
    m.rated_voltage_v,
    m.rated_current_a,
    m.rated_speed_rpm,
    m.installation_date::date,
    m.status
FROM machine_types mt
CROSS JOIN (
    VALUES 
        ('Motor IM-002', 'IM-002', 'Plant A - Bay 4', 15.00, 415.00, 28.00, 2900.00, '2026-01-20', 'ACTIVE'),
        ('Motor IM-003', 'IM-003', 'Plant B - Line 1', 22.00, 415.00, 40.00, 2950.00, '2025-11-10', 'ACTIVE'),
        ('Motor IM-004', 'IM-004', 'Plant B - Line 2', 22.00, 415.00, 40.00, 2950.00, '2025-11-12', 'ACTIVE'),
        ('Motor IM-005', 'IM-005', 'Plant C - Compressor 1', 30.00, 415.00, 54.00, 1480.00, '2025-08-05', 'ACTIVE'),
        ('Motor IM-006', 'IM-006', 'Plant C - Compressor 2', 30.00, 415.00, 54.00, 1480.00, '2025-08-08', 'ACTIVE'),
        ('Motor IM-007', 'IM-007', 'Plant D - Pump Station', 11.00, 415.00, 21.00, 1450.00, '2026-02-01', 'ACTIVE'),
        ('Motor IM-008', 'IM-008', 'Plant D - Auxiliary Feed', 7.50, 415.00, 15.00, 1450.00, '2026-02-15', 'ACTIVE')
) AS m(name, serial_number, location, rated_power_kw, rated_voltage_v, rated_current_a, rated_speed_rpm, installation_date, status)
WHERE mt.name = 'THREE_PHASE_INDUCTION_MOTOR'
ON CONFLICT (serial_number) DO NOTHING;

-- 2. Attach Standard 4 Sensors to Machines IM-002 through IM-008
-- VIBRATION: Drive-End Bearing Vibration (mm/s)
INSERT INTO machine_sensors (machine_id, sensor_type_id, label, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, is_active)
SELECT m.id, st.id, 'Drive-End Bearing Vibration', 0.5000, 2.8000, 2.8000, 4.5000, 4.5000, 8.0000, TRUE
FROM machines m, sensor_types st
WHERE m.serial_number IN ('IM-002', 'IM-003', 'IM-004', 'IM-005', 'IM-006', 'IM-007', 'IM-008') AND st.name = 'VIBRATION'
ON CONFLICT (machine_id, label) DO NOTHING;

-- CURRENT: Stator Phase Current RMS (A)
INSERT INTO machine_sensors (machine_id, sensor_type_id, label, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, is_active)
SELECT m.id, st.id, 'Stator Phase Current RMS', 10.0000, 45.0000, 45.0000, 60.0000, 60.0000, 90.0000, TRUE
FROM machines m, sensor_types st
WHERE m.serial_number IN ('IM-002', 'IM-003', 'IM-004', 'IM-005', 'IM-006', 'IM-007', 'IM-008') AND st.name = 'CURRENT'
ON CONFLICT (machine_id, label) DO NOTHING;

-- TEMPERATURE: Winding Temperature (°C)
INSERT INTO machine_sensors (machine_id, sensor_type_id, label, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, is_active)
SELECT m.id, st.id, 'Winding Temperature', 40.0000, 75.0000, 75.0000, 90.0000, 90.0000, 120.0000, TRUE
FROM machines m, sensor_types st
WHERE m.serial_number IN ('IM-002', 'IM-003', 'IM-004', 'IM-005', 'IM-006', 'IM-007', 'IM-008') AND st.name = 'TEMPERATURE'
ON CONFLICT (machine_id, label) DO NOTHING;

-- RPM: Rotor Speed (rpm)
INSERT INTO machine_sensors (machine_id, sensor_type_id, label, normal_min, normal_max, warning_min, warning_max, critical_min, critical_max, is_active)
SELECT m.id, st.id, 'Rotor Speed', 1400.0000, 3000.0000, 1200.0000, 1400.0000, 1000.0000, 1200.0000, TRUE
FROM machines m, sensor_types st
WHERE m.serial_number IN ('IM-002', 'IM-003', 'IM-004', 'IM-005', 'IM-006', 'IM-007', 'IM-008') AND st.name = 'RPM'
ON CONFLICT (machine_id, label) DO NOTHING;

-- 3. Seed Realistic Baseline Readings for IM-002 through IM-008
-- IM-002 (Warning - Bearing Degradation: elevated vibration 4.9 mm/s, temp 72°C, 2880 rpm, current 32A)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 4.9000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-002' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 32.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-002' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 72.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-002' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 2880.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-002' AND ms.label = 'Rotor Speed';

-- IM-003 (Critical - Stator Short / Overheating: vibration 7.2 mm/s, current 43A, temp 98°C, 2620 rpm)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 7.2000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-003' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 43.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-003' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 98.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-003' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 2620.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-003' AND ms.label = 'Rotor Speed';

-- IM-004 (Healthy: vibration 1.4 mm/s, current 36A, temp 58°C, 2940 rpm)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1.4000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-004' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 36.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-004' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 58.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-004' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 2940.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-004' AND ms.label = 'Rotor Speed';

-- IM-005 (Healthy: vibration 1.6 mm/s, current 48A, temp 61°C, 1480 rpm)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1.6000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-005' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 48.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-005' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 61.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-005' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1480.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-005' AND ms.label = 'Rotor Speed';

-- IM-006 (Warning - Thermal Stress: vibration 3.8 mm/s, current 50A, temp 88°C, 1465 rpm)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 3.8000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-006' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 50.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-006' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 88.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-006' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1465.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-006' AND ms.label = 'Rotor Speed';

-- IM-007 (Healthy: vibration 1.1 mm/s, current 19A, temp 52°C, 1450 rpm)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1.1000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-007' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 19.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-007' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 52.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-007' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1450.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-007' AND ms.label = 'Rotor Speed';

-- IM-008 (Healthy: vibration 0.9 mm/s, current 14A, temp 48°C, 1455 rpm)
INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 0.9000, 'mm/s', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-008' AND ms.label = 'Drive-End Bearing Vibration';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 14.0000, 'A', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-008' AND ms.label = 'Stator Phase Current RMS';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 48.0000, '°C', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-008' AND ms.label = 'Winding Temperature';

INSERT INTO sensor_readings (machine_sensor_id, value, unit, quality, source, recorded_at)
SELECT ms.id, 1455.0000, 'rpm', 'GOOD', 'SIMULATED', NOW()
FROM machine_sensors ms JOIN machines m ON ms.machine_id = m.id WHERE m.serial_number = 'IM-008' AND ms.label = 'Rotor Speed';

-- 4. Seed Initial Digital Twin States for IM-002 through IM-008
INSERT INTO digital_twin_states (
    machine_id, health_score, operating_state, anomaly_detected, anomaly_score,
    current_fault_type, fault_probability, rul_hours, last_sensor_batch_at, updated_at
)
SELECT 
    m.id,
    s.health_score,
    s.operating_state,
    s.anomaly_detected,
    s.anomaly_score,
    s.current_fault_type,
    s.fault_probability,
    s.rul_hours,
    NOW(),
    NOW()
FROM machines m
JOIN (
    VALUES
        ('IM-002', 76.00, 'WARNING', TRUE, 0.2400, 'BEARING_DEFECT', 0.8200, 312.00),
        ('IM-003', 42.00, 'CRITICAL', TRUE, 0.5800, 'STATOR_SHORT', 0.9400, 48.00),
        ('IM-004', 96.00, 'NORMAL', FALSE, 0.0400, 'NONE', 0.0200, 2400.00),
        ('IM-005', 91.00, 'NORMAL', FALSE, 0.0900, 'NONE', 0.0500, 1950.00),
        ('IM-006', 68.00, 'WARNING', TRUE, 0.3200, 'UNCLASSIFIED', 0.7800, 180.00),
        ('IM-007', 98.00, 'NORMAL', FALSE, 0.0200, 'NONE', 0.0100, 2800.00),
        ('IM-008', 95.00, 'NORMAL', FALSE, 0.0500, 'NONE', 0.0300, 2200.00)
) AS s(serial_number, health_score, operating_state, anomaly_detected, anomaly_score, current_fault_type, fault_probability, rul_hours)
ON m.serial_number = s.serial_number
ON CONFLICT (machine_id) DO UPDATE SET
    health_score = EXCLUDED.health_score,
    operating_state = EXCLUDED.operating_state,
    anomaly_detected = EXCLUDED.anomaly_detected,
    anomaly_score = EXCLUDED.anomaly_score,
    current_fault_type = EXCLUDED.current_fault_type,
    fault_probability = EXCLUDED.fault_probability,
    rul_hours = EXCLUDED.rul_hours,
    updated_at = NOW();
