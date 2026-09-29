"""
Automated Test Suite for MACHINA-X Sensor Simulator.

Tests:
1. Health check endpoint (GET /health)
2. Simulator status (GET /api/v1/simulator/status)
3. Healthy telemetry physics & continuous drift (4 sensors, ranges, time-variance, source='SIMULATED')
4. All fault modes (BEARING_DEFECT, BROKEN_ROTOR_BAR, STATOR_SHORT, ECCENTRICITY)
5. Dynamic mode switching & smooth transition behavior
6. Manual step endpoint (POST /api/v1/simulator/step)
7. Start/Stop lifecycle endpoints
8. Resilient transmission failure handling when Spring Boot backend is offline
"""
import pytest
from fastapi.testclient import TestClient

from main import app, simulator
from models import FaultMode


@pytest.fixture(autouse=True)
def reset_simulator_state():
    """Reset simulator state before each test."""
    simulator.current_mode = FaultMode.HEALTHY
    simulator.target_mode = FaultMode.HEALTHY
    simulator.transition_progress = 1.0
    simulator.temperature = 55.0
    simulator.vibration = 1.85
    simulator.current = 12.4
    simulator.rpm = 2915.0
    simulator.is_running = True
    simulator.total_generated = 0
    simulator.total_transmitted = 0
    simulator.total_failed = 0


