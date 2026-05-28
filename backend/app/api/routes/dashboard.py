"""SAKSHAM — Dashboard Routes: Stats, metrics, and analytics for the main dashboard."""

from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import random
import uuid

router = APIRouter()


# ============================================================
# Demo Data Generators
# ============================================================
def generate_demo_dashboard():
    """Generate realistic demo dashboard data."""
    return {
        "stats": {
            "total_scans": 247,
            "active_scans": 3,
            "total_repositories": 18,
            "total_vulnerabilities": 1342,
            "critical_threats": 23,
            "high_threats": 67,
            "medium_threats": 189,
            "low_threats": 412,
            "false_positives_prevented": 891,
            "remediations_generated": 156,
            "avg_scan_time_seconds": 42.7,
            "security_score": 73,
        },
        "vulnerability_trends": [
            {"date": (datetime.now(timezone.utc) - timedelta(days=30-i)).strftime("%Y-%m-%d"),
             "critical": max(0, 8 - i // 5 + random.randint(-2, 2)),
             "high": max(0, 15 - i // 4 + random.randint(-3, 3)),
             "medium": max(0, 25 + random.randint(-5, 5)),
             "low": max(0, 40 + random.randint(-8, 8))}
            for i in range(30)
        ],
        "severity_distribution": {
            "critical": 23,
            "high": 67,
            "medium": 189,
            "low": 412,
            "info": 651,
        },
        "top_vulnerability_types": [
            {"type": "SQL Injection", "count": 34, "severity": "critical"},
            {"type": "Cross-Site Scripting (XSS)", "count": 78, "severity": "high"},
            {"type": "Hardcoded Secrets", "count": 45, "severity": "high"},
            {"type": "Insecure Deserialization", "count": 12, "severity": "critical"},
            {"type": "Path Traversal", "count": 29, "severity": "medium"},
            {"type": "SSRF", "count": 8, "severity": "critical"},
            {"type": "Command Injection", "count": 15, "severity": "critical"},
            {"type": "Insecure JWT", "count": 23, "severity": "high"},
        ],
        "recent_scans": [
            {
                "id": str(uuid.uuid4()),
                "repository": "acme-corp/payment-service",
                "status": "completed",
                "vulnerabilities": 12,
                "critical": 2,
                "duration": "34s",
                "completed_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "repository": "acme-corp/auth-gateway",
                "status": "scanning",
                "vulnerabilities": 0,
                "critical": 0,
                "duration": "...",
                "completed_at": None,
            },
            {
                "id": str(uuid.uuid4()),
                "repository": "acme-corp/user-api",
                "status": "completed",
                "vulnerabilities": 8,
                "critical": 1,
                "duration": "28s",
                "completed_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "repository": "acme-corp/frontend-app",
                "status": "completed",
                "vulnerabilities": 23,
                "critical": 0,
                "duration": "56s",
                "completed_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "repository": "acme-corp/data-pipeline",
                "status": "completed",
                "vulnerabilities": 5,
                "critical": 3,
                "duration": "41s",
                "completed_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
            },
        ],
        "agent_activity": [
            {
                "id": str(uuid.uuid4()),
                "agent": "Orchestrator",
                "action": "Coordinating scan for payment-service",
                "status": "running",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "agent": "Static Analysis",
                "action": "Analyzing auth-gateway: 234/567 files scanned",
                "status": "running",
                "timestamp": (datetime.now(timezone.utc) - timedelta(seconds=12)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "agent": "Exploitability",
                "action": "Validated SQL injection in user-api/db/queries.py",
                "status": "completed",
                "timestamp": (datetime.now(timezone.utc) - timedelta(seconds=30)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "agent": "Threat Intel",
                "action": "Correlated CVE-2026-1234 with CISA KEV",
                "status": "completed",
                "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "agent": "Remediation",
                "action": "Generated secure patch for XSS vulnerability",
                "status": "completed",
                "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=2)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "agent": "Risk Scoring",
                "action": "Computed contextual risk for 12 vulnerabilities",
                "status": "completed",
                "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=3)).isoformat(),
            },
        ],
        "exploitability_heatmap": [
            {"category": "Injection", "exploitable": 18, "not_exploitable": 45, "rate": 0.29},
            {"category": "XSS", "exploitable": 12, "not_exploitable": 66, "rate": 0.15},
            {"category": "Auth Bypass", "exploitable": 8, "not_exploitable": 14, "rate": 0.36},
            {"category": "Crypto", "exploitable": 3, "not_exploitable": 32, "rate": 0.09},
            {"category": "SSRF/RCE", "exploitable": 6, "not_exploitable": 5, "rate": 0.55},
            {"category": "Secrets", "exploitable": 34, "not_exploitable": 11, "rate": 0.76},
        ],
    }


@router.get("/stats")
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics."""
    return generate_demo_dashboard()


@router.get("/activity")
async def get_agent_activity():
    """Get recent agent activity feed."""
    data = generate_demo_dashboard()
    return {"activity": data["agent_activity"]}


@router.get("/trends")
async def get_vulnerability_trends():
    """Get vulnerability trends over time."""
    data = generate_demo_dashboard()
    return {"trends": data["vulnerability_trends"]}
