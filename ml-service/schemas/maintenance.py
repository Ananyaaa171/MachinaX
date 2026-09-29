"""
Pydantic schemas for maintenance intelligence requests and responses.
"""
from typing import Optional
from pydantic import BaseModel, Field


class MaintenanceRequest(BaseModel):
    machineId: int = Field(..., gt=0)
    operatingState: str = Field(default="NORMAL")
    healthScore: float = Field(default=100.0, ge=0.0, le=100.0)
    anomalyScore: float = Field(default=0.0, ge=0.0, le=1.0)
    faultType: str = Field(default="NORMAL")
    faultProbability: float = Field(default=0.0, ge=0.0, le=1.0)
    estimatedRulHours: float = Field(default=5000.0, ge=0.0)


class MaintenanceResponse(BaseModel):
    machineId: Optional[int] = None
    priority: str
    faultType: str
    recommendation: str
    disclaimer: str
