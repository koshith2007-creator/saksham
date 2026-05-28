"""SAKSHAM — Orchestrator Agent: Coordinates the entire multi-agent scan pipeline."""

import time
import uuid
import asyncio
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone

from app.agents.static_analysis import static_analysis_agent
from app.agents.dependency_security import dependency_security_agent
from app.agents.exploitability import exploitability_agent
from app.agents.threat_intelligence import threat_intelligence_agent
from app.agents.risk_scoring import risk_scoring_agent
from app.agents.remediation import remediation_agent
from app.agents.repository_intel import repository_intel_agent
from app.core.git_ops import clone_repository, cleanup_clone
from app.db import queries as db
from app.utils.logger import ScanLogger, get_logger
from app.utils.redis_client import redis_client

logger = get_logger("orchestrator")


class OrchestratorAgent:
    """
    Master agent that coordinates the entire scan pipeline.
    Delegates work to specialized agents in the correct order,
    tracks progress, and aggregates results.
    """

    def __init__(self):
        self.name = "Orchestrator"
        self.active_scans: Dict[str, Dict] = {}

    async def execute_scan(
        self,
        scan_id: str,
        repository_url: str,
        branch: str = "main",
        scan_type: str = "full",
        on_progress: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        Execute a complete security scan pipeline.

        Pipeline stages:
        1. Clone repository
        2. Repository intelligence analysis
        3. Static analysis (pattern + AI)
        4. Dependency security scan
        5. Exploitability validation
        6. Threat intelligence correlation
        7. Risk scoring
        8. Remediation generation
        """
        scan_logger = ScanLogger(scan_id)
        start_time = time.time()
        repo_path = None

        self.active_scans[scan_id] = {"status": "running", "started_at": datetime.now(timezone.utc).isoformat()}

        try:
            # Update scan status
            await db.update_scan_session(scan_id, {
                "status": "cloning",
                "started_at": datetime.now(timezone.utc).isoformat(),
            })
            await self._notify_progress(scan_id, "cloning", "Cloning repository...", on_progress)

            # ============================================================
            # STAGE 1: Clone Repository
            # ============================================================
            scan_logger.agent_start(self.name, f"Initiating scan for {repository_url}")
            repo_path, clone_meta = await clone_repository(repository_url, branch)
            repo_name = clone_meta.get("repo_name", "unknown")

            scan_logger.agent_complete(self.name, f"Repository cloned: {repo_name}", 2000)
            await self._notify_progress(scan_id, "scanning", "Repository cloned. Starting analysis...", on_progress)

            await db.update_scan_session(scan_id, {
                "status": "scanning",
                "commit_sha": clone_meta.get("commit_sha"),
            })

            # ============================================================
            # STAGE 2: Repository Intelligence
            # ============================================================
            await self._notify_progress(scan_id, "scanning", "Analyzing repository structure...", on_progress)
            repo_intel = await repository_intel_agent.analyze(repo_path, repo_name, scan_logger)

            # ============================================================
            # STAGE 3: Static Analysis
            # ============================================================
            await self._notify_progress(scan_id, "scanning", "Running deep static analysis...", on_progress)
            static_results = await static_analysis_agent.analyze(repo_path, scan_logger, use_ai=True)

            findings = static_results["findings"]

            # ============================================================
            # STAGE 4: Dependency Security
            # ============================================================
            await self._notify_progress(scan_id, "scanning", "Scanning dependencies...", on_progress)
            dep_results = await dependency_security_agent.analyze(
                repo_path,
                static_results.get("dependency_files", []),
                scan_logger,
            )

            # Merge dependency findings (avoid duplicates with static analysis)
            existing_types = {(f.get("file_path"), f.get("vulnerability_type")) for f in findings}
            for dep_finding in dep_results["findings"]:
                key = (dep_finding.get("file_path"), dep_finding.get("vulnerability_type"))
                if key not in existing_types:
                    findings.append(dep_finding)

            await db.update_scan_session(scan_id, {"status": "analyzing"})
            await self._notify_progress(scan_id, "analyzing", f"Validating {len(findings)} findings...", on_progress)

            # ============================================================
            # STAGE 5: Exploitability Validation
            # ============================================================
            exploit_results = await exploitability_agent.analyze(findings, repo_path, scan_logger)
            validated_findings = exploit_results["validated_findings"]

            # ============================================================
            # STAGE 6: Threat Intelligence
            # ============================================================
            await self._notify_progress(scan_id, "analyzing", "Correlating with threat databases...", on_progress)
            threat_results = await threat_intelligence_agent.analyze(validated_findings, scan_logger)
            enriched_findings = threat_results["enriched_findings"]

            # ============================================================
            # STAGE 7: Risk Scoring
            # ============================================================
            await self._notify_progress(scan_id, "analyzing", "Computing risk scores...", on_progress)
            risk_results = await risk_scoring_agent.analyze(enriched_findings, scan_logger)
            scored_findings = risk_results["scored_findings"]

            # ============================================================
            # STAGE 8: Remediation Generation
            # ============================================================
            await self._notify_progress(scan_id, "analyzing", "Generating remediation patches...", on_progress)
            remediation_results = await remediation_agent.analyze(scored_findings, scan_logger)
            final_findings = remediation_results["remediated_findings"]

            # ============================================================
            # FINALIZE: Compute Summary & Store Results
            # ============================================================
            total_duration = time.time() - start_time
            severity_counts = self._count_severities(final_findings)

            # Assign severity based on risk score for final categorization
            for f in final_findings:
                score = f.get("risk_score", 0)
                if score >= 85:
                    f["severity"] = "critical"
                elif score >= 65:
                    f["severity"] = "high"
                elif score >= 40:
                    f["severity"] = "medium"
                else:
                    f["severity"] = "low"

            severity_counts = self._count_severities(final_findings)

            # Store vulnerabilities in database
            for finding in final_findings:
                finding["scan_id"] = scan_id
                finding["id"] = str(uuid.uuid4())
                await db.create_vulnerability(finding)

            # Store agent logs
            for event in scan_logger.get_events():
                event["scan_id"] = scan_id
                await db.create_agent_log(event)

            # Update scan session with final results
            await db.update_scan_session(scan_id, {
                "status": "completed",
                "total_vulnerabilities": len(final_findings),
                "critical_count": severity_counts["critical"],
                "high_count": severity_counts["high"],
                "medium_count": severity_counts["medium"],
                "low_count": severity_counts["low"],
                "files_scanned": static_results.get("files_scanned", 0),
                "duration_seconds": round(total_duration, 2),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "agent_logs": scan_logger.get_events(),
            })

            # Cache results for quick access
            await redis_client.cache_scan_progress(scan_id, {
                "status": "completed",
                "total_vulnerabilities": len(final_findings),
                "severity_counts": severity_counts,
                "duration_seconds": round(total_duration, 2),
            })

            scan_logger.agent_complete(
                self.name,
                f"Scan complete: {len(final_findings)} vulnerabilities ({severity_counts['critical']} critical)",
                int(total_duration * 1000),
            )

            await self._notify_progress(scan_id, "completed", "Scan completed!", on_progress)

            result = {
                "scan_id": scan_id,
                "status": "completed",
                "repository_url": repository_url,
                "repository_name": repo_name,
                "vulnerabilities": final_findings,
                "total_vulnerabilities": len(final_findings),
                "severity_counts": severity_counts,
                "files_scanned": static_results.get("files_scanned", 0),
                "total_lines": static_results.get("total_lines", 0),
                "language_breakdown": static_results.get("language_breakdown", {}),
                "false_positives_eliminated": exploit_results.get("false_positives_eliminated", 0),
                "patches_generated": remediation_results.get("patches_generated", 0),
                "actively_exploited_cves": threat_results.get("actively_exploited", 0),
                "duration_seconds": round(total_duration, 2),
                "agent_logs": scan_logger.get_events(),
                "repo_intelligence": repo_intel.get("analysis", {}),
            }

            self.active_scans[scan_id] = {"status": "completed"}
            return result

        except Exception as e:
            elapsed = time.time() - start_time
            scan_logger.agent_error(self.name, f"Scan failed: {str(e)}")

            await db.update_scan_session(scan_id, {
                "status": "failed",
                "duration_seconds": round(elapsed, 2),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "agent_logs": scan_logger.get_events(),
            })

            await self._notify_progress(scan_id, "failed", f"Scan failed: {str(e)}", on_progress)
            self.active_scans[scan_id] = {"status": "failed", "error": str(e)}

            return {
                "scan_id": scan_id,
                "status": "failed",
                "error": str(e),
                "agent_logs": scan_logger.get_events(),
                "duration_seconds": round(elapsed, 2),
            }

        finally:
            # Cleanup cloned repository
            if repo_path:
                cleanup_clone(repo_path)

    def _count_severities(self, findings: list) -> Dict[str, int]:
        """Count findings by severity."""
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for f in findings:
            sev = f.get("severity", "low")
            counts[sev] = counts.get(sev, 0) + 1
        return counts

    async def _notify_progress(self, scan_id: str, stage: str, message: str, callback: Optional[Callable]):
        """Send progress notification."""
        progress = {
            "scan_id": scan_id,
            "stage": stage,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await redis_client.cache_scan_progress(scan_id, progress)
        if callback:
            try:
                await callback(progress)
            except Exception:
                pass

    def get_active_scans(self) -> Dict[str, Dict]:
        """Get currently active scans."""
        return self.active_scans


# Singleton
orchestrator = OrchestratorAgent()
