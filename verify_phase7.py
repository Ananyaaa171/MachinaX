"""
Phase 7 End-to-End Verification Script
Tests all intelligence endpoints, SHAP explainability, RUL estimation,
Maintenance Priority, Recommendations, and Digital Twin Integration.
"""
import time
import requests
import json
from datetime import datetime, timezone

ML_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:8080"

def wait_for_services():
    print("Waiting for ML Service (8000) and Backend (8080)...")
    ml_up = False
    backend_up = False
    for i in range(25):
        if not ml_up:
            try:
                r = requests.get(f"{ML_URL}/health", timeout=2)
                if r.status_code == 200:
                    ml_up = True
                    print(" ML Service is UP")
            except Exception:
                pass
        if not backend_up:
            try:
                r = requests.get(f"{BACKEND_URL}/actuator/health", timeout=2)
                if r.status_code == 200:
                    backend_up = True
                    print(" Backend Service is UP")
            except Exception:
                pass
        if ml_up and backend_up:
            break
        time.sleep(1)
    if not (ml_up and backend_up):
        raise RuntimeError("Services did not come up in time.")

def test_ml_service_phase7_endpoints():
    print("\n--- Testing ML Service Phase 7 Endpoints ---")
    
    # 1. POST /api/v1/explain
    explain_req = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 4.5,
            "CURRENT": 12.5,
            "TEMPERATURE": 65.0,
            "RPM": 2980.0
        }
    }
    r = requests.post(f"{ML_URL}/api/v1/explain", json=explain_req, timeout=5)
    print("Explain status:", r.status_code)
    assert r.status_code == 200, f"Explain failed: {r.text}"
    exp_data = r.json()
    print("Explain response:", json.dumps(exp_data, indent=2))
    assert "faultType" in exp_data
    assert "faultProbability" in exp_data
    assert "features" in exp_data
    assert len(exp_data["features"]) == 4
    assert "summary" in exp_data
    assert "modelVersion" in exp_data
    print(" POST /api/v1/explain verified")

    # 2. POST /api/v1/rul
    rul_req = {
        "machineId": 1,
        "healthScore": 65.0,
        "anomalyScore": 0.72,
        "faultProbability": 0.85,
        "recentTrend": "DEGRADING"
    }
    r = requests.post(f"{ML_URL}/api/v1/rul", json=rul_req, timeout=5)
    print("RUL status:", r.status_code)
    assert r.status_code == 200, f"RUL failed: {r.text}"
    rul_data = r.json()
    print("RUL response:", json.dumps(rul_data, indent=2))
    assert rul_data["estimatedRulHours"] > 0
    assert rul_data["unit"] == "HOURS"
    assert rul_data["confidence"] in ["LOW", "MEDIUM", "HIGH"]
    assert rul_data["degradationTrend"] in ["STABLE", "DEGRADING", "ACCELERATING"]
    print(" POST /api/v1/rul verified")

    # 3. POST /api/v1/maintenance
    maint_req = {
        "machineId": 1,
        "operatingState": "WARNING",
        "healthScore": 65.0,
        "anomalyScore": 0.72,
        "faultProbability": 0.85,
        "faultType": "BEARING_DEFECT",
        "estimatedRulHours": 450.0
    }
    r = requests.post(f"{ML_URL}/api/v1/maintenance", json=maint_req, timeout=5)
    print("Maintenance status:", r.status_code)
    assert r.status_code == 200, f"Maintenance failed: {r.text}"
    maint_data = r.json()
    print("Maintenance response:", json.dumps(maint_data, indent=2))
    assert maint_data["priority"] in ["P1_IMMEDIATE", "P2_SCHEDULE", "P3_MONITOR"]
    assert "bearing" in maint_data["recommendation"].lower()
    print(" POST /api/v1/maintenance verified")

