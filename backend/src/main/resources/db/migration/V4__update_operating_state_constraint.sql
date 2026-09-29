-- ----------------------------------------------------------------------------
-- V4__update_operating_state_constraint.sql
-- Update digital_twin_states check constraint to allow UNKNOWN operating state
-- ----------------------------------------------------------------------------

ALTER TABLE digital_twin_states DROP CONSTRAINT IF EXISTS chk_operating_state;
ALTER TABLE digital_twin_states ADD CONSTRAINT chk_operating_state 
    CHECK (operating_state IN ('NORMAL', 'WATCH', 'WARNING', 'CRITICAL', 'UNKNOWN'));
