from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from backend.database import get_db, RiskEvaluation, Telemetry, Alert, DetectionEvent

router = APIRouter(prefix="/analytics", tags=["Industrial Safety Analytics & Statistical Trends"])

@router.get("/trends", response_model=List[Dict[str, Any]])
def get_historical_safety_trends(limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieves chronological timeseries records of system evaluations.
    Ideal for populating React Recharts/D3 line plots.
    """
    records = db.query(RiskEvaluation).order_by(RiskEvaluation.timestamp.desc()).limit(limit).all()
    
    # Reverse to represent oldest to newest chronological sequence
    records.reverse()
    
    trends = []
    for r in records:
        temp = r.telemetry.temperature if r.telemetry else 40.0
        co2 = r.telemetry.co2_ppm if r.telemetry else 300.0
        vib = r.telemetry.vibration if r.telemetry else 1.2
        trends.append({
            "eval_id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "risk_score": r.risk_score,
            "risk_category": r.risk_category,
            "temperature": temp,
            "co2_ppm": co2,
            "vibration_mm_s": vib
        })
    return trends

@router.get("/summary", response_model=Dict[str, Any])
def get_analytical_kpi_summary(db: Session = Depends(get_db)):
    """
    Aggregates operational metrics to derive high-level Key Performance Indicators (KPIs).
    """
    total_evals = db.query(RiskEvaluation).count()
    if total_evals == 0:
        return {
            "avg_risk_score": 0.0,
            "total_incidents": 0,
            "unresolved_alerts_count": 0,
            "high_risk_percentage": 0.0,
            "system_health_index": 100.0,
            "by_category": {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
        }

    # Calculate average scores
    avg_risk = db.query(func.avg(RiskEvaluation.risk_score)).scalar() or 0.0
    
    # Count metrics by category
    low_count = db.query(RiskEvaluation).filter(RiskEvaluation.risk_category == "LOW").count()
    med_count = db.query(RiskEvaluation).filter(RiskEvaluation.risk_category == "MEDIUM").count()
    high_count = db.query(RiskEvaluation).filter(RiskEvaluation.risk_category == "HIGH").count()
    
    # Alert volumes
    unresolved_alerts = db.query(Alert).filter(Alert.resolved == False).count()
    total_alerts = db.query(Alert).count()

    # System Health logic: 100% minus ratio of high/med risk evaluations
    health_index = max(0.0, min(100.0, 100.0 - ((high_count * 1.5 + med_count * 0.4) / total_evals * 100.0)))

    return {
        "avg_risk_score": round(float(avg_risk), 1),
        "total_evaluations": total_evals,
        "total_incidents": total_alerts,
        "unresolved_alerts_count": unresolved_alerts,
        "high_risk_percentage": round((high_count / total_evals) * 100, 1),
        "system_health_index": round(health_index, 1),
        "by_category": {
            "LOW": low_count,
            "MEDIUM": med_count,
            "HIGH": high_count
        }
    }
