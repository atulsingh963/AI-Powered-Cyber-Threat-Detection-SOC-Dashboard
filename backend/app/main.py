from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.core.websocket_manager import ws_manager
from backend.app.detection.rule_engine import RuleEngine
from backend.app.api import auth, events, incidents, detections, ai, simulator, analytics, system

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed default rules & admin user
with SessionLocal() as db:
    RuleEngine.seed_default_rules(db)
    auth.seed_default_admin(db)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Cyber Threat Detection & SOC Dashboard REST & WebSocket API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registrations
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(detections.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)


@app.get("/")
def root_endpoint():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "tagline": "Detect. Investigate. Defend.",
        "docs": f"{settings.API_V1_STR}/docs"
    }


@app.websocket("/ws/live-events")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & receive optional client heartbeats
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
