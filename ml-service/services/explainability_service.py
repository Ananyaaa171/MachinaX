"""
SHAP Explainability Service for MACHINA-X ML Engine.

Computes exact feature attribution using SHAP TreeExplainer for the XGBoost fault classifier.
Generates structured feature contributions and deterministic human-readable explanations.
"""
from typing import Dict, List, Any, Tuple
import numpy as np
import pandas as pd
import shap

from services.feature_extractor import feature_extractor, FEATURE_NAMES
from training.train_models import INV_LABEL_MAP, LABEL_MAP


def classify_impact(shap_val: float) -> str:
    """
    Derives deterministic impact direction and intensity from SHAP value.
    
    SHAP Value Thresholds:
    - >= +0.50: HIGH POSITIVE IMPACT (strongly pushed prediction towards this class)
    - +0.15 to +0.50: MODERATE POSITIVE IMPACT (moderately supported prediction)
    - -0.15 to +0.15: LOW IMPACT (negligible contribution)
    - < -0.15: NEGATIVE IMPACT (pushed prediction away from this class)
    """
    if shap_val >= 0.50:
        return "HIGH POSITIVE IMPACT"
    elif shap_val >= 0.15:
        return "MODERATE POSITIVE IMPACT"
    elif shap_val >= -0.15:
        return "LOW IMPACT"
    else:
        return "NEGATIVE IMPACT"


class ExplainabilityService:
    def __init__(self):
        self._explainer = None
        self._model = None

    def initialize(self, xgb_model):
        """Initializes the SHAP TreeExplainer with the trained XGBoost model."""
        self._model = xgb_model
        try:
            self._explainer = shap.TreeExplainer(xgb_model)
            print("SHAP TreeExplainer initialized successfully.")
        except Exception as e:
            print(f"Failed to initialize SHAP TreeExplainer: {e}")
            self._explainer = None

    def explain(
        self,
        sensors: Dict[str, float],
        predicted_class_idx: int,
        fault_type: str,
        fault_probability: float,
        model_version: str = "1.0"
    ) -> Dict[str, Any]:
        """
        Calculates SHAP feature contributions for the specified sensor reading.
        """
        # 1. Extract and scale features using the same deterministic pipeline
        feature_vector, feature_dict = feature_extractor.extract_features_from_dict(sensors)
        
        # 2. Compute SHAP values
        raw_shap_values = {}
        if self._explainer is not None:
            try:
                # TreeExplainer on multi-class returns ndarray of shape (1, num_features, num_classes) or list
                shap_vals = self._explainer.shap_values(feature_vector)
                if isinstance(shap_vals, list):
                    class_shap = shap_vals[predicted_class_idx][0]
                elif len(shap_vals.shape) == 3:
                    class_shap = shap_vals[0, :, predicted_class_idx]
                else:
                    class_shap = shap_vals[0]

                for name, val in zip(FEATURE_NAMES, class_shap):
                    raw_shap_values[name] = float(val)
            except Exception as e:
                print(f"SHAP explanation computation fallback: {e}")
                raw_shap_values = {name: 0.0 for name in FEATURE_NAMES}
        else:
            raw_shap_values = {name: 0.0 for name in FEATURE_NAMES}

        # 3. Aggregate contributions for the 4 primary physical sensors
        sensor_shap = {}
        for s in ["vibration", "current", "temperature", "rpm"]:
            raw_val = feature_dict.get(s, 0.0)
            base_shap = raw_shap_values.get(s, 0.0)
            dev_shap = raw_shap_values.get(f"{s}_dev", 0.0)
            total_shap = base_shap + dev_shap
            sensor_shap[s] = (raw_val, total_shap)

        # 4. Build feature contribution list
        feature_contributions = []
        for s, (val, s_val) in sensor_shap.items():
            impact = classify_impact(s_val)
            feature_contributions.append({
                "feature": s,
                "value": round(float(val), 2),
                "shapValue": round(float(s_val), 4),
                "impact": impact
            })

        # Sort contributions by absolute SHAP magnitude descending
        feature_contributions.sort(key=lambda x: abs(x["shapValue"]), reverse=True)

        # 5. Generate human-readable explanation summary
        summary = self._generate_summary(fault_type, feature_contributions)

        return {
            "faultType": fault_type,
            "faultProbability": round(float(fault_probability), 4),
            "features": feature_contributions,
            "summary": summary,
            "modelVersion": model_version
        }

    def _generate_summary(self, fault_type: str, contributions: List[Dict[str, Any]]) -> str:
        """
        Generates deterministic, non-causal explanation based on SHAP ranking.
        Uses language indicating contribution to model prediction rather than physical causation.
        """
        if fault_type == "NORMAL":
            return "All sensor parameters are operating within normal baseline ranges, contributing positively to the normal operating state prediction."

        # Find positive contributors
        pos_contributors = [c for c in contributions if c["shapValue"] > 0.10]
        
        if not pos_contributors:
            return f"Model classified condition as {fault_type} based on overall multivariate operating profile."

        top = pos_contributors[0]
        top_name = top["feature"].capitalize()
        
        if len(pos_contributors) == 1:
            if top["impact"] == "HIGH POSITIVE IMPACT":
                return f"High {top_name.lower()} is the strongest contributing factor to the {fault_type} model prediction."
            else:
                return f"{top_name} contributed moderately to the {fault_type} model prediction."
        
        second = pos_contributors[1]
        second_name = second["feature"].capitalize()
        return f"{top_name} and {second_name.lower()} contributed most strongly to the {fault_type} model prediction."


explainability_service = ExplainabilityService()
