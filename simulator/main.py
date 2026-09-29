"""
MACHINA-X Sensor Simulation Service — FastAPI Application

Simulates real-time telemetry for a 3-Phase Induction Motor and transmits
data batches to the Spring Boot backend.

DATA SOURCE: SIMULATED (clearly labeled on all generated telemetry).
"""
import asyncio
from contextlib import asynccontextmanager
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn

from config import settings
from models import (
    FaultMode,
    SensorBatch,
    SetModeRequest,
    SetModeResponse,
    SimulatorStatusResponse,
)
from motor_simulator import MotorSimulator

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("machinax.simulator")

# Instantiate singleton simulator engine
initial_fault_mode = FaultMode(settings.default_mode) if settings.default_mode in FaultMode.__members__ else FaultMode.HEALTHY
simulator = MotorSimulator(machine_id=settings.machine_id, initial_mode=initial_fault_mode)

# Background task reference
simulation_task: Optional[asyncio.Task] = None


async def transmit_batch(batch: SensorBatch) -> None:
    """
    Attempt to transmit a generated sensor batch to the Spring Boot backend.
    Handles network and endpoint availability errors gracefully without stopping simulation.
    """
    if not settings.transmit_to_backend:
        return

    url = f"{settings.backend_url}/api/v1/machines/{batch.machineId}/readings"
    payload = batch.model_dump()

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code in (200, 201, 202):
                simulator.total_transmitted += 1
                simulator.last_transmission_status = f"SUCCESS (HTTP {response.status_code})"
                logger.debug(f"Transmitted batch {simulator.total_generated} to {url}")
            else:
                simulator.total_failed += 1
                simulator.last_transmission_status = f"Backend returned HTTP {response.status_code} at {url}"
                logger.debug(f"Backend returned HTTP {response.status_code} at {url}")
    except httpx.ConnectError:
        simulator.total_failed += 1
        simulator.last_transmission_status = f"Backend connection failed at {settings.backend_url} (Ingestion offline - Data generation continuing)"
        logger.debug(f"Backend offline at {settings.backend_url}. Simulation proceeding normally.")
    except Exception as exc:
        simulator.total_failed += 1
        simulator.last_transmission_status = f"Transmission error: {type(exc).__name__} ({str(exc)})"
        logger.debug(f"Transmission error: {exc}")


async def simulation_loop():
    """Continuous background loop generating readings every interval seconds."""
    logger.info(
        f"Starting simulation loop for Machine ID {simulator.machine_id} "
        f"(Interval: {settings.simulation_interval_seconds}s, Mode: {simulator.current_mode})"
    )
    while True:
        try:
            if simulator.is_running:
                batch = simulator.step(dt=settings.simulation_interval_seconds)
                logger.debug(
                    f"Generated Batch #{simulator.total_generated} | Mode: {batch.mode} | "
                    f"Vib: {batch.readings[0].value} mm/s | Curr: {batch.readings[1].value} A | "
                    f"Temp: {batch.readings[2].value} °C | RPM: {batch.readings[3].value}"
                )
                await transmit_batch(batch)
        except Exception as exc:
            logger.error(f"Unexpected error in simulation loop: {exc}", exc_info=True)

        await asyncio.sleep(settings.simulation_interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan managing background simulation task lifecycle."""
    global simulation_task
    logger.info("MACHINA-X Simulator starting up...")
    simulation_task = asyncio.create_task(simulation_loop())
    yield
    logger.info("MACHINA-X Simulator shutting down...")
    if simulation_task:
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="MACHINA-X Sensor Simulator",
    description="Physics-based Sensor Simulation Service for MACHINA-X Digital Twin (NOT real IoT data)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Standard health check endpoint."""
    return {
        "status": "UP",
        "service": "machinax-sensor-simulator",
        "version": "1.0.0",
        "data_source": "SIMULATED",
        "machine_id": simulator.machine_id,
        "current_mode": simulator.current_mode.value,
        "is_running": simulator.is_running
    }


@app.get("/api/v1/simulator/status", response_model=SimulatorStatusResponse)
def get_status():
    """Retrieve full simulation engine status, mode, and telemetry metrics."""
    return SimulatorStatusResponse(
        machineId=simulator.machine_id,
        currentMode=simulator.current_mode,
        targetMode=simulator.target_mode,
        transitionProgress=round(simulator.transition_progress, 2),
        isRunning=simulator.is_running,
        simulationIntervalSeconds=settings.simulation_interval_seconds,
        backendUrl=settings.backend_url,
        transmitToBackend=settings.transmit_to_backend,
        totalBatchesGenerated=simulator.total_generated,
        totalBatchesTransmitted=simulator.total_transmitted,
        totalTransmissionFailures=simulator.total_failed,
        lastGeneratedBatch=simulator.last_batch,
        lastTransmissionStatus=simulator.last_transmission_status
    )


@app.post("/api/v1/simulator/mode", response_model=SetModeResponse)
def set_mode(request: SetModeRequest):
    """Switch the simulated operating/fault mode with smooth dynamic transitions."""
    simulator.set_mode(request.mode)
    logger.info(f"Switched simulation mode to {request.mode.value} for Machine {simulator.machine_id}")
    return SetModeResponse(
        machineId=simulator.machine_id,
        mode=request.mode,
        status="TRANSITIONING" if simulator.transition_progress < 1.0 else "ACTIVE",
        message=f"Simulation mode transitioning towards {request.mode.value}"
    )


@app.post("/api/v1/simulator/start")
def start_simulation():
    """Start or resume the continuous sensor simulation loop."""
    simulator.is_running = True
    logger.info(f"Resumed simulation for Machine {simulator.machine_id}")
    return {"status": "RUNNING", "machineId": simulator.machine_id, "message": "Simulation active"}


@app.post("/api/v1/simulator/stop")
def stop_simulation():
    """Pause the continuous sensor simulation loop."""
    simulator.is_running = False
    logger.info(f"Paused simulation for Machine {simulator.machine_id}")
    return {"status": "PAUSED", "machineId": simulator.machine_id, "message": "Simulation paused"}


@app.post("/api/v1/simulator/step", response_model=SensorBatch)
def manual_step():
    """Trigger a single manual simulation step and return the generated batch immediately."""
    batch = simulator.step(dt=settings.simulation_interval_seconds)
    return batch


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.simulator_host,
        port=settings.simulator_port,
        reload=False
    )
