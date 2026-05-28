"""WebSocket Connection Manager for real-time scan progress and agent streaming."""

from fastapi import WebSocket
from typing import Dict, List
import json
import structlog

logger = structlog.get_logger()


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info("WebSocket connected", channel=channel)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].remove(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
        logger.info("WebSocket disconnected", channel=channel)

    async def broadcast(self, channel: str, message: dict):
        """Broadcast message to all connections in a channel."""
        if channel in self.active_connections:
            disconnected = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, channel)

    async def send_scan_progress(self, scan_id: str, data: dict):
        """Send scan progress update."""
        await self.broadcast(scan_id, {
            "type": "scan_progress",
            "scan_id": scan_id,
            **data,
        })

    async def send_agent_event(self, event: dict):
        """Send agent activity event to all listeners."""
        await self.broadcast("agent_stream", {
            "type": "agent_event",
            **event,
        })
