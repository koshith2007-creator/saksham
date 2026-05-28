"""SAKSHAM - Dashboard routes backed by live scan data."""

from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from statistics import mean

from fastapi import APIRouter

from app.db import queries as db
from app.db.supabase_client import supabase_client

router = APIRouter()


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _repo_label(scan: dict) -> str:
    return scan.get("repository_name") or (scan.get("repository_url") or "Unknown repository").rstrip("/").split("/")[-1]


def _duration_label(scan: dict) -> str:
    duration = scan.get("duration_seconds")
    if duration is None:
        return "pending"
    return f"{round(float(duration), 1)}s"


def _security_score(severity_counts: Counter) -> int:
    penalty = (
        severity_counts["critical"] * 15
        + severity_counts["high"] * 8
        + severity_counts["medium"] * 3
        + severity_counts["low"]
    )
    return max(0, min(100, 100 - penalty))


async def _dashboard_data() -> dict:
    scans = await db.list_scan_sessions(limit=500)
    repositories = await db.list_repositories()
    vulnerabilities = await supabase_client.select("vulnerabilities", limit=1000)
    agent_logs = await supabase_client.select("agent_logs", limit=100)

    severity_counts = Counter((v.get("severity") or "info").lower() for v in vulnerabilities)
    active_scans = [scan for scan in scans if scan.get("status") not in {"completed", "failed"}]
    completed_durations = [
        float(scan["duration_seconds"])
        for scan in scans
        if isinstance(scan.get("duration_seconds"), (int, float))
    ]

    today = datetime.now(timezone.utc).date()
    trend_days = [today - timedelta(days=29 - index) for index in range(30)]
    trend_counts = {day: Counter() for day in trend_days}
    for vuln in vulnerabilities:
        created = _parse_datetime(vuln.get("created_at"))
        if created and created.date() in trend_counts:
            trend_counts[created.date()][(vuln.get("severity") or "info").lower()] += 1

    vulnerability_trends = [
        {
            "date": day.isoformat(),
            "critical": trend_counts[day]["critical"],
            "high": trend_counts[day]["high"],
            "medium": trend_counts[day]["medium"],
            "low": trend_counts[day]["low"],
        }
        for day in trend_days
    ]

    type_counts = Counter(v.get("vulnerability_type") or "Unknown" for v in vulnerabilities)
    top_vulnerability_types = [
        {
            "type": vuln_type,
            "count": count,
            "severity": next(
                (v.get("severity") or "info" for v in vulnerabilities if (v.get("vulnerability_type") or "Unknown") == vuln_type),
                "info",
            ),
        }
        for vuln_type, count in type_counts.most_common(8)
    ]

    heatmap_counts: dict[str, Counter] = defaultdict(Counter)
    for vuln in vulnerabilities:
        category = vuln.get("vulnerability_type") or "Unknown"
        if vuln.get("is_exploitable"):
            heatmap_counts[category]["exploitable"] += 1
        else:
            heatmap_counts[category]["not_exploitable"] += 1

    exploitability_heatmap = []
    for category, counts in heatmap_counts.items():
        total = counts["exploitable"] + counts["not_exploitable"]
        exploitability_heatmap.append(
            {
                "category": category,
                "exploitable": counts["exploitable"],
                "not_exploitable": counts["not_exploitable"],
                "rate": round(counts["exploitable"] / total, 2) if total else 0,
            }
        )

    recent_scans = sorted(
        scans,
        key=lambda scan: _parse_datetime(scan.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:5]

    recent_agent_logs = sorted(
        agent_logs,
        key=lambda log: _parse_datetime(log.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:10]

    return {
        "stats": {
            "total_scans": len(scans),
            "active_scans": len(active_scans),
            "total_repositories": len(repositories),
            "total_vulnerabilities": len(vulnerabilities),
            "critical_threats": severity_counts["critical"],
            "high_threats": severity_counts["high"],
            "medium_threats": severity_counts["medium"],
            "low_threats": severity_counts["low"],
            "false_positives_prevented": sum(1 for v in vulnerabilities if v.get("is_false_positive")),
            "remediations_generated": sum(1 for v in vulnerabilities if v.get("remediation") or v.get("patch_diff")),
            "avg_scan_time_seconds": round(mean(completed_durations), 2) if completed_durations else 0,
            "security_score": _security_score(severity_counts),
        },
        "vulnerability_trends": vulnerability_trends,
        "severity_distribution": {
            "critical": severity_counts["critical"],
            "high": severity_counts["high"],
            "medium": severity_counts["medium"],
            "low": severity_counts["low"],
            "info": severity_counts["info"],
        },
        "top_vulnerability_types": top_vulnerability_types,
        "recent_scans": [
            {
                "id": scan.get("id"),
                "repository": _repo_label(scan),
                "status": scan.get("status"),
                "vulnerabilities": scan.get("total_vulnerabilities") or 0,
                "critical": scan.get("critical_count") or 0,
                "duration": _duration_label(scan),
                "completed_at": scan.get("completed_at"),
            }
            for scan in recent_scans
        ],
        "agent_activity": [
            {
                "id": log.get("id"),
                "agent": log.get("agent_name") or "Unknown",
                "action": log.get("action") or "",
                "status": log.get("status") or "unknown",
                "timestamp": log.get("created_at"),
            }
            for log in recent_agent_logs
        ],
        "exploitability_heatmap": exploitability_heatmap,
    }


@router.get("/stats")
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics."""
    return await _dashboard_data()


@router.get("/activity")
async def get_agent_activity():
    """Get recent agent activity feed."""
    data = await _dashboard_data()
    return {"activity": data["agent_activity"]}


@router.get("/trends")
async def get_vulnerability_trends():
    """Get vulnerability trends over time."""
    data = await _dashboard_data()
    return {"trends": data["vulnerability_trends"]}
