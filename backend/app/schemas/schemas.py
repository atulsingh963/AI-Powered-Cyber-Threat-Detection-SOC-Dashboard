from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "analyst"


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Event Schemas
class SecurityEventCreate(BaseModel):
    timestamp: Optional[datetime] = None
    event_type: str
    source: str = "custom"
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = None
    username: Optional[str] = None
    hostname: Optional[str] = None
    process: Optional[str] = None
    message: Optional[str] = None
    severity: str = "low"
    raw_log: Optional[str] = None
    normalized_data: Optional[Dict[str, Any]] = None


class SecurityEventResponse(SecurityEventCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Detection Schemas
class DetectionResponse(BaseModel):
    id: int
    event_id: int
    detection_type: str
    rule_name: Optional[str] = None
    model_name: Optional[str] = None
    confidence: float
    severity: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    detection_id: int
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    source_ip: Optional[str] = None
    first_seen: datetime
    last_seen: datetime
    occurrence_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# Note Schemas
class InvestigationNoteCreate(BaseModel):
    note: str


class InvestigationNoteResponse(BaseModel):
    id: int
    incident_id: int
    author_id: Optional[int] = None
    author_name: str
    note: str
    created_at: datetime

    class Config:
        from_attributes = True


# AI Analysis Schemas
class AIAnalysisResponse(BaseModel):
    id: int
    incident_id: int
    summary: str
    attack_type: str
    reasoning: str
    recommendations: List[str]
    confidence: float
    model: str
    is_fallback: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Incident Schemas
class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    title: str
    description: Optional[str] = None
    severity: str
    category: str
    status: str
    assigned_to: Optional[str] = None
    confidence: float
    first_seen: datetime
    last_seen: datetime
    event_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentDetailResponse(IncidentResponse):
    events: List[SecurityEventResponse] = []
    notes: List[InvestigationNoteResponse] = []
    ai_analyses: List[AIAnalysisResponse] = []


class IncidentStatusUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    severity: Optional[str] = None


# Detection Rule Schemas
class DetectionRuleResponse(BaseModel):
    id: int
    rule_id: str
    name: str
    description: Optional[str] = None
    category: str
    mitre_technique: Optional[str] = None
    severity: str
    enabled: bool
    configuration: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class DetectionRuleUpdate(BaseModel):
    enabled: Optional[bool] = None
    severity: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None


# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_events: int
    active_alerts: int
    critical_incidents: int
    high_risk_events: int
    detection_accuracy: float
    mean_time_to_respond_mins: float
    severity_distribution: Dict[str, int]
    attack_categories: Dict[str, int]
    top_source_ips: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]


# Health Schema
class HealthStatus(BaseModel):
    status: str  # ONLINE, DEGRADED, OFFLINE
    api: str
    database: str
    redis: str
    ml_service: str
    ollama: str
    simulator: str
