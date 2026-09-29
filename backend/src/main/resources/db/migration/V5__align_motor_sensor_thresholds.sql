-- ============================================================================
-- MACHINA-X Digital Twin & Predictive Maintenance System
-- V5__align_motor_sensor_thresholds.sql
-- Align Motor IM-001 sensor thresholds with physical simulation baseline
-- ============================================================================

UPDATE machine_sensors ms
SET 
    normal_min = 0.5000, normal_max = 2.8000,
    warning_min = 2.8000, warning_max = 4.5000,
    critical_min = 4.5000, critical_max = 8.0000
FROM machines m, sensor_types st
WHERE ms.machine_id = m.id AND ms.sensor_type_id = st.id
  AND m.serial_number = 'IM-001' AND st.name = 'VIBRATION';

UPDATE machine_sensors ms
SET 
    normal_min = 10.0000, normal_max = 16.0000,
    warning_min = 16.0000, warning_max = 22.0000,
    critical_min = 22.0000, critical_max = 45.0000
FROM machines m, sensor_types st
WHERE ms.machine_id = m.id AND ms.sensor_type_id = st.id
  AND m.serial_number = 'IM-001' AND st.name = 'CURRENT';

UPDATE machine_sensors ms
SET 
    normal_min = 40.0000, normal_max = 70.0000,
    warning_min = 70.0000, warning_max = 85.0000,
    critical_min = 85.0000, critical_max = 120.0000
FROM machines m, sensor_types st
WHERE ms.machine_id = m.id AND ms.sensor_type_id = st.id
  AND m.serial_number = 'IM-001' AND st.name = 'TEMPERATURE';

UPDATE machine_sensors ms
SET 
    normal_min = 2850.0000, normal_max = 2950.0000,
    warning_min = 2700.0000, warning_max = 2850.0000,
    critical_min = 2400.0000, critical_max = 2700.0000
FROM machines m, sensor_types st
WHERE ms.machine_id = m.id AND ms.sensor_type_id = st.id
  AND m.serial_number = 'IM-001' AND st.name = 'RPM';
