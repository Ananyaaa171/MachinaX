"""
Pydantic schemas for Remaining Useful Life (RUL) estimation requests and responses.
"""
from typing import Optional
from pydantic import BaseModel, Field


class RULRequest(BaseModel):
    machineId: int = Field(..., gt=0)
    healthScore: float = Field(default=100.0, ge=0.0, le=100.0)
    anomalyScore: float = Field(default=0.0, ge=0.0, le=1.0)
    faultType: Optional[str] = Field(default="NORMAL")
    faultProbability: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)


class RULResponse(BaseModel):
    machineId: Optional[int] = None
    estimatedRulHours: float
    unit: str = "HOURS"
    confidence: str
    confidenceType: str = "baseline confidence"
    degradationTrend: str
    modelVersion: str = "1.0"
