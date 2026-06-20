import time
from typing import Dict, Any, List
from cv_monitoring.detector import IndustrialSafetyDetector
from cv_monitoring.safety_engine import SafetyEngine
from cv_monitoring.alert_service import alert_service
from backend.models.schemas import CameraStatusResponse, RiskScoreResponse, DetectionBox, TelemetryInspection, TriggerMetrics
from backend.services.alarm_logger import alarm_logger
import logging

logger = logging.getLogger("DetectorService")

class DetectorService:
    """
    State manager coordinating deep frames assessment and rule-based priority mitigation algorithms.
    """
    def __init__(self):
        self.detector = IndustrialSafetyDetector(use_simulation_fallback=True)
        self.engine = SafetyEngine()

    def run_cv_inference(self, frame, ticks: int) -> CameraStatusResponse:
        """Runs image object detection over the feed frame and formats validated outputs."""
        inference = self.detector.run_inference(frame, tick_count=ticks)
        
        detections: List[DetectionBox] = []
        for det in inference.get("detections", []):
            detections.append(DetectionBox(
                label=det["label"],
                box=det["box"],
                confidence=det["confidence"]
            ))
            
        return CameraStatusResponse(
            status=inference["status"],
            detections=detections,
            hazards_found=inference["hazards_found"],
            timestamp=time.time()
        )

    def evaluate_combined_risk(self, camera_detections: List[DetectionBox], sensors_dict: Dict[str, float]) -> RiskScoreResponse:
        """
        Integrates visual and telemetry metrics using SafetyEngine.
        Logs any high-risk critical alerts dynamically into our AlarmLogger service.
        """
        raw_detections = [
            {"label": d.label, "confidence": d.confidence, "box": d.box}
            for d in camera_detections
        ]
        
        payload = {
            "camera_detections": raw_detections,
            "sensors": sensors_dict
        }
        
        evaluation = self.engine.evaluate_risk(payload)
        
        # Parse Pydantic triggers
        active_triggers = []
        triggered_codes = []
        for trg in evaluation.get("active_triggers", []):
            active_triggers.append(TriggerMetrics(
                code=trg["code"],
                severity=trg["severity"],
                message=trg["message"]
            ))
            triggered_codes.append(trg["code"])

        tel = evaluation.get("telemetry_inspection", {})
        inspection = TelemetryInspection(
            temperature_deg_c=tel.get("temperature_deg_c", 0.0),
            vibration_mm_s=tel.get("vibration_mm_s", 0.0),
            gas_h2s_ppm=tel.get("gas_h2s_ppm", 0.0),
            person_in_camera_feed=tel.get("person_in_camera_feed", False),
            fire_in_camera_feed=tel.get("fire_in_camera_feed", False)
        )

        response = RiskScoreResponse(
            risk_score=evaluation["risk_score"],
            risk_category=evaluation["risk_category"],
            status=evaluation["status"],
            active_triggers=active_triggers,
            theme_accent=evaluation["theme_accent"],
            explainable_ai_reasoning=evaluation["explainable_ai_reasoning"],
            telemetry_inspection=inspection
        )

        # Log to AlarmLogger registry automatically on DANGER threshold breaches
        if response.status == "DANGER" or response.risk_category in ["HIGH", "MEDIUM"]:
            alarm_logger.log_alert(
                risk_score=response.risk_score,
                risk_category=response.risk_category,
                reasoning=response.explainable_ai_reasoning,
                rules_triggered=triggered_codes
            )
            
            # Send real/simulated notifications via Console, Email and Telegram
            if response.risk_score >= alert_service.risk_threshold:
                alert_service.send_alert(
                    message=response.explainable_ai_reasoning,
                    level=response.risk_category
                )

        return response

# Global Singleton Service
detector_service = DetectorService()
