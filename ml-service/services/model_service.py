"""
Model Service for MACHINA-X ML Inference.

Loads trained Isolation Forest and XGBoost artifacts, manages inference requests,
and generates structured ML predictions.
"""
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd

from config import settings
from schemas.prediction import PredictRequest, PredictResponse, HealthResponse
from schemas.explainability import ExplainRequest, ExplainResponse
from schemas.rul import RULRequest, RULResponse
from schemas.maintenance import MaintenanceRequest, MaintenanceResponse
from services.feature_extractor import feature_extractor
from services.explainability_service import explainability_service
from services.rul_service import rul_service
from services.maintenance_service import maintenance_service
from training.train_models import normalize_isolation_score, INV_LABEL_MAP, LABEL_MAP


class ModelService:
    def __init__(self):
        self.isolation_forest = None
        self.fault_classifier = None
        self.scaler = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.load_models()

    def load_models(self):
        """Loads model artifacts from disk if available and initializes SHAP explainer."""
        try:
            if (
                settings.isolation_forest_path.exists()
                and settings.fault_classifier_path.exists()
                and settings.scaler_path.exists()
            ):
                self.isolation_forest = joblib.load(settings.isolation_forest_path)
                self.fault_classifier = joblib.load(settings.fault_classifier_path)
                self.scaler = joblib.load(settings.scaler_path)

                if settings.metadata_path.exists():
                    with open(settings.metadata_path, "r", encoding="utf-8") as f:
                        self.metadata = json.load(f)
                else:
                    self.metadata = {"modelVersion": "1.0", "status": "active"}

                # Initialize SHAP TreeExplainer on loaded XGBoost classifier
                explainability_service.initialize(self.fault_classifier)

                self.is_loaded = True
                print("ML models and SHAP explainer loaded successfully.")
            else:
                self.is_loaded = False
                print("ML model artifacts not found on disk. Run training first.")
        except Exception as e:
            self.is_loaded = False
            print(f"Error loading ML models: {e}")

    def get_health(self) -> HealthResponse:
        """Returns the operational health and model status of the service."""
        return HealthResponse(
            status="UP",
            service="machinax-ml-service",
            version=settings.app_version,
            modelsLoaded=self.is_loaded,
            models=self.metadata if self.is_loaded else {"error": "Models not loaded"}
        )

    def predict(self, request: PredictRequest) -> PredictResponse:
        """
        Runs ML anomaly detection (Isolation Forest), fault classification (XGBoost),
        SHAP explainability, RUL estimation, and maintenance prioritization.
        """
        if not self.is_loaded or self.isolation_forest is None or self.fault_classifier is None or self.scaler is None:
            raise RuntimeError("ML models are not loaded. Please train or provide model artifacts.")

        start_time = time.perf_counter()

        # 1. Feature Extraction
        feature_vector, _ = feature_extractor.extract_features_from_dict(request.sensors)
        feature_df = pd.DataFrame(feature_vector, columns=feature_extractor.feature_names)

        # 2. Scale Features
        scaled_vector = self.scaler.transform(feature_df)

        # 3. Isolation Forest Inference
        raw_decision = self.isolation_forest.decision_function(scaled_vector)[0]
        anomaly_score = normalize_isolation_score(raw_decision)
        anomaly_detected = bool(anomaly_score >= 0.50)

        # 4. XGBoost Fault Classifier Inference
        probabilities = self.fault_classifier.predict_proba(scaled_vector)[0]
        pred_class_idx = int(np.argmax(probabilities))
        fault_prob = float(probabilities[pred_class_idx])
        pred_fault_name = INV_LABEL_MAP.get(pred_class_idx, "UNCLASSIFIED")

        # Class probabilities map
        class_probs = {
            INV_LABEL_MAP.get(idx, f"CLASS_{idx}"): round(float(prob), 4)
            for idx, prob in enumerate(probabilities)
        }

        # If normal operating state with high certainty, ensure faultType is NORMAL
        if not anomaly_detected and pred_fault_name == "NORMAL":
            fault_type = "NORMAL"
        else:
            fault_type = pred_fault_name

        model_version = self.metadata.get("modelVersion", "1.0")

        # 5. Phase 7 SHAP Explainability
        explanation_result = explainability_service.explain(
            sensors=request.sensors,
            predicted_class_idx=pred_class_idx,
            fault_type=fault_type,
            fault_probability=fault_prob,
            model_version=model_version
        )

        # 6. Phase 7 RUL Estimation
        health_score_proxy = max(0.0, min(100.0, 100.0 * (1.0 - anomaly_score)))
        rul_result = rul_service.estimate_rul(
            health_score=health_score_proxy,
            anomaly_score=anomaly_score,
            fault_type=fault_type,
            fault_probability=fault_prob,
            model_version=model_version
        )

        # 7. Phase 7 Maintenance Intelligence
        op_state_proxy = "CRITICAL" if anomaly_score >= 0.65 else ("WARNING" if anomaly_score >= 0.35 else "NORMAL")
        maint_result = maintenance_service.determine_maintenance_intelligence(
            operating_state=op_state_proxy,
            health_score=health_score_proxy,
            anomaly_score=anomaly_score,
            fault_type=fault_type,
            fault_probability=fault_prob,
            estimated_rul_hours=rul_result["estimatedRulHours"]
        )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        return PredictResponse(
            machineId=request.machineId,
            anomalyDetected=anomaly_detected,
            anomalyScore=round(anomaly_score, 4),
            faultType=fault_type,
            faultProbability=round(fault_prob, 4),
            modelVersion=model_version,
            classProbabilities=class_probs,
            predictionTimestamp=request.timestamp or None,
            processingTimeMs=elapsed_ms,
            explanation=explanation_result,
            rul=rul_result,
            maintenance=maint_result
        )

    def explain(self, request: ExplainRequest) -> ExplainResponse:
        """Dedicated explanation handler for POST /api/v1/explain."""
        if not self.is_loaded:
            raise RuntimeError("ML models are not loaded.")

        # Run inference first to obtain predicted class
        feature_vector, _ = feature_extractor.extract_features_from_dict(request.sensors)
        feature_df = pd.DataFrame(feature_vector, columns=feature_extractor.feature_names)
        scaled_vector = self.scaler.transform(feature_df)
        
        probabilities = self.fault_classifier.predict_proba(scaled_vector)[0]
        pred_class_idx = int(np.argmax(probabilities))
        fault_prob = float(probabilities[pred_class_idx])
        pred_fault_name = INV_LABEL_MAP.get(pred_class_idx, "UNCLASSIFIED")

        raw_decision = self.isolation_forest.decision_function(scaled_vector)[0]
        anomaly_score = normalize_isolation_score(raw_decision)
        if anomaly_score < 0.50 and pred_fault_name == "NORMAL":
            fault_type = "NORMAL"
        else:
            fault_type = pred_fault_name

        model_version = self.metadata.get("modelVersion", "1.0")

        exp_data = explainability_service.explain(
            sensors=request.sensors,
            predicted_class_idx=pred_class_idx,
            fault_type=fault_type,
            fault_probability=fault_prob,
            model_version=model_version
        )

        return ExplainResponse(
            machineId=request.machineId,
            faultType=exp_data["faultType"],
            faultProbability=exp_data["faultProbability"],
            features=exp_data["features"],
            summary=exp_data["summary"],
            modelVersion=model_version
        )



model_service = ModelService()
