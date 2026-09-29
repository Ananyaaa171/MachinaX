"""
Pydantic schemas for SHAP explainability requests and responses.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class FeatureContributionDto(BaseModel):
    feature: str
    value: float
    shapValue: float
    impact: str


class ExplainRequest(BaseModel):
    machineId: int = Field(..., gt=0)
    sensors: Dict[str, float] = Field(...)

    @field_validator("sensors")
    @classmethod
    def validate_sensors(cls, v: Dict[str, float]) -> Dict[str, float]:
        if not v:
            raise ValueError("Sensors dictionary must not be empty")
        normalized = {k.strip().upper(): val for k, val in v.items()}
        required = ["VIBRATION", "CURRENT", "TEMPERATURE", "RPM"]
        missing = [req for req in required if req not in normalized]
        if missing:
            raise ValueError(f"Missing required sensor(s): {', '.join(missing)}")
        return normalized


class ExplainResponse(BaseModel):
    machineId: Optional[int] = None
    faultType: str
    faultProbability: float
    features: List[FeatureContributionDto]
    summary: str
    modelVersion: str = "1.0"
