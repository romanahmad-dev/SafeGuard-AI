import time
import logging
from typing import Dict, Any, List
from backend.services.camera_service import camera_service
from backend.services.sensor_service import sensor_service
from backend.services.detector_service import detector_service
from backend.services.alarm_logger import alarm_logger
from cv_monitoring.safety_engine import SafetyEngine
from cv_monitoring.alert_service import alert_service
from backend.database import SessionLocal, create_risk_evaluation_record, create_alert
from backend.ml import anomaly_detector

logger = logging.getLogger("SafetyOrchestrator")


class SafetyOrchestrator:
    """
    Principal system brain orchestrating the entire industrial safety pipeline.
    Connects Camera Capture -> Detector AI -> Physical IoT Simulator ->
    Safety evaluation criteria -> Alarm/Log buffers -> Persistance DB -> Frontend interfaces.
    """
    def __init__(self):
        self.safety_engine = SafetyEngine()
        self.ticks = 0

    def process_safety_slice(self) -> Dict[str, Any]:
        """
        Executes a single end-to-end synchronized safety assessment event.
        Returns a rich analytics and classification status payload and persists it to SQLite.
        """
        self.ticks = (self.ticks + 1) % 1000000
        
        # 1. Capture sensor parameters
        sensor_feed = sensor_service.get_feed_telemetry(cycle_ticks=self.ticks)
        raw_sensors = sensor_feed.sensors
        
        # Format metrics to match SafetyEngine's expected inputs
        # co2 PPM mapped proportionately to safety engine gas_h2s (e.g., 300 CO2 -> 0.15 H2S equiv)
        h2s_equiv = raw_sensors.gas_co2_ppm / 2000.0
        sensors_dict = {
            "temperature": raw_sensors.temperature,
            "gas_h2s": h2s_equiv,
            "vibration": raw_sensors.vibration_mm_s
        }

        # 2. Grab lens snapshot frame & execute AI object detections
        grabbed, frame = camera_service.fetch_current_frame()
        camera_status = None
        detections_list = []
        hazards_found = False
        
        if grabbed and frame is not None:
            cv_response = detector_service.run_cv_inference(frame, self.ticks)
            camera_status = cv_response.status
            detections_list = [
                {"label": d.label, "confidence": d.confidence, "box": d.box}
                for d in cv_response.detections
            ]
            hazards_found = cv_response.hazards_found
        else:
            logger.warning("Camera sensor framework offline. Skipping real-time spatial analysis.")

        # 3. Evaluate combined metrics using the hybrid safety decision engine
        payload = {
            "camera_detections": detections_list,
            "sensors": sensors_dict
        }
        
        evaluation = self.safety_engine.evaluate_risk(payload)
        
        # Inject ML Anomaly Detector evaluations of raw telemetry signals
        raw_temp = raw_sensors.temperature
        raw_gas = raw_sensors.gas_co2_ppm
        raw_vib = raw_sensors.vibration_mm_s
        ml_health = anomaly_detector.evaluate_telemetry_health(raw_temp, raw_gas, raw_vib)
        evaluation["ml_anomaly_analysis"] = ml_health
        
        risk_score = evaluation["risk_score"]

        risk_category = evaluation["risk_category"]
        status = evaluation["status"]
        active_triggers = evaluation["active_triggers"]
        explain_reasoning = evaluation["explainable_ai_reasoning"]
        theme_accent = evaluation["theme_accent"]

        # Ensure telemetry logs retain their raw profile
        evaluation["telemetry_inspection"]["stress_profile"] = sensor_feed.stress_profile

        # 4. Persistence Context
        db = SessionLocal()
        db_evaluation = None
        try:
            # Commit evaluation transaction block
            db_evaluation = create_risk_evaluation_record(
                db=db,
                risk_score=risk_score,
                risk_category=risk_category,
                status=status,
                theme_accent=theme_accent,
                explainable_ai_reasoning=explain_reasoning,
                sensors_data={
                    "temperature": sensors_dict["temperature"],
                    "gas_co2_ppm": raw_sensors.gas_co2_ppm, # RAW simulated metrics preserved
                    "vibration_mm_s": sensors_dict["vibration"],
                    "stress_profile": sensor_feed.stress_profile
                },
                camera_detections=detections_list,
                active_triggers=active_triggers
            )

            # 5. Handle Alert Limits and notifications
            is_critical = status == "DANGER" or risk_category in ["HIGH", "MEDIUM"]
            if is_critical:
                # Add to memory cache buffer
                alarm_logger.log_alert(
                    risk_score=risk_score,
                    risk_category=risk_category,
                    reasoning=explain_reasoning,
                    rules_triggered=[t["code"] for t in active_triggers]
                )
                
                # Check DB logging criteria
                create_alert(
                    db=db,
                    risk_score=risk_score,
                    risk_category=risk_category,
                    reasoning=explain_reasoning,
                    triggered_rules=[t["code"] for t in active_triggers]
                )

                # Send multi-endpoint real-time notification warnings
                if risk_score >= alert_service.risk_threshold:
                    alert_service.send_alert(
                        message=explain_reasoning,
                        level=risk_category
                    )
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting evaluation cycle: {e}")
        finally:
            db.close()

        # Gather completed aggregated JSON telemetry payload
        response = {
            "evaluation": evaluation,
            "timestamp": time.time(),
            "id": db_evaluation.id if db_evaluation else None,
            "hazards_found": hazards_found,
            "camera_status": camera_status
        }
        
        return response

# Instantiate Global Orchestrator
orchestrator = SafetyOrchestrator()
