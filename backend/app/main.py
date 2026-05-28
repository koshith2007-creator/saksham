"""
SAKSHAM — AI-Native Autonomous Cybersecurity Platform
FastAPI Main Application Entry Point
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import structlog
import uuid
from datetime import datetime, timezone

from app.config import settings
from app.api.routes import auth, scans, repositories, vulnerabilities, chat, reports, dashboard
from app.api.websockets.scan_progress import ConnectionManager

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer()
    ]
)

logger = structlog.get_logger()

# WebSocket connection manager
ws_manager = ConnectionManager()


CONFIG_ENV_KEYS = [
    "ENVIRONMENT",
    "DEMO_MODE",
    "CORS_ORIGINS",
    "FRONTEND_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GEMINI_API_KEY",
    "HUGGINGFACE_API_TOKEN",
    "HUGGINGFACE_MODEL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_URL",
    "UPSTASH_REDIS_TOKEN",
]


def env_presence() -> dict[str, bool]:
    """Report whether deployment env vars exist without exposing values."""
    return {key: bool(os.getenv(key)) for key in CONFIG_ENV_KEYS}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("🚀 SAKSHAM starting up", version=settings.APP_VERSION, env=settings.ENVIRONMENT)
    logger.info("🔧 Demo mode", enabled=settings.DEMO_MODE)
    logger.info(
        "Deployment config status",
        frontend_url=settings.FRONTEND_URL,
        cors_origins=settings.cors_origins_list,
        oauth_configured=settings.oauth_configured,
        env_present=env_presence(),
    )
    yield
    logger.info("🛑 SAKSHAM shutting down")


# Create FastAPI application
app = FastAPI(
    title="SAKSHAM — AI-Native Cybersecurity Platform",
    description="Autonomous AI security engineering platform with multi-agent architecture",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Health Check
# ============================================================
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "operational",
        "platform": "SAKSHAM",
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "demo_mode": settings.DEMO_MODE,
    }


@app.get("/api/config/status")
async def config_status():
    """Return non-secret deployment configuration status."""
    return {
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "cors_origins": settings.cors_origins_list,
        "oauth_configured": settings.oauth_configured,
        "frontend_url": settings.FRONTEND_URL,
        "env_present": env_presence(),
    }


# ============================================================
# Include Routers
# ============================================================
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(repositories.router, prefix="/api/repositories", tags=["Repositories"])
app.include_router(vulnerabilities.router, prefix="/api/vulnerabilities", tags=["Vulnerabilities"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


# ============================================================
# WebSocket Endpoint
# ============================================================
@app.websocket("/ws/scan/{scan_id}")
async def websocket_scan_progress(websocket: WebSocket, scan_id: str):
    """WebSocket endpoint for real-time scan progress."""
    await ws_manager.connect(websocket, scan_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, scan_id)


@app.websocket("/ws/agents")
async def websocket_agent_stream(websocket: WebSocket):
    """WebSocket endpoint for real-time agent activity stream."""
    await ws_manager.connect(websocket, "agent_stream")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "agent_stream")


# ============================================================
# Global Exception Handler
# ============================================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc), path=str(request.url))
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "request_id": str(uuid.uuid4()),
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
