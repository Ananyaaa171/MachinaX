-- ============================================================================
-- MACHINA-X Digital Twin & Predictive Maintenance System
-- V2__seed_initial_data.sql — Initial Seed Data
-- ============================================================================

-- Seed core Machine Type: THREE_PHASE_INDUCTION_MOTOR
INSERT INTO machine_types (name, display_name, description, manufacturer_model)
VALUES (
    'THREE_PHASE_INDUCTION_MOTOR',
    '3-Phase Induction Motor',
    'Industrial three-phase squirrel cage induction motor with continuous vibration, current, thermal, and speed monitoring',
    'ABB / Siemens 4-pole Squirrel Cage'
) ON CONFLICT (name) DO NOTHING;

-- Seed core Sensor Types: VIBRATION, CURRENT, TEMPERATURE, RPM
INSERT INTO sensor_types (name, unit, description, physical_quantity)
VALUES 
    ('VIBRATION', 'mm/s', 'Root mean square (RMS) vibration velocity across drive-end and non-drive-end bearings', 'Vibration Velocity'),
    ('CURRENT', 'A', 'Three-phase stator current RMS measurement for phase balance and broken rotor bar detection', 'Electric Current'),
    ('TEMPERATURE', '°C', 'Stator winding and bearing surface temperature monitoring for thermal insulation health', 'Temperature'),
    ('RPM', 'rpm', 'Rotor rotational angular speed measurement for slip and mechanical load calculation', 'Rotational Speed')
ON CONFLICT (name) DO NOTHING;
