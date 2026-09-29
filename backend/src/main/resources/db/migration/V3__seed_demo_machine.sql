-- ============================================================================
-- MACHINA-X Digital Twin & Predictive Maintenance System
-- V3__seed_demo_machine.sql — Demo Machine (Motor IM-001) & Sensors Seed Data
-- ============================================================================

-- 1. Insert Initial Demo Machine: Motor IM-001
-- Type: THREE_PHASE_INDUCTION_MOTOR
-- Rated: 15 kW, 415 V, 28 A, 2900 RPM
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
    id,
    'Motor IM-001',
    'IM-001',
    'Plant A - Bay 3',
    15.00,
    415.00,
    28.00,
    2900.00,
    '2026-01-15',
    'ACTIVE'
FROM machine_types
WHERE name = 'THREE_PHASE_INDUCTION_MOTOR'
ON CONFLICT (serial_number) DO NOTHING;

-- 2. Associate the four initial sensor types with Motor IM-001
-- VIBRATION: Drive-End Bearing Vibration (mm/s)
INSERT INTO machine_sensors (
    machine_id,
    sensor_type_id,
    label,
    normal_min,
    normal_max,
    warning_min,
    warning_max,
    critical_min,
    critical_max,
    is_active
)
SELECT 
    m.id,
    st.id,
    'Drive-End Bearing Vibration',
    0.5000,
    2.5000,
    2.5000,
    4.5000,
    4.5000,
    8.0000,
    TRUE
FROM machines m, sensor_types st
WHERE m.serial_number = 'IM-001' AND st.name = 'VIBRATION'
ON CONFLICT (machine_id, label) DO NOTHING;

-- CURRENT: Stator Phase Current RMS (A)
INSERT INTO machine_sensors (
    machine_id,
    sensor_type_id,
    label,
    normal_min,
    normal_max,
    warning_min,
    warning_max,
    critical_min,
    critical_max,
    is_active
)
SELECT 
    m.id,
    st.id,
    'Stator Phase Current RMS',
    20.0000,
    28.0000,
    28.0000,
    35.0000,
    35.0000,
    45.0000,
    TRUE
FROM machines m, sensor_types st
WHERE m.serial_number = 'IM-001' AND st.name = 'CURRENT'
ON CONFLICT (machine_id, label) DO NOTHING;

-- TEMPERATURE: Winding Temperature (°C)
INSERT INTO machine_sensors (
    machine_id,
    sensor_type_id,
    label,
    normal_min,
    normal_max,
    warning_min,
    warning_max,
    critical_min,
    critical_max,
    is_active
)
SELECT 
    m.id,
    st.id,
    'Winding Temperature',
    40.0000,
    75.0000,
    75.0000,
    90.0000,
    90.0000,
    120.0000,
    TRUE
FROM machines m, sensor_types st
WHERE m.serial_number = 'IM-001' AND st.name = 'TEMPERATURE'
ON CONFLICT (machine_id, label) DO NOTHING;

-- RPM: Rotor Speed (rpm)
INSERT INTO machine_sensors (
    machine_id,
    sensor_type_id,
    label,
    normal_min,
    normal_max,
    warning_min,
    warning_max,
    critical_min,
    critical_max,
    is_active
)
SELECT 
    m.id,
    st.id,
    'Rotor Speed',
    2850.0000,
    2950.0000,
    2700.0000,
    2850.0000,
    2500.0000,
    2700.0000,
    TRUE
FROM machines m, sensor_types st
WHERE m.serial_number = 'IM-001' AND st.name = 'RPM'
ON CONFLICT (machine_id, label) DO NOTHING;
