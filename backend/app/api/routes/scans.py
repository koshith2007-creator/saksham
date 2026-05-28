"""SAKSHAM — Scan Routes: Create, list, and manage security scans with real agent pipeline."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.agents.orchestrator import orchestrator
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
    if not scans:
        return {"scans": _get_demo_scans()}
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

    # Fallback to demo data
    demo = _get_demo_scan_detail(scan_id)
    if demo:
        return demo
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

    return {"vulnerabilities": _get_demo_vulnerabilities(scan_id)}


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


def _get_demo_scans():
    """Generate demo scan list."""
    repos = [
        ("payment-service", "completed", 12, 2, 4, 3, 3),
        ("auth-gateway", "scanning", 0, 0, 0, 0, 0),
        ("user-api", "completed", 8, 1, 2, 3, 2),
        ("frontend-app", "completed", 23, 0, 5, 12, 6),
        ("data-pipeline", "completed", 5, 3, 1, 1, 0),
    ]
    scans = []
    for i, (name, status, total, crit, high, med, low) in enumerate(repos):
        scans.append({
            "id": f"demo-scan-{i+1:03d}",
            "repository_url": f"https://github.com/acme-corp/{name}",
            "repository_name": name,
            "status": status,
            "scan_type": "full",
            "branch": "main",
            "total_vulnerabilities": total,
            "critical_count": crit,
            "high_count": high,
            "medium_count": med,
            "low_count": low,
            "files_scanned": 120 + i * 50,
            "duration_seconds": 28 + i * 8,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 4)).isoformat(),
            "completed_at": (datetime.now(timezone.utc) - timedelta(hours=i * 4 - 1)).isoformat() if status == "completed" else None,
        })
    return scans


def _get_demo_scan_detail(scan_id: str):
    """Get detailed demo scan."""
    scans = _get_demo_scans()
    for scan in scans:
        if scan["id"] == scan_id:
            scan["agent_logs"] = [
                {"agent": "Orchestrator", "action": "Scan initiated", "status": "completed", "duration_ms": 120},
                {"agent": "Repository Intel", "action": "Analyzed repository structure", "status": "completed", "duration_ms": 3000},
                {"agent": "Static Analysis", "action": f"Scanned {scan['files_scanned']} files", "status": "completed", "duration_ms": 15000},
                {"agent": "Dependency Security", "action": "Analyzed 45 dependencies", "status": "completed", "duration_ms": 8000},
                {"agent": "Exploitability", "action": f"Validated {scan['total_vulnerabilities']} findings", "status": "completed", "duration_ms": 22000},
                {"agent": "Threat Intelligence", "action": "Correlated with threat feeds", "status": "completed", "duration_ms": 5000},
                {"agent": "Risk Scoring", "action": "Computed risk scores", "status": "completed", "duration_ms": 3000},
                {"agent": "Remediation", "action": "Generated fix suggestions", "status": "completed", "duration_ms": 12000},
            ]
            return scan
    return None


def _get_demo_vulnerabilities(scan_id: str):
    """Generate demo vulnerabilities for a scan."""
    vulns = [
        {
            "id": f"vuln-{uuid.uuid4().hex[:8]}",
            "title": "SQL Injection in User Query",
            "description": "Unsanitized user input directly concatenated into SQL query string, allowing arbitrary SQL execution.",
            "severity": "critical",
            "confidence": 0.97,
            "vulnerability_type": "SQL Injection",
            "cwe_id": "CWE-89",
            "file_path": "src/db/queries.py",
            "line_start": 45,
            "line_end": 52,
            "code_snippet": 'query = f"SELECT * FROM users WHERE id = {user_id}"',
            "is_exploitable": True,
            "exploitability_score": 0.95,
            "exploitability_reasoning": "User input flows directly from HTTP request parameter to SQL query without sanitization or parameterization. No WAF or input validation detected.",
            "risk_score": 97,
            "attack_vector": "Network",
            "status": "open",
            "remediation": "Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))",
            "patch_diff": '- query = f"SELECT * FROM users WHERE id = {user_id}"\n+ query = "SELECT * FROM users WHERE id = %s"\n+ cursor.execute(query, (user_id,))',
            "threat_intel": {"epss_score": 0.85, "is_actively_exploited": True, "mitre_techniques": ["T1190"]},
        },
        {
            "id": f"vuln-{uuid.uuid4().hex[:8]}",
            "title": "Hardcoded AWS Secret Key",
            "description": "AWS secret access key found hardcoded in source file. Exposed in version control history.",
            "severity": "critical",
            "confidence": 0.99,
            "vulnerability_type": "Hardcoded Secrets",
            "cwe_id": "CWE-798",
            "file_path": "config/aws.py",
            "line_start": 12,
            "line_end": 14,
            "code_snippet": 'AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE..."',
            "is_exploitable": True,
            "exploitability_score": 0.99,
            "exploitability_reasoning": "Hardcoded credential is directly usable for AWS API authentication. No rotation mechanism detected.",
            "risk_score": 99,
            "attack_vector": "Network",
            "status": "open",
            "remediation": "Move to environment variables or AWS Secrets Manager. Rotate compromised key immediately.",
            "patch_diff": '- AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE..."\n+ AWS_SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")',
            "threat_intel": {"epss_score": 0.90, "is_actively_exploited": True, "mitre_techniques": ["T1552.001"]},
        },
        {
            "id": f"vuln-{uuid.uuid4().hex[:8]}",
            "title": "Cross-Site Scripting (Reflected XSS)",
            "description": "User-supplied search parameter reflected in HTML response without encoding.",
            "severity": "high",
            "confidence": 0.92,
            "vulnerability_type": "XSS",
            "cwe_id": "CWE-79",
            "file_path": "src/views/search.html",
            "line_start": 28,
            "line_end": 28,
            "code_snippet": '<p>Results for: {{ request.args.q | safe }}</p>',
            "is_exploitable": True,
            "exploitability_score": 0.88,
            "exploitability_reasoning": "The 'safe' filter disables Jinja2 auto-escaping, allowing script injection via the 'q' parameter.",
            "risk_score": 85,
            "attack_vector": "Network",
            "status": "open",
            "remediation": "Remove the '| safe' filter to enable auto-escaping, or use '| e' for explicit escaping.",
            "patch_diff": '- <p>Results for: {{ request.args.q | safe }}</p>\n+ <p>Results for: {{ request.args.q | e }}</p>',
            "threat_intel": {"epss_score": 0.65, "is_actively_exploited": True, "mitre_techniques": ["T1059.007"]},
        },
        {
            "id": f"vuln-{uuid.uuid4().hex[:8]}",
            "title": "Server-Side Request Forgery (SSRF)",
            "description": "URL parameter used directly in server-side HTTP request without validation.",
            "severity": "critical",
            "confidence": 0.94,
            "vulnerability_type": "SSRF",
            "cwe_id": "CWE-918",
            "file_path": "src/api/proxy.py",
            "line_start": 67,
            "line_end": 70,
            "code_snippet": 'response = requests.get(request.json["url"])',
            "is_exploitable": True,
            "exploitability_score": 0.91,
            "exploitability_reasoning": "Attacker-controlled URL used in server-side request. Can access internal services, cloud metadata endpoints (169.254.169.254), and internal network.",
            "risk_score": 94,
            "attack_vector": "Network",
            "status": "open",
            "remediation": "Implement URL allowlisting, block internal/private IP ranges, and validate URL scheme.",
            "patch_diff": '- response = requests.get(request.json["url"])\n+ validated_url = validate_external_url(request.json["url"])\n+ response = requests.get(validated_url, timeout=10)',
            "threat_intel": {"epss_score": 0.72, "is_actively_exploited": True, "mitre_techniques": ["T1190"]},
        },
        {
            "id": f"vuln-{uuid.uuid4().hex[:8]}",
            "title": "Insecure JWT Verification",
            "description": "JWT token verification allows 'none' algorithm, enabling token forgery.",
            "severity": "high",
            "confidence": 0.96,
            "vulnerability_type": "Insecure JWT",
            "cwe_id": "CWE-347",
            "file_path": "src/auth/token.py",
            "line_start": 23,
            "line_end": 25,
            "code_snippet": 'decoded = jwt.decode(token, options={"verify_signature": False})',
            "is_exploitable": True,
            "exploitability_score": 0.93,
            "exploitability_reasoning": "Signature verification is explicitly disabled, allowing any attacker to forge valid JWT tokens with arbitrary claims.",
            "risk_score": 92,
            "attack_vector": "Network",
            "status": "open",
            "remediation": "Enable signature verification and specify allowed algorithms.",
            "patch_diff": '- decoded = jwt.decode(token, options={"verify_signature": False})\n+ decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])',
            "threat_intel": {"epss_score": 0.45, "is_actively_exploited": False, "mitre_techniques": ["T1550.001"]},
        },
    ]
    return vulns
