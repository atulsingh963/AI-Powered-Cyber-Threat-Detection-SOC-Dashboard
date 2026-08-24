from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Incident
from backend.app.schemas.schemas import AIAnalysisResponse
from backend.app.ai.analyst import AIAnalyst

router = APIRouter(prefix="/ai", tags=["AI Analyst"])


@router.post("/analyze/{incident_id}", response_model=AIAnalysisResponse)
async def analyze_incident(incident_id: str, db: Session = Depends(get_db)):
    """Triggers AI Security Analyst report (with Ollama LLM or deterministic fallback)."""
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    else:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    analysis = await AIAnalyst.analyze_incident(db, incident)
    return analysis
