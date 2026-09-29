-- ----------------------------------------------------------------------------
-- V6__create_rul_predictions.sql
-- Remaining Useful Life (RUL) predictions table for MACHINA-X Digital Twin
-- ----------------------------------------------------------------------------
CREATE TABLE rul_predictions (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    estimated_rul_hours NUMERIC(10, 2) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    degradation_trend VARCHAR(30) NOT NULL,
    prediction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rul_predictions_machine_time ON rul_predictions(machine_id, created_at DESC);
