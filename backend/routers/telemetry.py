from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from backend.models.schemas import SensorTelemetryResponse, CameraStatusResponse, RiskScoreResponse, AlertRecord, RiskEvaluationPayload
from backend.services.sensor_service import sensor_service
from backend.services.camera_service import camera_service
from backend.services.detector_service import detector_service
from backend.services.alarm_logger import alarm_logger
import cv2

router = APIRouter(
    tags=["Industrial Safety Telemetry Dashboard Controller"]
)

# Shared virtual ticker mimicking hardware clock pulses
_ticks = 0

def increment_ticks():
    global _ticks
    _ticks = (_ticks + 1) % 1000000
    return _ticks

@router.get("/sensor-data", response_model=SensorTelemetryResponse)
def get_sensor_data_stream():
    """Returns dynamic simulated factory environment sensor metrics."""
    ticks = increment_ticks()
    return sensor_service.get_feed_telemetry(cycle_ticks=ticks)

@router.get("/camera-status", response_model=CameraStatusResponse)
def get_camera_detection_status():
    """Runs image analytics and logs AI detection bounding boxes on current live camera feeds."""
    ticks = increment_ticks()
    grabbed, frame = camera_service.fetch_current_frame()
    if not grabbed or frame is None:
        raise HTTPException(status_code=503, detail="Camera driver stream offline.")
        
    return detector_service.run_cv_inference(frame, ticks)

@router.get("/risk-score", response_model=RiskScoreResponse)
def get_risk_assessment_score():
    """
    Fuses telemetry vectors with current camera targets.
    Evaluates rule criteria, assigns numeric score, categories, and rationales.
    """
    ticks = increment_ticks()
    
    # 1. Capture dynamic values from simulator
    sensor_feed = sensor_service.get_feed_telemetry(cycle_ticks=ticks)
    sensors_metrics = sensor_feed.sensors
    
    # Scale CO2 values to fit safety engine H2S toxic input specs proportionally 
    co2_ppm = sensors_metrics.gas_co2_ppm
    h2s_equiv = co2_ppm / 2000.0  # e.g., 300 CO2 -> 0.15 H2S equiv
    
    sensors_dict = {
        "temperature": sensors_metrics.temperature,
        "gas_h2s": h2s_equiv,
        "vibration": sensors_metrics.vibration_mm_s
    }
    
    # 2. Extract targets from Camera Lens frame
    grabbed, frame = camera_service.fetch_current_frame()
    if not grabbed or frame is None:
        raise HTTPException(status_code=503, detail="Camera stream disconnected during audit.")
        
    cv_status = detector_service.run_cv_inference(frame, ticks)
    
    # 3. Form unified evaluation, logging alert histories internally if bounds are breached
    return detector_service.evaluate_combined_risk(
        camera_detections=cv_status.detections,
        sensors_dict=sensors_dict
    )

@router.post("/risk-score/evaluate", response_model=RiskScoreResponse)
def post_manual_evaluation_payload(payload: RiskEvaluationPayload):
    """
    Custom endpoint allowing direct inputs to evaluate and audit hypotheticals.
    Perfect for API automation testing. All triggers are recorded securely.
    """
    return detector_service.evaluate_combined_risk(
        camera_detections=payload.camera_detections,
        sensors_dict=payload.sensors
    )

@router.get("/alerts", response_model=List[AlertRecord])
def get_historical_alarms(limit: int = Query(25, ge=1, le=100)):
    """Fetches high-severity occurrences or safety system breacheslogged by the safety engine."""
    return alarm_logger.get_alerts(limit=limit)

@router.post("/alerts/clear")
def reset_operational_alert_queues():
    """Dumps all recorded alerts and restarts safety buffers."""
    alarm_logger.clear_logs()
    return {"status": "SUCCESS", "message": "Alert buffer cleared cleanly."}
