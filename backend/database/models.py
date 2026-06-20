import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Telemetry(Base):
    __tablename__ = "sensor_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    temperature = Column(Float, nullable=False)
    co2_ppm = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    stress_profile = Column(String(50), default="NORMAL")

    # Relationship back to Risk Evaluations
    risk_evaluation = relationship("RiskEvaluation", back_populates="telemetry", uselist=False)


class DetectionEvent(Base):
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    label = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    # Bounding box represented as flat JSON string or comma-separated values [x, y, w, h]
    bounding_box = Column(String(100), nullable=True)
    
    risk_evaluation_id = Column(Integer, ForeignKey("risk_evaluations.id"), nullable=True)
    risk_evaluation = relationship("RiskEvaluation", back_populates="detections")


class RiskEvaluation(Base):
    __tablename__ = "risk_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    risk_score = Column(Float, nullable=False, index=True)
    risk_category = Column(String(50), nullable=False, index=True)  # LOW, MEDIUM, HIGH
    status = Column(String(50), nullable=False)  # SAFE, WARNING, DANGER
    theme_accent = Column(String(7), nullable=False)  # Hex colors
    
    # Associated primary telemetry context
    telemetry_id = Column(Integer, ForeignKey("sensor_telemetry.id"), nullable=True)
    telemetry = relationship("Telemetry", back_populates="risk_evaluation")

    # Cascade relations for physical video observations
    detections = relationship("DetectionEvent", back_populates="risk_evaluation", cascade="all, delete-orphan")
    explanations = relationship("ExplanationLog", back_populates="risk_evaluation", cascade="all, delete-orphan")


class ExplanationLog(Base):
    __tablename__ = "explanation_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    trigger_reason = Column(String(1000), nullable=False)
    explainable_ai_reasoning = Column(String(4000), nullable=False)

    risk_evaluation_id = Column(Integer, ForeignKey("risk_evaluations.id"), nullable=True)
    risk_evaluation = relationship("RiskEvaluation", back_populates="explanations")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False)
    reasoning = Column(String(4000), nullable=False)
    triggered_rules = Column(String(500), nullable=True)  # Comma-separated list of rule codes
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Viewer", nullable=False)  # Viewer, Safety Officer, Manager, Admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

