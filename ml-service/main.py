"""
MACHINA-X ML Service
FastAPI application for machine learning inference.

Services:
- Anomaly detection (Isolation Forest)
- Fault classification (XGBoost)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from schemas.prediction import PredictRequest, PredictResponse, HealthResponse
from schemas.explainability import ExplainRequest, ExplainResponse
from schemas.rul import RULRequest, RULResponse
from schemas.maintenance import MaintenanceRequest, MaintenanceResponse
from services.model_service import model_service
from services.rul_service import rul_service
from services.maintenance_service import maintenance_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Attempt loading model artifacts on startup."""
    model_service.load_models()
    yield


app = FastAPI(
    title="MACHINA-X ML Service",
    description="Machine Learning inference service for MACHINA-X Digital Twin Predictive Maintenance (Anomaly Detection, Fault Classification, SHAP Explainability, RUL & Maintenance Intelligence)",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint indicating service health and model status."""
    return model_service.get_health()


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


@app.post(
    "/api/v1/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Run full ML inference pipeline (Anomaly, Fault, SHAP, RUL & Maintenance)"
)
def predict(request: PredictRequest):
    """
    Takes latest machine sensor readings, extracts deterministic features,
    and returns Isolation Forest anomaly detection + XGBoost fault classification +
    SHAP explainability + RUL estimation + Maintenance intelligence.
    """
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML models are not loaded. Please ensure model training artifacts are present."
        )

    try:
        response = model_service.predict(request)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction error: {str(ex)}")


@app.post(
    "/api/v1/explain",
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate SHAP feature attribution and natural language explanation"
)
def explain_prediction(request: ExplainRequest):
    """
    Computes SHAP TreeExplainer feature attributions and generates human-readable
    explanation summary for the given sensor reading.
    """
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML models are not loaded. Please ensure model training artifacts are present."
        )

    try:
        return model_service.explain(request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Explainability error: {str(ex)}")


@app.post(
    "/api/v1/rul",
    response_model=RULResponse,
    status_code=status.HTTP_200_OK,
    summary="Estimate Remaining Useful Life (RUL) in operating hours"
)
def estimate_rul(request: RULRequest):
    """
    Estimates deterministic baseline Remaining Useful Life (in hours),
    confidence indicator, and degradation trend based on health and fault indicators.
    """
    try:
        res = rul_service.estimate_rul(
            health_score=request.healthScore,
            anomaly_score=request.anomalyScore,
            fault_type=request.faultType or "NORMAL",
            fault_probability=request.faultProbability or 0.0
        )
        return RULResponse(machineId=request.machineId, **res)
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"RUL error: {str(ex)}")


@app.post(
    "/api/v1/maintenance",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Determine maintenance priority and actionable recommendation"
)
def determine_maintenance(request: MaintenanceRequest):
    """
    Calculates maintenance priority (P1_IMMEDIATE, P2_SCHEDULE, P3_MONITOR)
    and condition-based recommendation for the given machine state.
    """
    try:
        res = maintenance_service.determine_maintenance_intelligence(
            operating_state=request.operatingState,
            health_score=request.healthScore,
            anomaly_score=request.anomalyScore,
            fault_type=request.faultType,
            fault_probability=request.faultProbability,
            estimated_rul_hours=request.estimatedRulHours
        )
        return MaintenanceResponse(machineId=request.machineId, **res)
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Maintenance error: {str(ex)}")



if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
