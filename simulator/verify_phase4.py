import httpx
import time
from motor_simulator import MotorSimulator
from models import FaultMode

def run_verification():
    print("=== PHASE 4 LIVE VERIFICATION ===")
    backend_url = "http://localhost:8080"
    client = httpx.Client(base_url=backend_url, timeout=5.0)

    # 1. Health check
    health = client.get("/actuator/health")
    print(f"1. Backend Health: {health.status_code} -> {health.json()}")

    # 2. Get initial readings count
    initial_resp = client.get("/api/v1/machines/1/readings?size=1")
    initial_total = initial_resp.json()["totalElements"]
    print(f"2. Initial stored readings in DB: {initial_total}")

    # 3. Test multi-fault mode continuous generation & ingestion
    simulator = MotorSimulator(machine_id=1, initial_mode=FaultMode.HEALTHY)
    modes = [
        FaultMode.HEALTHY,
        FaultMode.BEARING_DEFECT,
        FaultMode.STATOR_SHORT,
        FaultMode.BROKEN_ROTOR_BAR,
        FaultMode.ECCENTRICITY
    ]

    total_ingested = 0
    for mode in modes:
        simulator.set_mode(mode)
        # Advance multiple steps
        for step_idx in range(3):
            batch = simulator.step(dt=1.0)
            res = client.post("/api/v1/machines/1/readings", json=batch.model_dump())
            assert res.status_code == 201, f"Failed for {mode}: {res.text}"
            data = res.json()
            assert data["accepted"] == 4
            assert data["rejected"] == 0
            total_ingested += data["accepted"]
        print(f"   [SUCCESS] Ingested 3 batches (12 readings) for mode: {mode.value}")

    print(f"3. Ingested total {total_ingested} simulated readings across all 5 fault profiles.")

    # 4. Verify DB count increased
    final_resp = client.get("/api/v1/machines/1/readings?size=1")
    final_total = final_resp.json()["totalElements"]
    print(f"4. Updated total stored readings in DB: {final_total} (difference = +{final_total - initial_total})")
    assert final_total == initial_total + total_ingested

    # 5. Verify Trend API
    trend_resp = client.get("/api/v1/machines/1/sensors/1/trend?limit=15")
    assert trend_resp.status_code == 200
    trend_points = trend_resp.json()
    print(f"5. Retrieved {len(trend_points)} trend points for Vibration Sensor (Sensor 1)")
    for i, pt in enumerate(trend_points[-5:]):
        print(f"   Point {i+1}: timestamp={pt['timestamp']}, value={pt['value']} {pt['unit']}")

    print("\n=== ALL PHASE 4 SUCCESS CRITERIA MET! ===")

if __name__ == "__main__":
    run_verification()
