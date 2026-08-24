import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket


class WebSocketManager:
    """Manages active WebSocket connections for live SOC dashboard event streaming."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, data: Dict[str, Any]):
        """Broadcasts a JSON event payload to all connected frontend clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


ws_manager = WebSocketManager()
