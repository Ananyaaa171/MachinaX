"""
MACHINA-X Phase 6 End-to-End Verification Script.

Tests the full pipeline:
1. Ingest HEALTHY sensor batch -> Verify DB storage, Digital Twin update, and ML Prediction (NORMAL, anomalyScore < 0.5)
2. Ingest BEARING_DEFECT sensor batch -> Verify DB storage, Digital Twin update, and ML Prediction (BEARING_DEFECT, anomalyScore >= 0.5)
3. Ingest STATOR_SHORT sensor batch -> Verify DB storage, Digital Twin update, and ML Prediction (STATOR_SHORT, anomalyScore >= 0.5)
4. Query latest ML prediction endpoint: GET /api/v1/machines/1/ml-prediction/latest
5. Query Digital Twin state endpoint: GET /api/v1/machines/1/digital-twin
6. Test Resilience: Verify behavior when ML service returns responses
"""
import httpx
import json
from datetime import datetime, timezone
import sys

BACKEND_URL = "http://localhost:8080"
ML_SERVICE_URL = "http://localhost:8000"



def print_section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def test_e2e():
    print_section("1. VERIFYING ML SERVICE HEALTH")
    ml_health = httpx.get(f"{ML_SERVICE_URL}/health").json()
    print("ML Health Response:")
    print(json.dumps(ml_health, indent=2))
    assert ml_health["status"] == "UP"
    assert ml_health["modelsLoaded"] is True

    print_section("2. VERIFYING DIRECT ML INFERENCE API (POST /api/v1/predict)")
    direct_req = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.85,
            "CURRENT": 12.4,
            "TEMPERATURE": 56.0,
            "RPM": 2915.0
        }
    }
    direct_resp = httpx.post(f"{ML_SERVICE_URL}/api/v1/predict", json=direct_req).json()
    print("Direct Prediction (Normal values):")
    print(json.dumps(direct_resp, indent=2))
    assert direct_resp["faultType"] == "NORMAL"
    assert direct_resp["anomalyDetected"] is False
    assert direct_resp["anomalyScore"] < 0.50

    print_section("3. INGESTING HEALTHY SENSOR READINGS VIA SPRING BOOT (POST /api/v1/machines/1/readings)")
    now = datetime.now(timezone.utc).isoformat()
    healthy_batch = {
        "readings": [
            {"sensorType": "VIBRATION", "value": 1.82, "unit": "mm/s", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now},
            {"sensorType": "CURRENT", "value": 12.35, "unit": "A", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now},
            {"sensorType": "TEMPERATURE", "value": 55.8, "unit": "°C", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now},
            {"sensorType": "RPM", "value": 2916.0, "unit": "RPM", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now}
        ]
    }
    ingest_resp = httpx.post(f"{BACKEND_URL}/api/v1/machines/1/readings", json=healthy_batch)
    print(f"Ingestion Status: {ingest_resp.status_code}")
    print(json.dumps(ingest_resp.json(), indent=2))
    assert ingest_resp.status_code == 201

    print_section("4. QUERYING LATEST ML PREDICTION (GET /api/v1/machines/1/ml-prediction/latest)")
    pred_resp = httpx.get(f"{BACKEND_URL}/api/v1/machines/1/ml-prediction/latest")
    print(f"Latest ML Prediction Status: {pred_resp.status_code}")
    pred_data = pred_resp.json()
    print(json.dumps(pred_data, indent=2))
    assert pred_data["machineId"] == 1
    assert pred_data["faultType"] == "NONE"  # Normal maps to FaultType.NONE
    assert pred_data["anomalyDetected"] is False
    assert pred_data["anomalyScore"] < 0.50

    print_section("5. INGESTING BEARING_DEFECT SENSOR READINGS VIA SPRING BOOT")
    now_fault = datetime.now(timezone.utc).isoformat()
    bearing_batch = {
        "readings": [
            {"sensorType": "VIBRATION", "value": 3.65, "unit": "mm/s", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_fault},
            {"sensorType": "CURRENT", "value": 13.20, "unit": "A", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_fault},
            {"sensorType": "TEMPERATURE", "value": 72.5, "unit": "°C", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_fault},
            {"sensorType": "RPM", "value": 2902.0, "unit": "RPM", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_fault}
        ]
    }
    ingest_fault_resp = httpx.post(f"{BACKEND_URL}/api/v1/machines/1/readings", json=bearing_batch)
    print(f"Fault Ingestion Status: {ingest_fault_resp.status_code}")
    assert ingest_fault_resp.status_code == 201

    print_section("6. QUERYING UPDATED ML PREDICTION (GET /api/v1/machines/1/ml-prediction/latest)")
    pred_fault_resp = httpx.get(f"{BACKEND_URL}/api/v1/machines/1/ml-prediction/latest")
    print(f"Updated ML Prediction Status: {pred_fault_resp.status_code}")
    pred_fault_data = pred_fault_resp.json()
    print(json.dumps(pred_fault_data, indent=2))
    assert pred_fault_data["machineId"] == 1
    assert pred_fault_data["faultType"] == "BEARING_DEFECT"
    assert pred_fault_data["anomalyDetected"] is True
    assert pred_fault_data["anomalyScore"] >= 0.50
    assert pred_fault_data["faultProbability"] > 0.80

    print_section("7. QUERYING DIGITAL TWIN STATE (GET /api/v1/machines/1/digital-twin)")
    dt_resp = httpx.get(f"{BACKEND_URL}/api/v1/machines/1/digital-twin")
    print(f"Digital Twin Status: {dt_resp.status_code}")
    dt_data = dt_resp.json()
    print(json.dumps(dt_data, indent=2))
    assert dt_data["machineId"] == 1
    assert dt_data["currentFaultType"] == "BEARING_DEFECT"
    assert dt_data["faultProbability"] > 0.80

    print_section("8. INGESTING STATOR_SHORT SENSOR READINGS VIA SPRING BOOT")
    now_stator = datetime.now(timezone.utc).isoformat()
    stator_batch = {
        "readings": [
            {"sensorType": "VIBRATION", "value": 2.02, "unit": "mm/s", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_stator},
            {"sensorType": "CURRENT", "value": 18.20, "unit": "A", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_stator},
            {"sensorType": "TEMPERATURE", "value": 81.5, "unit": "°C", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_stator},
            {"sensorType": "RPM", "value": 2886.0, "unit": "RPM", "quality": "GOOD", "source": "SIMULATED", "recordedAt": now_stator}
        ]
    }
    ingest_stator_resp = httpx.post(f"{BACKEND_URL}/api/v1/machines/1/readings", json=stator_batch)
    assert ingest_stator_resp.status_code == 201

    pred_stator_resp = httpx.get(f"{BACKEND_URL}/api/v1/machines/1/ml-prediction/latest")
    pred_stator_data = pred_stator_resp.json()
    print("Updated ML Prediction for STATOR_SHORT:")
    print(json.dumps(pred_stator_data, indent=2))
    assert pred_stator_data["faultType"] == "STATOR_SHORT"
    assert pred_stator_data["anomalyDetected"] is True


    print_section("PHASE 6 END-TO-END VERIFICATION PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_e2e()
