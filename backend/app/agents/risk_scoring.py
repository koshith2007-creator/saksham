"""SAKSHAM — Risk Scoring Agent: Contextual risk score computation."""

import time
from typing import List, Dict, Any

from app.utils.logger import ScanLogger


class RiskScoringAgent:
    """
    Agent that computes contextual risk scores combining:
    - Severity
    - Exploitability
    - Threat intelligence
    - Code exposure (file type, entry point proximity)
    """

    def __init__(self):
        self.name = "Risk Scoring"

    async def analyze(
        self,
        findings: List[Dict[str, Any]],
        scan_logger: ScanLogger,
    ) -> Dict[str, Any]:
        """Compute risk scores for all findings."""
        start = time.time()
        scan_logger.agent_start(self.name, f"Computing risk scores for {len(findings)} findings")

        scored = []
        for finding in findings:
            risk_score = self._compute_risk(finding)
            finding["risk_score"] = risk_score
            finding["risk_breakdown"] = self._get_breakdown(finding)
            scored.append(finding)

        # Sort by risk score (highest first)
        scored.sort(key=lambda f: f.get("risk_score", 0), reverse=True)

        # Categorize
        critical = [f for f in scored if f["risk_score"] >= 85]
        high = [f for f in scored if 65 <= f["risk_score"] < 85]
        medium = [f for f in scored if 40 <= f["risk_score"] < 65]
        low = [f for f in scored if f["risk_score"] < 40]

        elapsed_ms = int((time.time() - start) * 1000)
        scan_logger.agent_complete(
            self.name,
            f"Scored: {len(critical)} critical, {len(high)} high, {len(medium)} medium, {len(low)} low",
            elapsed_ms,
        )

        return {
            "scored_findings": scored,
            "risk_summary": {
                "critical": len(critical),
                "high": len(high),
                "medium": len(medium),
                "low": len(low),
            },
            "duration_ms": elapsed_ms,
        }

    def _compute_risk(self, finding: Dict[str, Any]) -> float:
        """
        Compute composite risk score (0-100) from multiple factors.
        Formula: weighted average of severity, exploitability, threat intel, and confidence.
        """
        # Factor 1: Severity (weight: 30%)
        severity_scores = {"critical": 100, "high": 75, "medium": 50, "low": 25, "info": 10}
        severity_score = severity_scores.get(finding.get("severity", "medium"), 50)

        # Factor 2: Exploitability (weight: 30%)
        exploitability = finding.get("exploitability_score", 0.5) * 100

        # Factor 3: Threat Intelligence (weight: 25%)
        threat = finding.get("threat_intel", {})
        threat_score = 0
        if threat.get("is_actively_exploited"):
            threat_score += 40
        if threat.get("ransomware_associated"):
            threat_score += 25
        epss = threat.get("epss_score", 0.1)
        threat_score += epss * 35

        # Factor 4: Confidence (weight: 15%)
        confidence = finding.get("confidence", 0.5) * 100

        # Weighted composite
        risk = (
            severity_score * 0.30
            + exploitability * 0.30
            + threat_score * 0.25
            + confidence * 0.15
        )

        return round(min(100, max(0, risk)), 1)

    def _get_breakdown(self, finding: Dict[str, Any]) -> Dict[str, float]:
        """Get risk score breakdown by factor."""
        severity_scores = {"critical": 100, "high": 75, "medium": 50, "low": 25, "info": 10}
        threat = finding.get("threat_intel", {})

        return {
            "severity_factor": severity_scores.get(finding.get("severity", "medium"), 50),
            "exploitability_factor": finding.get("exploitability_score", 0.5) * 100,
            "threat_factor": (40 if threat.get("is_actively_exploited") else 0) + threat.get("epss_score", 0.1) * 35,
            "confidence_factor": finding.get("confidence", 0.5) * 100,
        }


# Singleton
risk_scoring_agent = RiskScoringAgent()
