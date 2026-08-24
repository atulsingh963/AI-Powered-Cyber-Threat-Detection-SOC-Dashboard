from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import SecurityEvent
from backend.app.schemas.schemas import SecurityEventCreate, SecurityEventResponse
from backend.app.detection.parser import LogParser
from backend.app.detection.rule_engine import RuleEngine
from backend.app.detection.ml_engine import MLEngine
from backend.app.correlation.correlator import Correlator
from backend.app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/events", tags=["Security Events"])


@router.post("/ingest", response_model=SecurityEventResponse)
async def ingest_event(event_in: SecurityEventCreate, db: Session = Depends(get_db)):
    """Ingests, parses, normalizes, evaluates detections, and correlates a security event."""
    if event_in.raw_log and not event_in.event_type:
        norm = LogParser.parse_raw_log(event_in.raw_log, source=event_in.source)
        event_in = norm

    event = SecurityEvent(
        timestamp=event_in.timestamp or datetime.utcnow(),
        event_type=event_in.event_type,
        source=event_in.source,
        source_ip=event_in.source_ip,
        destination_ip=event_in.destination_ip,
        source_port=event_in.source_port,
        destination_port=event_in.destination_port,
        protocol=event_in.protocol,
        username=event_in.username,
        hostname=event_in.hostname,
        process=event_in.process,
        message=event_in.message,
        severity=event_in.severity,
        raw_log=event_in.raw_log,
        normalized_data=event_in.normalized_data
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 1. Rule & ML Detections
    rule_dets = RuleEngine.evaluate_event(db, event)
    ml_det = MLEngine.evaluate_anomaly(db, event)
    all_dets = rule_dets.copy()
    if ml_det:
        all_dets.append(ml_det)

    for d in all_dets:
        db.add(d)
    db.commit()

    # 2. Correlate Events
    incident = Correlator.process_event_correlations(db, event, all_dets)

    # 3. Broadcast to WebSocket
    payload = {
        "type": "NEW_SECURITY_EVENT",
        "event": {
            "id": event.id,
            "timestamp": event.timestamp.isoformat(),
            "event_type": event.event_type,
            "source": event.source,
            "source_ip": event.source_ip,
            "username": event.username,
            "severity": event.severity,
            "message": event.message
        },
        "detections": [
            {
                "detection_type": d.detection_type,
                "rule_name": d.rule_name or d.model_name,
                "severity": d.severity,
                "reason": d.reason
            } for d in all_dets
        ],
        "incident": {
            "id": incident.id,
            "incident_id": incident.incident_id,
            "title": incident.title,
            "severity": incident.severity,
            "category": incident.category,
            "status": incident.status
        } if incident else None
    }
    await ws_manager.broadcast_json(payload)

    return event


@router.get("", response_model=List[SecurityEventResponse])
def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=500),
    severity: Optional[str] = None,
    source_ip: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SecurityEvent)
    if severity:
        query = query.filter(SecurityEvent.severity == severity)
    if source_ip:
        query = query.filter(SecurityEvent.source_ip.contains(source_ip))
    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type)
    if search:
        query = query.filter(
            (SecurityEvent.message.contains(search)) |
            (SecurityEvent.username.contains(search)) |
            (SecurityEvent.hostname.contains(search))
        )

    events = query.order_by(SecurityEvent.timestamp.desc()).offset(skip).limit(limit).all()
    return events


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event_by_id(event_id: int, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    return event
