import pytest
from fastapi.testclient import TestClient
from cv_monitoring.sensor_simulator import FactorySensorSimulator
from cv_monitoring.safety_engine import SafetyEngine
from cv_monitoring.alert_service import alert_service
from backend.ai.orchestrator import orchestrator
from backend.main import app

client = TestClient(app)

# 1. Tests for the Physical Sensor Telemetry Simulator Loop
def test_sensor_simulator_limits():
    sim = FactorySensorSimulator()
    sample = sim.generate_sample()
    
    assert "timestamp" in sample
    assert "sensors" in sample
    assert "temperature" in sample["sensors"]
    assert "gas_co2_ppm" in sample["sensors"]
    assert "vibration_mm_s" in sample["sensors"]

    # Test toggling to stress profile
    sim.set_stress_profile("FAILURE_TEST")
    assert sim.stress_mode == "FAILURE_TEST"
    
    critical_sample = sim.generate_sample()
    # Stress model should produce higher metrics
    assert critical_sample["sensors"]["temperature"] >= sim.base_temp or critical_sample["sensors"]["vibration_mm_s"] >= sim.base_vib


# 2. Tests for the Pure Rules-Based Hybrid Safety scoring engine
def test_safety_engine_bounds():
    engine = SafetyEngine()
    
    # Nominal readings should resolve to LOW risk category
    low_risk_data = {
        "sensors": {"temperature": 28.0, "gas_h2s": 0.02, "vibration": 1.1},
        "camera_detections": []
    }
    low_res = engine.evaluate_risk(low_risk_data)
    assert low_res["risk_category"] == "LOW"
    assert low_res["status"] == "SAFE"

    # Extreme readings should escalate dynamically
    breached_data = {
        "sensors": {"temperature": 92.5, "gas_h2s": 0.35, "vibration": 8.4},
        "camera_detections": [{"label": "Fire/Overheat", "confidence": 0.92}]
    }
    high_res = engine.evaluate_risk(breached_data)
    assert high_res["risk_category"] == "HIGH"
    assert high_res["status"] == "DANGER"
    assert len(high_res["active_triggers"]) >= 3


# 3. Tests for notification alerting systems
def test_alert_service_dispatch():
    try:
        alert_service.send_alert("Autonomous drill spindle overload alert", "WARNING")
    except Exception as e:
        pytest.fail(f"Alert service raised unexpected exception during execution: {e}")


# 4. Tests for the core Orchestrator brain loops
def test_orchestrator_integration():
    try:
        slice_result = orchestrator.process_safety_slice()
        assert "evaluation" in slice_result
        assert "timestamp" in slice_result
        assert "ml_anomaly_analysis" in slice_result["evaluation"]
    except Exception as e:
        pytest.fail(f"Orchestrator pipeline failed during evaluation: {e}")


# 5. Tests for FastAPI Web Endpoints Routing
def test_web_routes():
    # Test Root Index
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "service" in root_res.json()
    assert "3.0.0" in root_res.json()["version"]

    # Test Telemetry data fetching
    sens_res = client.get("/api/sensor-data")
    assert sens_res.status_code == 200
    assert "sensors" in sens_res.json()

    # Test Analytics Summarization KPIs
    summary_res = client.get("/api/analytics/summary")
    assert summary_res.status_code == 200
    assert "system_health_index" in summary_res.json()
    
    # Test Analytics Trends Graphing Coordinates
    trends_res = client.get("/api/analytics/trends")
    assert trends_res.status_code == 200
    assert isinstance(trends_res.json(), list)
