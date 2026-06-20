import json
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SafetyEngine")

class SafetyEngine:
    """
    AI Safety hybrid decision engine combining explicit industrial safety rules
    with an explainable reasoning structure for factory hazard classifications.
    """
    def __init__(self, temp_threshold: float = 75.0, vib_threshold: float = 5.0, gas_threshold: float = 0.15):
        self.temp_threshold = temp_threshold
        self.vib_threshold = vib_threshold
        self.gas_threshold = gas_threshold

    def evaluate_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates current workspace signals including camera detections and physical telemetry.
        Returns a structured assessment containing numerical risk score, risk level, and explainable insights.
        
        Args:
            data (dict): Combined telemetry state, e.g.:
                {
                    "camera_detections": [{"label": "Person", "confidence": 0.8}, {"label": "Fire/Overheat", "confidence": 0.9}],
                    "sensors": {"temperature": 78.5, "gas_h2s": 0.08, "vibration": 5.4}
                }
        """
        # 1. Parse Inputs safely
        sensors = data.get("sensors", {})
        temp = float(sensors.get("temperature", 0.0))
        gas = float(sensors.get("gas_h2s", 0.0))
        vib = float(sensors.get("vibration", 0.0))
        
        camera_detections = data.get("camera_detections", [])
        
        # 2. Rule evaluation variables
        triggers = []
        is_fire_detected = False
        is_person_present = False
        
        # Parse Camera Detections
        for det in camera_detections:
            lbl = det.get("label", "").lower()
            conf = det.get("confidence", 0.0)
            if "fire" in lbl or "smoke" in lbl or "flame" in lbl or "leak" in lbl:
                if conf > 0.4:
                    is_fire_detected = True
            if "person" in lbl or "human" in lbl or "operative" in lbl:
                if conf > 0.4:
                    is_person_present = True

        # Rule 1: High Temperature Check
        temp_alert = temp > self.temp_threshold
        if temp_alert:
            triggers.append({
                "code": "RULE_TEMP_EXCEEDED",
                "severity": "CRITICAL" if temp > (self.temp_threshold * 1.2) else "WARNING",
                "message": f"Temperature of {temp:.1f}°C is above safety tolerance threshold ({self.temp_threshold}°C)."
            })

        # Rule 2: Active Smoke / Flame Hazard
        if is_fire_detected:
            triggers.append({
                "code": "RULE_SMOKE_DETECTED",
                "severity": "CRITICAL",
                "message": "Computer vision module identified fire/smoke or high-intensity thermal plumes in the visual canvas."
            })

        # Rule 3: Abnormal Vibration (Mechanical Failure Hazard)
        vib_alert = vib > self.vib_threshold
        if vib_alert:
            triggers.append({
                "code": "RULE_VIB_ABNORMAL",
                "severity": "WARNING" if vib < (self.vib_threshold * 1.5) else "CRITICAL",
                "message": f"Abnormal axial vibration peak of {vib:.1f} mm/s detected (Threshold: {self.vib_threshold} mm/s). Risk of critical equipment degradation."
            })

        # Rule 4: Elevated Gas PPM Exposure
        gas_alert = gas > self.gas_threshold
        if gas_alert:
            triggers.append({
                "code": "RULE_GAS_SPIKE",
                "severity": "CRITICAL",
                "message": f"Dangerous level of H2S Gas ({gas:.2f} PPM) exceeds limits ({self.gas_threshold:.2f} PPM)."
            })

        # 3. Dynamic Hybrid Risk Scoring Algorithm (0 - 100 Range)
        # Base Risk derived from rule triggers and continuous telemetry bounds
        base_score = 10.0  # Ambient operations baseline
        
        # Temperature mapping: scales non-linearly if temp rises past normal
        if temp > 25.0:
            temp_ratio = (temp - 25.0) / (self.temp_threshold - 25.0)
            base_score += min(30.0, temp_ratio * 20.0)
            if temp_alert:
                base_score += 15.0
                
        # Vibration mapping
        if vib > 2.0:
            vib_ratio = (vib - 2.0) / (self.vib_threshold - 2.0)
            base_score += min(20.0, vib_ratio * 15.0)
            if vib_alert:
                base_score += 15.0
                
        # Gas mapping
        if gas > 0.05:
            gas_ratio = gas / self.gas_threshold
            base_score += min(25.0, gas_ratio * 20.0)
            if gas_alert:
                base_score += 20.0

        # Physical hazard visual detections
        if is_fire_detected:
            base_score += 40.0
            
        # Human vulnerability adjustment: if a worker is exposed during list of alarms, severity escalates
        if is_person_present and len(triggers) > 0:
            base_score += 15.0
            
        # Prevent overflowing above bounds
        risk_score = min(100.0, max(0.0, base_score))
        
        # Map score to standard hazard category
        if risk_score < 35.0:
            category = "LOW"
            color_hex = "#4ADE80"  # Safe Green
        elif risk_score < 70.0:
            category = "MEDIUM"
            color_hex = "#FFD700"  # Pre-alarm Gold / Warning
        else:
            category = "HIGH"
            color_hex = "#F87171"  # Action Alert Rose

        # 4. Explainable AI (XAI) reasoning synthesis
        rationales = []
        if len(triggers) == 0:
            rationales.append("All primary environmental criteria and visual fields reside within stable industrial reference standards.")
            rationales.append("No active mechanical or human hazards detected in this inspection slice.")
        else:
            rationales.append(f"AI Decision Engine escalated workspace risk to {category} due to {len(triggers)} active rule anomalies.")
            for trg in triggers:
                rationales.append(f"- [{trg['severity']}] {trg['message']}")
            if is_person_present:
                rationales.append("- [RISK MULTIPLIER] Human presence inside hazard vector increases immediate safety priority.")

        reasoning = " ".join(rationales)
        
        assessment = {
            "risk_score": round(risk_score, 1),
            "risk_category": category,
            "status": "DANGER" if (is_fire_detected or temp_alert or gas_alert or vib > (self.vib_threshold * 1.4)) else "SAFE",
            "active_triggers": triggers,
            "theme_accent": color_hex,
            "explainable_ai_reasoning": reasoning,
            "telemetry_inspection": {
                "temperature_deg_c": temp,
                "vibration_mm_s": vib,
                "gas_h2s_ppm": gas,
                "person_in_camera_feed": is_person_present,
                "fire_in_camera_feed": is_fire_detected
            }
        }
        
        return assessment

# Unit test capability for development inspection check
if __name__ == "__main__":
    engine = SafetyEngine()
    test_data = {
        "sensors": {
            "temperature": 82.0,
            "gas_h2s": 0.04,
            "vibration": 6.1
        },
        "camera_detections": [
            {"label": "Person", "confidence": 0.88, "box": [100, 150, 40, 90]}
        ]
    }
    
    report = engine.evaluate_risk(test_data)
    print(json.dumps(report, indent=4))
