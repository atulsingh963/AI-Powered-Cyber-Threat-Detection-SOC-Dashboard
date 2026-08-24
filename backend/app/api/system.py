import os
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.schemas.schemas import HealthStatus
from backend.app.collectors.simulator import DemoSimulator

router = APIRouter(prefix="/system", tags=["System Health & Diagnostics"])


@router.get("/health", response_model=HealthStatus)
async def check_system_health(db: Session = Depends(get_db)):
    # DB Check
    db_status = "OFFLINE"
    try:
        db.execute(text("SELECT 1"))
        db_status = "ONLINE"
    except Exception:
        db_status = "OFFLINE"

    # ML Service Check
    ml_status = "OFFLINE"
    if os.path.exists("ml/models/isolation_forest.joblib"):
        ml_status = "ONLINE"

    # Ollama Check
    ollama_status = "OFFLINE"
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            res = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if res.status_code == 200:
                ollama_status = "ONLINE"
    except Exception:
        ollama_status = "OFFLINE (Fallback Active)"

    # Simulator Check
    sim_status = "ONLINE (Running)" if DemoSimulator.is_running() else "STANDBY"

    overall_status = "ONLINE"
    if db_status == "OFFLINE":
        overall_status = "DEGRADED"

    return HealthStatus(
        status=overall_status,
        api="ONLINE",
        database=db_status,
        redis="ONLINE (In-Memory Pub/Sub)",
        ml_service=ml_status,
        ollama=ollama_status,
        simulator=sim_status
    )
