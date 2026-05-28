"""SAKSHAM — Scan Routes: Create, list, and manage security scans with real agent pipeline."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.agents.orchestrator import orchestrator
from app.config import settings
from app.db import queries as db

router = APIRouter()


class ScanRequest(BaseModel):
    repository_url: str
    scan_type: str = "full"
    branch: Optional[str] = "main"


class ScanResponse(BaseModel):
    id: str
    repository_url: str
    status: str
    scan_type: str
    created_at: str


# ============================================================
# In-memory scan result cache (for fast access after completion)
# ============================================================
SCAN_RESULTS_CACHE: dict = {}


async def _run_scan_pipeline(scan_id: str, repository_url: str, branch: str, scan_type: str):
    """Background task: run the full multi-agent scan pipeline."""
    result = await orchestrator.execute_scan(
        scan_id=scan_id,
        repository_url=repository_url,
        branch=branch,
        scan_type=scan_type,
    )
    SCAN_RESULTS_CACHE[scan_id] = result
    return result


@router.post("/", response_model=ScanResponse)
async def create_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Initiate a new security scan on a repository."""
    scan_id = str(uuid.uuid4())
    repo_name = request.repository_url.rstrip("/").split("/")[-1].replace(".git", "")
    now = datetime.now(timezone.utc).isoformat()

    scan_data = {
        "id": scan_id,
        "repository_url": request.repository_url,
        "repository_name": repo_name,
        "status": "pending",
        "scan_type": request.scan_type,
        "branch": request.branch or "main",
        "total_vulnerabilities": 0,
        "critical_count": 0,
        "high_count": 0,
        "medium_count": 0,
        "low_count": 0,
        "files_scanned": 0,
        "duration_seconds": 0,
        "agent_logs": [],
        "created_at": now,
        "started_at": None,
        "completed_at": None,
    }

    # Store in database
    await db.create_scan_session(scan_data)

    if settings.SERVERLESS_MODE:
        result = await _run_scan_pipeline(
            scan_id,
            request.repository_url,
            request.branch or "main",
            request.scan_type,
        )
        final_status = result.get("status", "completed") if isinstance(result, dict) else "completed"
        return ScanResponse(
            id=scan_id,
            repository_url=request.repository_url,
            status=final_status,
            scan_type=request.scan_type,
            created_at=now,
        )

    # Launch the scan pipeline as a background task
    background_tasks.add_task(
        _run_scan_pipeline,
        scan_id,
        request.repository_url,
        request.branch or "main",
        request.scan_type,
    )

    return ScanResponse(
        id=scan_id,
        repository_url=request.repository_url,
        status="pending",
        scan_type=request.scan_type,
        created_at=now,
    )


@router.get("/")
async def list_scans():
    """List all scans."""
    scans = await db.list_scan_sessions()
    return {"scans": scans}


@router.get("/{scan_id}")
async def get_scan(scan_id: str):
    """Get details of a specific scan."""
    # Check cache first (completed scans with full results)
    if scan_id in SCAN_RESULTS_CACHE:
        return SCAN_RESULTS_CACHE[scan_id]

    # Check database
    scan = await db.get_scan_session(scan_id)
    if scan:
        return scan

    raise HTTPException(status_code=404, detail="Scan not found")


@router.get("/{scan_id}/vulnerabilities")
async def get_scan_vulnerabilities(scan_id: str):
    """Get vulnerabilities found in a scan."""
    # Check cache
    if scan_id in SCAN_RESULTS_CACHE:
        return {"vulnerabilities": SCAN_RESULTS_CACHE[scan_id].get("vulnerabilities", [])}

    # Check database
    vulns = await db.get_vulnerabilities_by_scan(scan_id)
    if vulns:
        return {"vulnerabilities": vulns}

    return {"vulnerabilities": []}


@router.get("/{scan_id}/progress")
async def get_scan_progress(scan_id: str):
    """Get real-time scan progress."""
    from app.utils.redis_client import redis_client
    progress = await redis_client.get_scan_progress(scan_id)
    if progress:
        return progress

    # Check orchestrator active scans
    active = orchestrator.get_active_scans()
    if scan_id in active:
        return active[scan_id]

    return {"status": "unknown", "message": "Scan not found or already completed"}
