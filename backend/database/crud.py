import datetime
import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models import Alert, Telemetry, RiskEvaluation, DetectionEvent, ExplanationLog

# Telemetry Operations
def create_telemetry(db: Session, temperature: float, co2_ppm: float, vibration: float, stress_profile: str = "NORMAL") -> Telemetry:
    db_obj = Telemetry(
        temperature=temperature,
        co2_ppm=co2_ppm,
        vibration=vibration,
        stress_profile=stress_profile,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_telemetries(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Telemetry).order_by(Telemetry.timestamp.desc()).offset(skip).limit(limit).all()

# Risk Evaluation Pipeline
def create_risk_evaluation_record(
    db: Session,
    risk_score: float,
    risk_category: str,
    status: str,
    theme_accent: str,
    explainable_ai_reasoning: str,
    sensors_data: dict,
    camera_detections: list,
    active_triggers: list
) -> RiskEvaluation:
    # 1. Create a Telemetry snapshot first
    db_telemetry = Telemetry(
        temperature=sensors_data.get("temperature", 0.0),
        co2_ppm=sensors_data.get("gas_co2_ppm", 300.0),
        vibration=sensors_data.get("vibration_mm_s", 0.0),
        stress_profile=sensors_data.get("stress_profile", "NORMAL"),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_telemetry)
    db.flush()  # Obtain db_telemetry.id

    # 2. Setup the root RiskEvaluation
    db_risk = RiskEvaluation(
        risk_score=risk_score,
        risk_category=risk_category,
        status=status,
        theme_accent=theme_accent,
        telemetry_id=db_telemetry.id,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_risk)
    db.flush()  # Obtain db_risk.id

    # 3. Associate detections
    for det in camera_detections:
        box_str = json.dumps(det.get("box")) if det.get("box") else None
        db_det = DetectionEvent(
            label=det.get("label", "Unknown"),
            confidence=det.get("confidence", 0.0),
            bounding_box=box_str,
            risk_evaluation_id=db_risk.id,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(db_det)

    # 4. Associate explanations / explanations logs
    for trigger in active_triggers:
        db_log = ExplanationLog(
            trigger_reason=trigger.get("message", ""),
            explainable_ai_reasoning=explainable_ai_reasoning,
            risk_evaluation_id=db_risk.id,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(db_log)

    db.commit()
    db.refresh(db_risk)
    return db_risk

def get_risk_evaluations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RiskEvaluation).order_by(RiskEvaluation.timestamp.desc()).offset(skip).limit(limit).all()

# Alert Logging Subsystem
def create_alert(
    db: Session,
    risk_score: float,
    risk_category: str,
    reasoning: str,
    triggered_rules: list
) -> Alert:
    rules_str = ",".join(triggered_rules) if triggered_rules else ""
    db_alert = Alert(
        risk_score=risk_score,
        risk_category=risk_category,
        reasoning=reasoning,
        triggered_rules=rules_str,
        resolved=False,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts(db: Session, skip: int = 0, limit: int = 50, unresolved_only: bool = False):
    query = db.query(Alert)
    if unresolved_only:
        query = query.filter(Alert.resolved == False)
    return query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()

def resolve_alert(db: Session, alert_id: int) -> Alert:
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if db_alert:
        db_alert.resolved = True
        db_alert.resolved_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(db_alert)
    return db_alert

# Custom Analytics Summarization
def get_historical_trends(db: Session, limit: int = 50):
    """Fetches key vectors representing timeline risks for analytical trend charts."""
    records = db.query(RiskEvaluation).order_by(RiskEvaluation.timestamp.asc()).limit(limit).all()
    trends = []
    for r in records:
        temp = r.telemetry.temperature if r.telemetry else 0.0
        co2 = r.telemetry.co2_ppm if r.telemetry else 0.0
        vib = r.telemetry.vibration if r.telemetry else 0.0
        trends.append({
            "timestamp": r.timestamp.isoformat(),
            "risk_score": r.risk_score,
            "risk_category": r.risk_category,
            "temperature": temp,
            "co2_ppm": co2,
            "vibration": vib
        })
    return trends
