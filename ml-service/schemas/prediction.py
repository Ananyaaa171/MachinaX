from datetime import datetime, timezone
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    machineId: int = Field(..., description="Unique machine identifier", gt=0)
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of sensor reading batch")
    sensors: Dict[str, float] = Field(..., description="Key-value mapping of sensor type to current float reading")

    @field_validator("sensors")
    @classmethod
    def validate_sensors(cls, v: Dict[str, float]) -> Dict[str, float]:
        if not v:
            raise ValueError("Sensors dictionary must not be empty")
        
        # Normalize keys to uppercase
        normalized = {k.strip().upper(): val for k, val in v.items()}
        
        required = ["VIBRATION", "CURRENT", "TEMPERATURE", "RPM"]
        missing = [req for req in required if req not in normalized]
        if missing:
            raise ValueError(f"Missing required sensor(s): {', '.join(missing)}")
        
        for k, val in normalized.items():
            if val is None:
                raise ValueError(f"Sensor value for {k} cannot be null")
            if not isinstance(val, (int, float)):
                raise ValueError(f"Sensor value for {k} must be a number, got {type(val)}")
            if val < 0:
                raise ValueError(f"Sensor value for {k} cannot be negative: {val}")
        
        return normalized


class PredictResponse(BaseModel):
    machineId: int
    anomalyDetected: bool
    anomalyScore: float = Field(..., ge=0.0, le=1.0, description="Normalized anomaly score between 0.0 and 1.0")
    faultType: str = Field(..., description="Predicted fault mode: NORMAL, BROKEN_ROTOR_BAR, STATOR_SHORT, BEARING_DEFECT, ECCENTRICITY, UNCLASSIFIED")
    faultProbability: float = Field(..., ge=0.0, le=1.0, description="Confidence / probability score of predicted fault")
    modelVersion: str = Field(default="1.0", description="Model version tag")
    classProbabilities: Optional[Dict[str, float]] = Field(default=None, description="Detailed probabilities across all fault classes")
    predictionTimestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processingTimeMs: Optional[int] = Field(default=None, description="Inference latency in milliseconds")
    
    # Phase 7 Intelligence Layer
    explanation: Optional[Dict[str, Any]] = Field(default=None, description="SHAP feature attribution and human-readable explanation")
    rul: Optional[Dict[str, Any]] = Field(default=None, description="Remaining useful life estimation and degradation trend")
    maintenance: Optional[Dict[str, Any]] = Field(default=None, description="Maintenance priority and condition-based recommendations")




class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    modelsLoaded: bool
    models: Dict[str, Any]
