import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Table, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

# Association table for Incident and SecurityEvent
incident_events = Table(
    "incident_events",
    Base.metadata,
    Column("incident_db_id", Integer, ForeignKey("incidents.id", ondelete="CASCADE"), primary_key=True),
    Column("event_id", Integer, ForeignKey("security_events.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst")  # admin, analyst, viewer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String(100), index=True, nullable=False)
    source = Column(String(100), index=True, nullable=False)  # linux_auth, nginx, app_log, synthetic, json
    source_ip = Column(String(50), index=True)
    destination_ip = Column(String(50), index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(20), nullable=True)
    username = Column(String(100), index=True, nullable=True)
    hostname = Column(String(100), index=True, nullable=True)
    process = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    severity = Column(String(20), default="low", index=True)  # low, medium, high, critical
    raw_log = Column(Text, nullable=True)
    normalized_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    detections = relationship("Detection", back_populates="event", cascade="all, delete-orphan")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False)
    detection_type = Column(String(50), index=True)  # rule_based, ml_anomaly
    rule_name = Column(String(100), nullable=True)
    model_name = Column(String(100), nullable=True)
    confidence = Column(Float, default=1.0)
    severity = Column(String(20), default="medium", index=True)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("SecurityEvent", back_populates="detections")
    alerts = relationship("Alert", back_populates="detection", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="medium", index=True)
    status = Column(String(50), default="new", index=True)  # new, acknowledged, investigating, resolved, false_positive
    source_ip = Column(String(50), index=True)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    occurrence_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    detection = relationship("Detection", back_populates="alerts")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)  # INC-20260825-001
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="medium", index=True)  # informational, low, medium, high, critical
    category = Column(String(100), default="Suspicious Activity", index=True)
    status = Column(String(50), default="NEW", index=True)  # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    assigned_to = Column(String(100), nullable=True)
    confidence = Column(Float, default=0.85)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    events = relationship("SecurityEvent", secondary=incident_events, backref="incidents")
    notes = relationship("InvestigationNote", back_populates="incident", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="incident", cascade="all, delete-orphan")


class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name = Column(String(100), default="SOC Analyst")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="notes")


class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Behavioral")
    mitre_technique = Column(String(50), nullable=True)  # e.g., T1110
    severity = Column(String(20), default="medium")
    enabled = Column(Boolean, default=True)
    configuration = Column(JSON, nullable=True)  # e.g. {"threshold": 10, "window_seconds": 300}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    attack_type = Column(String(100), nullable=False)
    reasoning = Column(Text, nullable=False)
    recommendations = Column(JSON, nullable=False)  # list of actionable recommendations
    confidence = Column(Float, default=0.85)
    model = Column(String(100), default="deterministic-fallback")
    is_fallback = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="ai_analyses")
