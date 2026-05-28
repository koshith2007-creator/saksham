"""SAKSHAM — Dependency Security Agent: Supply chain vulnerability scanning."""

import time
from typing import List, Dict, Any

from app.core.scanner import scan_dependencies
from app.core.git_ops import read_file_content
from app.utils.logger import ScanLogger


class DependencySecurityAgent:
    """Agent that scans project dependencies for known vulnerabilities."""

    def __init__(self):
        self.name = "Dependency Security"

    async def analyze(
        self,
        repo_path: str,
        dependency_files: List[str],
        scan_logger: ScanLogger,
    ) -> Dict[str, Any]:
        """Scan dependency files for known vulnerable packages."""
        start = time.time()
        scan_logger.agent_start(self.name, f"Analyzing {len(dependency_files)} dependency files")

        all_findings: List[Dict[str, Any]] = []
        packages_scanned = 0

        for dep_file in dependency_files:
            content = read_file_content(repo_path, dep_file)
            if not content:
                continue

            findings = scan_dependencies(dep_file, content)
            all_findings.extend(findings)

            # Count packages
            if dep_file.endswith(".txt"):
                packages_scanned += len([l for l in content.split("\n") if l.strip() and not l.startswith("#")])
            elif dep_file.endswith(".json"):
                import json
                try:
                    data = json.loads(content)
                    packages_scanned += len(data.get("dependencies", {}))
                    packages_scanned += len(data.get("devDependencies", {}))
                except Exception:
                    pass

        elapsed_ms = int((time.time() - start) * 1000)
        scan_logger.agent_complete(
            self.name,
            f"Scanned {packages_scanned} packages, found {len(all_findings)} vulnerable",
            elapsed_ms,
        )

        return {
            "findings": all_findings,
            "packages_scanned": packages_scanned,
            "vulnerable_packages": len(all_findings),
            "dependency_files_checked": len(dependency_files),
            "duration_ms": elapsed_ms,
        }


# Singleton
dependency_security_agent = DependencySecurityAgent()
