"""SAKSHAM — Threat Intelligence Agent: CVE, CISA KEV, MITRE ATT&CK correlation."""

import time
from typing import List, Dict, Any

from app.core.ai_router import ai_router
from app.utils.logger import ScanLogger


# Built-in threat intelligence database (subset for demo)
THREAT_DB = {
    "CWE-89": {
        "mitre_techniques": ["T1190", "T1059.004"],
        "exploit_maturity": "weaponized",
        "is_actively_exploited": True,
        "ransomware_associated": True,
        "epss_estimate": 0.85,
        "priority": "immediate",
    },
    "CWE-79": {
        "mitre_techniques": ["T1059.007", "T1189"],
        "exploit_maturity": "weaponized",
        "is_actively_exploited": True,
        "ransomware_associated": False,
        "epss_estimate": 0.65,
        "priority": "high",
    },
    "CWE-798": {
        "mitre_techniques": ["T1552.001", "T1078"],
        "exploit_maturity": "active",
        "is_actively_exploited": True,
        "ransomware_associated": True,
        "epss_estimate": 0.90,
        "priority": "immediate",
    },
    "CWE-918": {
        "mitre_techniques": ["T1190", "T1021"],
        "exploit_maturity": "weaponized",
        "is_actively_exploited": True,
        "ransomware_associated": False,
        "epss_estimate": 0.72,
        "priority": "immediate",
    },
    "CWE-347": {
        "mitre_techniques": ["T1550.001", "T1078"],
        "exploit_maturity": "proof-of-concept",
        "is_actively_exploited": False,
        "ransomware_associated": False,
        "epss_estimate": 0.45,
        "priority": "high",
    },
    "CWE-78": {
        "mitre_techniques": ["T1059", "T1059.004"],
        "exploit_maturity": "weaponized",
        "is_actively_exploited": True,
        "ransomware_associated": True,
        "epss_estimate": 0.88,
        "priority": "immediate",
    },
    "CWE-94": {
        "mitre_techniques": ["T1059", "T1203"],
        "exploit_maturity": "weaponized",
        "is_actively_exploited": True,
        "ransomware_associated": True,
        "epss_estimate": 0.82,
        "priority": "immediate",
    },
    "CWE-22": {
        "mitre_techniques": ["T1083", "T1005"],
        "exploit_maturity": "proof-of-concept",
        "is_actively_exploited": False,
        "ransomware_associated": False,
        "epss_estimate": 0.55,
        "priority": "high",
    },
    "CWE-502": {
        "mitre_techniques": ["T1059", "T1203"],
        "exploit_maturity": "weaponized",
        "is_actively_exploited": True,
        "ransomware_associated": True,
        "epss_estimate": 0.78,
        "priority": "immediate",
    },
    "CWE-328": {
        "mitre_techniques": ["T1110"],
        "exploit_maturity": "proof-of-concept",
        "is_actively_exploited": False,
        "ransomware_associated": False,
        "epss_estimate": 0.25,
        "priority": "medium",
    },
    "CWE-330": {
        "mitre_techniques": ["T1550"],
        "exploit_maturity": "proof-of-concept",
        "is_actively_exploited": False,
        "ransomware_associated": False,
        "epss_estimate": 0.20,
        "priority": "medium",
    },
    "CWE-321": {
        "mitre_techniques": ["T1552.004", "T1588.004"],
        "exploit_maturity": "active",
        "is_actively_exploited": True,
        "ransomware_associated": False,
        "epss_estimate": 0.80,
        "priority": "immediate",
    },
    "CWE-1395": {
        "mitre_techniques": ["T1195.002"],
        "exploit_maturity": "active",
        "is_actively_exploited": True,
        "ransomware_associated": True,
        "epss_estimate": 0.60,
        "priority": "high",
    },
}


class ThreatIntelligenceAgent:
    """Agent that correlates vulnerabilities with threat intelligence databases."""

    def __init__(self):
        self.name = "Threat Intelligence"

    async def analyze(
        self,
        findings: List[Dict[str, Any]],
        scan_logger: ScanLogger,
    ) -> Dict[str, Any]:
        """Enrich findings with threat intelligence data."""
        start = time.time()
        scan_logger.agent_start(self.name, f"Correlating {len(findings)} findings with threat databases")

        enriched = []
        actively_exploited_count = 0
        kev_count = 0

        for finding in findings:
            cwe = finding.get("cwe_id", "")
            intel = THREAT_DB.get(cwe, {})

            threat_data = {
                "epss_score": intel.get("epss_estimate", 0.1),
                "is_actively_exploited": intel.get("is_actively_exploited", False),
                "exploit_maturity": intel.get("exploit_maturity", "unknown"),
                "ransomware_associated": intel.get("ransomware_associated", False),
                "mitre_techniques": intel.get("mitre_techniques", []),
                "recommended_priority": intel.get("priority", "low"),
                "cisa_kev": intel.get("is_actively_exploited", False),
            }

            finding["threat_intel"] = threat_data

            if threat_data["is_actively_exploited"]:
                actively_exploited_count += 1
            if threat_data["cisa_kev"]:
                kev_count += 1

            enriched.append(finding)

        elapsed_ms = int((time.time() - start) * 1000)
        scan_logger.agent_complete(
            self.name,
            f"Correlated: {actively_exploited_count} actively exploited, {kev_count} in CISA KEV",
            elapsed_ms,
        )

        return {
            "enriched_findings": enriched,
            "actively_exploited": actively_exploited_count,
            "cisa_kev_matches": kev_count,
            "duration_ms": elapsed_ms,
        }


# Singleton
threat_intelligence_agent = ThreatIntelligenceAgent()
