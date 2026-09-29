"""
Maintenance Intelligence Service for MACHINA-X.

Determines deterministic maintenance priorities and actionable condition-based recommendations.
NOTE: These are project-level automated suggestions and do not replace certified physical inspection.
"""
from typing import Dict, Any


RECOMMENDATION_TEMPLATES = {
    "NORMAL": "Continue standard monitoring. All sensor parameters are within normal baseline tolerances.",
    "BEARING_DEFECT": "Inspect drive-end bearing and check vibration trend.",
    "BROKEN_ROTOR_BAR": "Schedule rotor inspection and review current imbalance.",
    "STATOR_SHORT": "Inspect stator winding condition and electrical measurements.",
    "ECCENTRICITY": "Inspect rotor alignment and air-gap condition.",
    "UNCLASSIFIED": "Perform general mechanical and electrical inspection."
}


class MaintenanceService:
    def determine_maintenance_intelligence(
        self,
        operating_state: str,
        health_score: float,
        anomaly_score: float,
        fault_type: str,
        fault_probability: float,
        estimated_rul_hours: float
    ) -> Dict[str, Any]:
        """
        Calculates maintenance priority (P1_IMMEDIATE, P2_SCHEDULE, P3_MONITOR)
        and provides specific actionable recommendation text.
        """
        norm_fault = fault_type.upper() if fault_type else "NORMAL"
        
        # 1. Determine Priority
        is_p1 = (
            operating_state.upper() == "CRITICAL"
            or anomaly_score >= 0.70
            or estimated_rul_hours <= 150.0
            or (fault_probability >= 0.85 and norm_fault in ["STATOR_SHORT", "BEARING_DEFECT"])
        )
        
        is_p2 = (
            operating_state.upper() in ["WARNING", "WATCH"]
            or (0.30 <= anomaly_score < 0.70)
            or (150.0 < estimated_rul_hours <= 1200.0)
            or (norm_fault not in ["NORMAL", "NONE"])
        )

        if is_p1:
            priority = "P1_IMMEDIATE"
        elif is_p2:
            priority = "P2_SCHEDULE"
        else:
            priority = "P3_MONITOR"

        # 2. Get Recommendation
        recommendation = RECOMMENDATION_TEMPLATES.get(norm_fault, RECOMMENDATION_TEMPLATES["UNCLASSIFIED"])

        return {
            "priority": priority,
            "faultType": norm_fault,
            "recommendation": recommendation,
            "disclaimer": "Project-level advisory; verify with qualified maintenance personnel before taking physical action."
        }


maintenance_service = MaintenanceService()
