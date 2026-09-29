-- ----------------------------------------------------------------------------
-- V8__create_prediction_explanations.sql
-- Model SHAP explanations table for MACHINA-X ML predictions
-- ----------------------------------------------------------------------------
CREATE TABLE prediction_explanations (
    id BIGSERIAL PRIMARY KEY,
    ml_prediction_id BIGINT NOT NULL REFERENCES ml_predictions(id) ON DELETE CASCADE,
    feature_name VARCHAR(50) NOT NULL,
    feature_value NUMERIC(12, 4) NOT NULL,
    shap_value NUMERIC(10, 6) NOT NULL,
    impact VARCHAR(50) NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prediction_explanations_pred_id ON prediction_explanations(ml_prediction_id);
