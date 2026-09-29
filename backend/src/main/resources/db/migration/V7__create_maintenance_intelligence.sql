-- ----------------------------------------------------------------------------
-- V7__create_maintenance_intelligence.sql
-- Maintenance recommendations and intelligence table for MACHINA-X
-- ----------------------------------------------------------------------------
CREATE TABLE maintenance_recommendations (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    priority VARCHAR(30) NOT NULL,
    fault_type VARCHAR(50) NOT NULL,
    recommendation TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_maint_rec_priority CHECK (priority IN ('P1_IMMEDIATE', 'P2_SCHEDULE', 'P3_MONITOR'))
);

CREATE INDEX idx_maint_rec_machine_time ON maintenance_recommendations(machine_id, generated_at DESC);
CREATE INDEX idx_maint_rec_priority ON maintenance_recommendations(priority);
