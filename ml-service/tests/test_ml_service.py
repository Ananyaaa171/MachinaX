"""
Unit and Integration Tests for MACHINA-X ML Service.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from services.model_service import model_service
from training.train_models import train_and_save_models


@pytest.fixture(scope="session", autouse=True)
def setup_models():
    """Ensure models are trained and loaded before running tests."""
    train_and_save_models()
    model_service.load_models()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    """Test 1: /health works."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "machinax-ml-service"
    assert data["modelsLoaded"] is True
    assert "models" in data


def test_models_load_correctly():
    """Test 9: Models load correctly."""
    assert model_service.is_loaded is True
    assert model_service.isolation_forest is not None
    assert model_service.fault_classifier is not None
    assert model_service.scaler is not None


def test_valid_prediction_request(client):
    """Test 2: Valid prediction request works."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.85,
            "CURRENT": 12.4,
            "TEMPERATURE": 56.0,
            "RPM": 2915
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["machineId"] == 1
    assert "anomalyDetected" in data
    assert "anomalyScore" in data
    assert "faultType" in data
    assert "faultProbability" in data
    assert data["modelVersion"] == "1.0"


def test_normal_sensor_values_produce_valid_prediction(client):
    """Test 7: Normal sensor values produce a normal prediction."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.82,
            "CURRENT": 12.35,
            "TEMPERATURE": 55.8,
            "RPM": 2916
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["anomalyDetected"] is False
    assert data["anomalyScore"] < 0.50
    assert data["faultType"] == "NORMAL"
    assert data["faultProbability"] > 0.50


def test_bearing_defect_sensor_values_produce_fault_prediction(client):
    """Test 8: Fault-like sensor values (Bearing Defect) produce valid fault prediction."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 3.65,  # High vibration characteristic of bearing defect
            "CURRENT": 13.20,
            "TEMPERATURE": 72.5,  # Elevated temperature
            "RPM": 2900
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["anomalyDetected"] is True
    assert data["anomalyScore"] >= 0.50
    assert data["faultType"] == "BEARING_DEFECT"


def test_stator_short_sensor_values_produce_fault_prediction(client):
    """Test fault-like sensor values (Stator Short) produce valid fault prediction."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 2.05,
            "CURRENT": 18.5,    # High current surge
            "TEMPERATURE": 82.0, # High stator heat
            "RPM": 2885
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["anomalyDetected"] is True
    assert data["faultType"] == "STATOR_SHORT"


def test_missing_vibration_rejected(client):
    """Test 3: Missing VIBRATION is rejected."""
    payload = {
        "machineId": 1,
        "sensors": {
            "CURRENT": 12.4,
            "TEMPERATURE": 56.0,
            "RPM": 2915
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    assert "VIBRATION" in response.text


def test_missing_current_rejected(client):
    """Test 4: Missing CURRENT is rejected."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.85,
            "TEMPERATURE": 56.0,
            "RPM": 2915
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    assert "CURRENT" in response.text


def test_missing_temperature_rejected(client):
    """Test 5: Missing TEMPERATURE is rejected."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.85,
            "CURRENT": 12.4,
            "RPM": 2915
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    assert "TEMPERATURE" in response.text


def test_missing_rpm_rejected(client):
    """Test 6: Missing RPM is rejected."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.85,
            "CURRENT": 12.4,
            "TEMPERATURE": 56.0
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    assert "RPM" in response.text


def test_invalid_negative_values_rejected(client):
    """Test 10: Invalid negative values are rejected."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": -1.85,
            "CURRENT": 12.4,
            "TEMPERATURE": 56.0,
            "RPM": 2915
        }
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    assert "negative" in response.text


# ============================================================================
# PHASE 7 TESTS: SHAP Explainability, RUL Estimation & Maintenance Intelligence
# ============================================================================

def test_explain_endpoint_bearing_defect(client):
    """Phase 7 Test 1: POST /api/v1/explain returns SHAP contributions and explanation."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 3.85,
            "CURRENT": 13.2,
            "TEMPERATURE": 72.0,
            "RPM": 2900
        }
    }
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["faultType"] == "BEARING_DEFECT"
    assert "features" in data
    assert len(data["features"]) == 4
    assert "summary" in data
    assert "vibration" in data["summary"].lower()


def test_explain_endpoint_normal(client):
    """Phase 7 Test 2: POST /api/v1/explain for normal values returns healthy explanation."""
    payload = {
        "machineId": 1,
        "sensors": {
            "VIBRATION": 1.85,
            "CURRENT": 12.4,
            "TEMPERATURE": 56.0,
            "RPM": 2915
        }
    }
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["faultType"] == "NORMAL"
    assert "normal" in data["summary"].lower()


def test_rul_endpoint_healthy(client):
    """Phase 7 Test 3: POST /api/v1/rul for healthy motor gives high RUL and STABLE trend."""
    payload = {
        "machineId": 1,
        "healthScore": 100.0,
        "anomalyScore": 0.05,
        "faultType": "NORMAL",
        "faultProbability": 0.99
    }
    response = client.post("/api/v1/rul", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["estimatedRulHours"] >= 4500.0
    assert data["degradationTrend"] == "STABLE"
    assert data["confidence"] == "HIGH"


def test_rul_endpoint_critical_fault(client):
    """Phase 7 Test 4: POST /api/v1/rul for degraded fault reduces RUL severely."""
    payload = {
        "machineId": 1,
        "healthScore": 35.0,
        "anomalyScore": 0.85,
        "faultType": "STATOR_SHORT",
        "faultProbability": 0.95
    }
    response = client.post("/api/v1/rul", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["estimatedRulHours"] < 150.0
    assert data["degradationTrend"] == "ACCELERATING"


def test_maintenance_endpoint_normal(client):
    """Phase 7 Test 5: POST /api/v1/maintenance returns P3_MONITOR for normal operation."""
    payload = {
        "machineId": 1,
        "operatingState": "NORMAL",
        "healthScore": 100.0,
        "anomalyScore": 0.10,
        "faultType": "NORMAL",
        "faultProbability": 0.99,
        "estimatedRulHours": 4900.0
    }
    response = client.post("/api/v1/maintenance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == "P3_MONITOR"
    assert "standard monitoring" in data["recommendation"].lower()


def test_maintenance_endpoint_bearing_defect(client):
    """Phase 7 Test 6: POST /api/v1/maintenance returns recommendation for bearing defect."""
    payload = {
        "machineId": 1,
        "operatingState": "WARNING",
        "healthScore": 65.0,
        "anomalyScore": 0.55,
        "faultType": "BEARING_DEFECT",
        "faultProbability": 0.92,
        "estimatedRulHours": 600.0
    }
    response = client.post("/api/v1/maintenance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] in ["P1_IMMEDIATE", "P2_SCHEDULE"]
    assert "bearing" in data["recommendation"].lower()

