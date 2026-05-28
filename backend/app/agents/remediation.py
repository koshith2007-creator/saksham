"""SAKSHAM — Remediation Agent: AI-powered secure patch generation."""

import time
import asyncio
from typing import List, Dict, Any

from app.core.ai_router import ai_router
from app.core.git_ops import detect_language
from app.utils.logger import ScanLogger


class RemediationAgent:
    """Agent that generates production-safe remediation patches for vulnerabilities."""

    def __init__(self):
        self.name = "Remediation"

    async def analyze(
        self,
        findings: List[Dict[str, Any]],
        scan_logger: ScanLogger,
    ) -> Dict[str, Any]:
        """Generate remediation patches for each finding."""
        start = time.time()
        scan_logger.agent_start(self.name, f"Generating remediation patches for {len(findings)} findings")

        remediated = []
        patches_generated = 0

        for finding in findings:
            language = detect_language(finding.get("file_path", "unknown.py"))

            try:
                result = await ai_router.generate_remediation(finding, language)

                finding["remediation"] = result.get("fix_description", finding.get("remediation", ""))
                finding["patch_diff"] = result.get("patch_diff", finding.get("patch_diff", ""))
                finding["remediation_explanation"] = result.get("explanation", "")
                finding["remediation_confidence"] = result.get("confidence", 0.0)

                if finding["patch_diff"]:
                    patches_generated += 1

            except Exception as e:
                # Keep any existing remediation data
                finding["remediation_explanation"] = f"Auto-generation failed: {e}"
                finding["remediation_confidence"] = 0.0

            remediated.append(finding)

            # Brief pause between API calls
            await asyncio.sleep(0.05)

        elapsed_ms = int((time.time() - start) * 1000)
        scan_logger.agent_complete(
            self.name,
            f"Generated {patches_generated} remediation patches",
            elapsed_ms,
        )

        return {
            "remediated_findings": remediated,
            "patches_generated": patches_generated,
            "duration_ms": elapsed_ms,
        }


# Singleton
remediation_agent = RemediationAgent()