def test_full_ingestion_and_digital_twin_lifecycle():
    print("\n--- Testing Ingestion -> Intelligence Persistence -> Digital Twin & REST APIs ---")
    
    now = datetime.now(timezone.utc).isoformat()
    healthy_batch = {
        "readings": [
            {"sensorId": 1, "value": 1.8, "recordedAt": now},
            {"sensorId": 2, "value": 12.4, "recordedAt": now},
            {"sensorId": 3, "value": 55.0, "recordedAt": now},
            {"sensorId": 4, "value": 2915.0, "recordedAt": now}
        ]
    }
    r = requests.post(f"{BACKEND_URL}/api/v1/machines/1/readings", json=healthy_batch, timeout=10)
    assert r.status_code == 201, f"Healthy ingestion failed: {r.text}"
    print("Healthy sensor batch ingested successfully")

    time.sleep(1)

    # Verify Digital Twin for Healthy State
    r = requests.get(f"{BACKEND_URL}/api/v1/machines/1/digital-twin", timeout=5)
    assert r.status_code == 200
    dt_healthy = r.json()
    print("Healthy Digital Twin:", json.dumps(dt_healthy, indent=2))
    assert dt_healthy["operatingState"] in ["NORMAL", "WATCH"]
    assert dt_healthy["rul"] is not None
    assert dt_healthy["rul"]["estimatedHours"] > 1000.0
    assert dt_healthy["maintenance"] is not None
    assert dt_healthy["maintenance"]["priority"] == "P3_MONITOR"
    assert dt_healthy["explanation"] is not None
    print(" Healthy Digital Twin verified")

    # Ingest FAULTY readings (BEARING_DEFECT with high vibration)
    now_f = datetime.now(timezone.utc).isoformat()
    faulty_batch = {
        "readings": [
            {"sensorId": 1, "value": 4.6, "recordedAt": now_f},
            {"sensorId": 2, "value": 13.5, "recordedAt": now_f},
            {"sensorId": 3, "value": 72.0, "recordedAt": now_f},
            {"sensorId": 4, "value": 2910.0, "recordedAt": now_f}
        ]
    }
    r = requests.post(f"{BACKEND_URL}/api/v1/machines/1/readings", json=faulty_batch, timeout=10)
    assert r.status_code == 201, f"Faulty ingestion failed: {r.text}"
    print("Faulty sensor batch ingested successfully")

    time.sleep(1)

    # Check REST APIs for Machine 1
    # 1. Latest Explanations
    r = requests.get(f"{BACKEND_URL}/api/v1/machines/1/explanations/latest", timeout=5)
    assert r.status_code == 200
    exp_res = r.json()
    print("GET explanations/latest:", json.dumps(exp_res, indent=2))
    assert len(exp_res["features"]) > 0
    assert "summary" in exp_res
    print(" GET /api/v1/machines/1/explanations/latest verified")

    # 2. Latest RUL
    r = requests.get(f"{BACKEND_URL}/api/v1/machines/1/rul/latest", timeout=5)
    assert r.status_code == 200
    rul_res = r.json()
    print("GET rul/latest:", json.dumps(rul_res, indent=2))
    assert rul_res["estimatedRulHours"] < dt_healthy["rul"]["estimatedHours"]
    print(" GET /api/v1/machines/1/rul/latest verified (RUL decreased under fault condition)")

    # 3. Latest Maintenance
    r = requests.get(f"{BACKEND_URL}/api/v1/machines/1/maintenance/latest", timeout=5)
    assert r.status_code == 200
    maint_res = r.json()
    print("GET maintenance/latest:", json.dumps(maint_res, indent=2))
    assert maint_res["priority"] in ["P1_IMMEDIATE", "P2_SCHEDULE"]
    print(" GET /api/v1/machines/1/maintenance/latest verified")

    # 4. Digital Twin with complete Phase 7 Intelligence
    r = requests.get(f"{BACKEND_URL}/api/v1/machines/1/digital-twin", timeout=5)
    assert r.status_code == 200
    dt_faulty = r.json()
    print("Faulty Digital Twin:", json.dumps(dt_faulty, indent=2))
    assert dt_faulty["rul"]["estimatedHours"] < dt_healthy["rul"]["estimatedHours"]
    assert dt_faulty["maintenance"]["priority"] in ["P1_IMMEDIATE", "P2_SCHEDULE"]
    assert "summary" in dt_faulty["explanation"]
    print(" Faulty Digital Twin Phase 7 intelligence verified")

def test_missing_entities_error_handling():
    print("\n--- Testing 404 Error Handling for non-existent machine ---")
    r1 = requests.get(f"{BACKEND_URL}/api/v1/machines/99999/explanations/latest", timeout=5)
    assert r1.status_code == 404
    r2 = requests.get(f"{BACKEND_URL}/api/v1/machines/99999/rul/latest", timeout=5)
    assert r2.status_code == 404
    r3 = requests.get(f"{BACKEND_URL}/api/v1/machines/99999/maintenance/latest", timeout=5)
    assert r3.status_code == 404
    print(" 404 handled cleanly without 500 internal errors")

if __name__ == "__main__":
    wait_for_services()
    test_ml_service_phase7_endpoints()
    test_full_ingestion_and_digital_twin_lifecycle()
    test_missing_entities_error_handling()
    print("\n ALL PHASE 7 VERIFICATIONS PASSED!")
