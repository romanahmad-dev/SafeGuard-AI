from backend.database.database import Base, engine, get_db, SessionLocal
from backend.database.models import Alert, Telemetry, RiskEvaluation, DetectionEvent, ExplanationLog, User
from backend.database.crud import (
    create_telemetry, get_telemetries,
    create_risk_evaluation_record, get_risk_evaluations,
    create_alert, get_alerts, resolve_alert, get_historical_trends
)


# Bootstrapping Tables
# Automatically runs metadata inspection and creates SQLite structures upon load.
Base.metadata.create_all(bind=engine)
