from fastapi import APIRouter
from backend.app.collectors.simulator import DemoSimulator

router = APIRouter(prefix="/simulator", tags=["Safe Attack Simulator & Demo Mode"])


@router.get("/status")
def get_simulator_status():
    return {
        "status": "RUNNING" if DemoSimulator.is_running() else "STOPPED",
        "demo_mode": DemoSimulator.is_running()
    }


@router.post("/start")
async def start_simulator():
    await DemoSimulator.start()
    return {
        "message": "Demo mode simulator started successfully",
        "status": "RUNNING"
    }


@router.post("/stop")
async def stop_simulator():
    await DemoSimulator.stop()
    return {
        "message": "Demo mode simulator stopped successfully",
        "status": "STOPPED"
    }