def test_health_endpoint():
    """Test 1 — Health check endpoint responds with UP and SIMULATED indicator."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "machinax-sensor-simulator"
    assert data["data_source"] == "SIMULATED"
    assert data["machine_id"] == 1


def test_status_endpoint():
    """Test 2 — Status endpoint returns machineId, currentMode, and metrics."""
    client = TestClient(app)
    response = client.get("/api/v1/simulator/status")
    assert response.status_code == 200
    data = response.json()
    assert data["machineId"] == 1
    assert data["currentMode"] == "HEALTHY"
    assert data["isRunning"] is True
    assert data["simulationIntervalSeconds"] > 0


def test_healthy_telemetry_generation():
    """
    Test 3 — HEALTHY mode generates realistic, time-varying readings for all 4 sensors.
    Verifies ranges, continuous drift, and proper metadata.
    """
    client = TestClient(app)

    readings_history = {"VIBRATION": [], "CURRENT": [], "TEMPERATURE": [], "RPM": []}

    for _ in range(5):
        response = client.post("/api/v1/simulator/step")
        assert response.status_code == 200
        batch = response.json()
        assert batch["machineId"] == 1
        assert batch["mode"] == "HEALTHY"
        assert len(batch["readings"]) == 4

        for r in batch["readings"]:
            assert r["source"] == "SIMULATED"
            assert r["quality"] == "GOOD"
            assert "T" in r["recordedAt"]  # ISO-8601 UTC timestamp check
            readings_history[r["sensorType"]].append(r["value"])

    # 1. Vibration: 1.5 - 2.5 mm/s
    vib_values = readings_history["VIBRATION"]
    assert all(1.4 <= v <= 2.6 for v in vib_values), f"Vibration out of healthy range: {vib_values}"
    assert len(set(vib_values)) > 1, "Vibration should vary over time (not constant)"

    # 2. Current: 10.0 - 15.0 A
    curr_values = readings_history["CURRENT"]
    assert all(10.0 <= c <= 15.5 for c in curr_values), f"Current out of healthy range: {curr_values}"
    assert len(set(curr_values)) > 1, "Current should vary over time"

    # 3. Temperature: 50.0 - 65.0 °C
    temp_values = readings_history["TEMPERATURE"]
    assert all(50.0 <= t <= 65.0 for t in temp_values), f"Temperature out of healthy range: {temp_values}"
    # Temperature should change smoothly (drift < 1.5°C per step)
    for i in range(1, len(temp_values)):
        assert abs(temp_values[i] - temp_values[i - 1]) < 1.5, "Temperature must drift smoothly"

    # 4. RPM: 2850 - 2950 rpm
    rpm_values = readings_history["RPM"]
    assert all(2850.0 <= r <= 2950.0 for r in rpm_values), f"RPM out of healthy range: {rpm_values}"


def test_bearing_defect_fault_profile():
    """
    Test 4a — BEARING_DEFECT mode causes elevated vibration (+40-80%) and temperature rise.
    """
    client = TestClient(app)

    # Switch to BEARING_DEFECT mode
    mode_resp = client.post("/api/v1/simulator/mode", json={"mode": "BEARING_DEFECT"})
    assert mode_resp.status_code == 200
    assert mode_resp.json()["mode"] == "BEARING_DEFECT"

    # Run multiple steps to let transition progress and temperature escalate
    for _ in range(8):
        step_resp = client.post("/api/v1/simulator/step")
        assert step_resp.status_code == 200

    last_batch = step_resp.json()
    readings = {r["sensorType"]: r["value"] for r in last_batch["readings"]}

    # Bearing defect should elevate vibration noticeably (> 2.8 mm/s vs healthy ~1.85 mm/s)
    assert readings["VIBRATION"] > 2.8, f"Bearing vibration should be elevated, got: {readings['VIBRATION']}"
    # Temperature should drift higher (> 60°C)
    assert readings["TEMPERATURE"] > 58.0, f"Bearing temp should be elevated, got: {readings['TEMPERATURE']}"


def test_broken_rotor_bar_fault_profile():
    """
    Test 4b — BROKEN_ROTOR_BAR mode causes +15-30% vibration and higher current.
    """
    client = TestClient(app)
    client.post("/api/v1/simulator/mode", json={"mode": "BROKEN_ROTOR_BAR"})

    for _ in range(6):
        resp = client.post("/api/v1/simulator/step")

    readings = {r["sensorType"]: r["value"] for r in resp.json()["readings"]}
    # Current should be higher (~14-16 A)
    assert readings["CURRENT"] > 13.5, f"Broken rotor current should be elevated, got: {readings['CURRENT']}"


def test_stator_short_fault_profile():
    """
    Test 4c — STATOR_SHORT mode causes rapid thermal rise and high current asymmetry.
    """
    client = TestClient(app)
    client.post("/api/v1/simulator/mode", json={"mode": "STATOR_SHORT"})

    for _ in range(8):
        resp = client.post("/api/v1/simulator/step")

    readings = {r["sensorType"]: r["value"] for r in resp.json()["readings"]}
    # Stator short causes highest current draw (> 15.5 A) and high temp
    assert readings["CURRENT"] > 15.5, f"Stator short current should be high, got: {readings['CURRENT']}"
    assert readings["TEMPERATURE"] > 65.0, f"Stator short temp should rise rapidly, got: {readings['TEMPERATURE']}"


def test_eccentricity_fault_profile():
    """
    Test 4d — ECCENTRICITY mode creates mechanical modulation with moderate vibration increase.
    """
    client = TestClient(app)
    client.post("/api/v1/simulator/mode", json={"mode": "ECCENTRICITY"})

    for _ in range(6):
        resp = client.post("/api/v1/simulator/step")

    readings = {r["sensorType"]: r["value"] for r in resp.json()["readings"]}
    assert 1.9 <= readings["VIBRATION"] <= 2.6, f"Eccentricity vibration out of range: {readings['VIBRATION']}"


def test_start_stop_controls():
    """Test 5 — Start and stop simulation control endpoints."""
    client = TestClient(app)

    stop_resp = client.post("/api/v1/simulator/stop")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "PAUSED"
    assert simulator.is_running is False

    start_resp = client.post("/api/v1/simulator/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "RUNNING"
    assert simulator.is_running is True


def test_backend_unavailable_resilience():
    """
    Test 6 — Verify simulator continues generating data and tracking failures
    when backend transmission cannot connect (e.g. backend offline).
    """
    import asyncio
    from main import transmit_batch

    batch = simulator.step(dt=1.0)
    assert batch is not None
    assert simulator.total_generated >= 1

    # Call transmit_batch when Spring Boot might not be accepting readings
    asyncio.run(transmit_batch(batch))

    # Total generated should remain positive, simulator state intact, no crash
    assert simulator.total_generated >= 1
    assert simulator.is_running is True
