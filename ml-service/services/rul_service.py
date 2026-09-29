"""
Remaining Useful Life (RUL) Estimation Service for MACHINA-X.

NOTE ON METHODOLOGY:
This service provides a deterministic baseline physical-degradation RUL estimator.
Because run-to-failure historical industrial telemetry is not yet integrated, this model
acts as an extensible baseline incorporating health scores, anomaly scores, and fault profiles.
It can be replaced by deep learning (e.g., LSTM / Transformer) sequence models without breaking API contracts.
"""
from typing import Dict, Any, Optional


FAULT_SEVERITY_FACTORS = {
    "NORMAL": 1.0,
    "ECCENTRICITY": 0.55,
    "BROKEN_ROTOR_BAR": 0.45,
    "BEARING_DEFECT": 0.30,
    "STATOR_SHORT": 0.15,
    "UNCLASSIFIED": 0.40
}

NOMINAL_MOTOR_LIFESPAN_HOURS = 5000.0  # Standard overhaul interval for 5.5kW induction motor


class RULService:
    """
    Estimates Remaining Useful Life (in operating hours) based on multivariate health states.
    """
    def estimate_rul(
        self,
        health_score: float,
        anomaly_score: float,
        fault_type: str = "NORMAL",
        fault_probability: float = 0.0,
        model_version: str = "1.0"
    ) -> Dict[str, Any]:
        """
        Calculates deterministic RUL hours, confidence indicator, and degradation trend.
        
        Formula:
        health_ratio = clamp(health_score / 100.0, 0.01, 1.0)
        anomaly_penalty = 1.0 - (0.75 * clamp(anomaly_score, 0.0, 1.0))
        fault_factor = FAULT_SEVERITY_FACTORS.get(fault_type, 0.40)
        estimated_hours = NOMINAL_HOURS * (health_ratio ** 2.2) * anomaly_penalty * fault_factor
        """
        clamped_health = max(1.0, min(100.0, float(health_score)))
        clamped_anomaly = max(0.0, min(1.0, float(anomaly_score)))
        
        health_ratio = clamped_health / 100.0
        anomaly_penalty = 1.0 - (0.75 * clamped_anomaly)
        fault_factor = FAULT_SEVERITY_FACTORS.get(fault_type.upper(), 0.40)
        
        # Power-law degradation curve
        raw_hours = NOMINAL_MOTOR_LIFESPAN_HOURS * (health_ratio ** 2.2) * anomaly_penalty * fault_factor
        estimated_hours = max(1.0, round(raw_hours, 1))

        # Degradation trend classification
        if clamped_anomaly >= 0.60 or clamped_health < 50.0:
            trend = "ACCELERATING"
        elif clamped_anomaly >= 0.25 or clamped_health < 85.0:
            trend = "DEGRADING"
        else:
            trend = "STABLE"

        # Baseline heuristic confidence indicator
        if clamped_health >= 90.0 and clamped_anomaly < 0.20:
            confidence = "HIGH"
        elif clamped_health >= 60.0 or clamped_anomaly < 0.60:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"

        return {
            "estimatedRulHours": estimated_hours,
            "unit": "HOURS",
            "confidence": confidence,
            "confidenceType": "baseline confidence",
            "degradationTrend": trend,
            "modelVersion": model_version
        }


rul_service = RULService()
