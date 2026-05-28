"""SAKSHAM — Database query helpers for common operations."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.db.supabase_client import supabase_client as db
from app.utils.logger import get_logger

logger = get_logger("queries")


VULNERABILITY_COLUMNS = {
    "id",
    "scan_id",
    "repository_id",
    "title",
    "description",
    "severity",
    "confidence",
    "vulnerability_type",
    "cwe_id",
    "cve_id",
    "owasp_category",
    "file_path",
    "line_start",
    "line_end",
    "code_snippet",
    "is_exploitable",
    "exploitability_score",
    "exploitability_reasoning",
    "is_false_positive",
    "attack_vector",
    "attack_chain",
    "remediation",
    "patch_diff",
    "risk_score",
    "threat_intel",
    "status",
    "metadata",
}


# ============================================================
# Scan Session Queries
# ============================================================
async def create_scan_session(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    return await db.insert("scan_sessions", scan_data)


async def update_scan_session(scan_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    return await db.update("scan_sessions", scan_id, data)


async def get_scan_session(scan_id: str) -> Optional[Dict]:
    return await db.get_by_id("scan_sessions", scan_id)


async def list_scan_sessions(user_id: Optional[str] = None, limit: int = 50) -> List[Dict]:
    filters = {"user_id": user_id} if user_id else None
    return await db.select("scan_sessions", filters, limit)


# ============================================================
# Vulnerability Queries
# ============================================================
async def create_vulnerability(vuln_data: Dict[str, Any]) -> Dict[str, Any]:
    clean_data = {key: value for key, value in vuln_data.items() if key in VULNERABILITY_COLUMNS}
    clean_data.setdefault("metadata", {})
    for key, value in vuln_data.items():
        if key not in VULNERABILITY_COLUMNS:
            clean_data["metadata"][key] = value
    return await db.insert("vulnerabilities", clean_data)


async def create_vulnerabilities_batch(vulns: List[Dict[str, Any]]) -> List[Dict]:
    results = []
    for v in vulns:
        results.append(await db.insert("vulnerabilities", v))
    return results


async def get_vulnerabilities_by_scan(scan_id: str) -> List[Dict]:
    return await db.select("vulnerabilities", {"scan_id": scan_id}, limit=500)


async def get_vulnerability(vuln_id: str) -> Optional[Dict]:
    return await db.get_by_id("vulnerabilities", vuln_id)


async def update_vulnerability(vuln_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    return await db.update("vulnerabilities", vuln_id, data)


# ============================================================
# Repository Queries
# ============================================================
async def create_repository(repo_data: Dict[str, Any]) -> Dict[str, Any]:
    return await db.insert("repositories", repo_data)


async def get_repository(repo_id: str) -> Optional[Dict]:
    return await db.get_by_id("repositories", repo_id)


async def list_repositories(user_id: Optional[str] = None) -> List[Dict]:
    filters = {"user_id": user_id} if user_id else None
    return await db.select("repositories", filters)


async def update_repository(repo_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    return await db.update("repositories", repo_id, data)


# ============================================================
# Agent Log Queries
# ============================================================
async def create_agent_log(log_data: Dict[str, Any]) -> Dict[str, Any]:
    clean_data = {
        "scan_id": log_data.get("scan_id"),
        "agent_name": log_data.get("agent_name") or log_data.get("agent", "Unknown"),
        "action": log_data.get("action"),
        "status": log_data.get("status"),
        "duration_ms": log_data.get("duration_ms"),
        "metadata": {
            key: value
            for key, value in log_data.items()
            if key not in {"scan_id", "agent_name", "agent", "action", "status", "duration_ms"}
        },
    }
    return await db.insert("agent_logs", clean_data)


async def get_agent_logs_by_scan(scan_id: str) -> List[Dict]:
    return await db.select("agent_logs", {"scan_id": scan_id}, limit=200)


# ============================================================
# Notification Queries
# ============================================================
async def create_notification(notif_data: Dict[str, Any]) -> Dict[str, Any]:
    return await db.insert("notifications", notif_data)


async def get_notifications(user_id: str, unread_only: bool = False) -> List[Dict]:
    filters: Dict[str, Any] = {"user_id": user_id}
    if unread_only:
        filters["read"] = False
    return await db.select("notifications", filters, limit=50)
