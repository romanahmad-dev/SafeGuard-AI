from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SensorData(BaseModel):
    temperature: float = Field(..., description="Engine housing temperature in Celsius")
    gas_co2_ppm: float = Field(..., description="CO2 concentration in parts per million")
    vibration_mm_s: float = Field(..., description="Vibration speed in millimeters per second")

class SensorTelemetryResponse(BaseModel):
    timestamp: float
    stress_profile: str
    sensors: SensorData

class DetectionBox(BaseModel):
    label: str
    box: List[int] = Field(..., description="Bounding box [x, y, width, height]")
    confidence: float

class CameraStatusResponse(BaseModel):
    status: str = Field(..., description="SAFE, WARNING or DANGER status")
    detections: List[DetectionBox]
    hazards_found: bool
    timestamp: float

class TriggerMetrics(BaseModel):
    code: str
    severity: str
    message: str

class RiskEvaluationPayload(BaseModel):
    camera_detections: List[DetectionBox]
    sensors: Dict[str, float]

class TelemetryInspection(BaseModel):
    temperature_deg_c: float
    vibration_mm_s: float
    gas_h2s_ppm: float
    person_in_camera_feed: bool
    fire_in_camera_feed: bool

class RiskScoreResponse(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_category: str = Field(..., description="LOW, MEDIUM, or HIGH")
    status: str
    active_triggers: List[TriggerMetrics]
    theme_accent: str
    explainable_ai_reasoning: str
    telemetry_inspection: TelemetryInspection

class AlertRecord(BaseModel):
    id: str
    timestamp: float
    risk_score: float
    risk_category: str
    reasoning: str
    triggered_rules: List[str]
