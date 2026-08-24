from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Incident, InvestigationNote, SecurityEvent, AIAnalysis
from backend.app.schemas.schemas import (
    IncidentResponse, IncidentDetailResponse, IncidentStatusUpdate,
    InvestigationNoteCreate, InvestigationNoteResponse
)

router = APIRouter(prefix="/incidents", tags=["Incident Management"])


@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    if category:
        query = query.filter(Incident.category == category)
    if search:
        query = query.filter(
            (Incident.title.contains(search)) |
            (Incident.incident_id.contains(search)) |
            (Incident.description.contains(search))
        )

    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()
    
    # Calculate event count dynamically
    res = []
    for inc in incidents:
        inc_data = IncidentResponse.model_validate(inc)
        inc_data.event_count = len(inc.events)
        res.append(inc_data)

    return res


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    # Can query by numeric DB id or incident_id string (e.g., INC-20260825-XXXXXX)
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    else:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    detail = IncidentDetailResponse.model_validate(incident)
    detail.event_count = len(incident.events)
    detail.events = incident.events
    detail.notes = incident.notes
    detail.ai_analyses = incident.ai_analyses

    return detail


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    update: IncidentStatusUpdate,
    db: Session = Depends(get_db)
):
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    else:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if update.status:
        incident.status = update.status.upper()
    if update.assigned_to is not None:
        incident.assigned_to = update.assigned_to
    if update.severity:
        incident.severity = update.severity.lower()

    incident.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)

    res = IncidentResponse.model_validate(incident)
    res.event_count = len(incident.events)
    return res


@router.post("/{incident_id}/notes", response_model=InvestigationNoteResponse)
def add_investigation_note(
    incident_id: str,
    note_in: InvestigationNoteCreate,
    db: Session = Depends(get_db)
):
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    else:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    note = InvestigationNote(
        incident_id=incident.id,
        author_name="Senior SOC Analyst",
        note=note_in.note
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
