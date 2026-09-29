"""
Pydantic data models for the MACHINA-X Sensor Simulator.
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class FaultMode(str, Enum):
    HEALTHY = "HEALTHY"
    BROKEN_ROTOR_BAR = "BROKEN_ROTOR_BAR"
    STATOR_SHORT = "STATOR_SHORT"
    BEARING_DEFECT = "BEARING_DEFECT"
    ECCENTRICITY = "ECCENTRICITY"


class ReadingQuality(str, Enum):
    GOOD = "GOOD"
    DEGRADED = "DEGRADED"
    MISSING = "MISSING"


class SensorReading(BaseModel):
    sensorType: str = Field(..., description="Sensor type name: VIBRATION, CURRENT, TEMPERATURE, RPM")
    value: float = Field(..., description="Simulated sensor reading value")
    unit: str = Field(..., description="Measurement unit (mm/s, A, °C, rpm)")
    quality: str = Field(default="GOOD", description="Reading quality assessment")
    source: str = Field(default="SIMULATED", description="Data source indicator")
    recordedAt: str = Field(..., description="ISO-8601 UTC timestamp")


class SensorBatch(BaseModel):
    machineId: int = Field(..., description="ID of the simulated machine")
    mode: FaultMode = Field(..., description="Simulated operating mode / fault profile")
    readings: List[SensorReading] = Field(..., description="List of sensor measurements")
    timestamp: str = Field(..., description="Batch creation timestamp in UTC")


class SetModeRequest(BaseModel):
    mode: FaultMode = Field(..., description="Target fault mode to switch to")


class SetModeResponse(BaseModel):
    machineId: int
    mode: FaultMode
    status: str
    message: str


class SimulatorStatusResponse(BaseModel):
    machineId: int
    currentMode: FaultMode
    targetMode: FaultMode
    transitionProgress: float
    isRunning: bool
    simulationIntervalSeconds: float
    backendUrl: str
    transmitToBackend: bool
    totalBatchesGenerated: int
    totalBatchesTransmitted: int
    totalTransmissionFailures: int
    lastGeneratedBatch: Optional[SensorBatch] = None
    lastTransmissionStatus: Optional[str] = None
