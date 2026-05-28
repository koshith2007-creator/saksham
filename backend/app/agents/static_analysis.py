"""SAKSHAM — Static Analysis Agent: Deep code scanning for vulnerabilities."""

import time
import asyncio
from typing import List, Dict, Any

from app.core.scanner import scan_file, scan_dependencies
from app.core.git_ops import scan_file_tree, read_file_content, detect_language, SCANNABLE_EXTENSIONS
from app.core.ai_router import ai_router
from app.utils.logger import ScanLogger
from pathlib import Path


class StaticAnalysisAgent:
    """
    Agent that performs deep static analysis on repository code.
    Combines pattern-based scanning with AI-powered analysis.
    """

    def __init__(self):
        self.name = "Static Analysis"

    async def analyze(
        self,
        repo_path: str,
        scan_logger: ScanLogger,
        use_ai: bool = True,
    ) -> Dict[str, Any]:
        """
        Run static analysis on a cloned repository.
        Returns findings and file metadata.
        """
        start = time.time()
        scan_logger.agent_start(self.name, "Starting deep code analysis")

        # 1. Scan the file tree
        tree_info = scan_file_tree(repo_path)
        files = tree_info["files"]
        scan_logger.agent_start(self.name, f"Scanning {len(files)} files ({tree_info['total_lines']} LOC)")

        all_findings: List[Dict[str, Any]] = []
        files_scanned = 0

        # 2. Pattern-based scanning for each file
        for file_info in files:
            rel_path = file_info["path"]
            language = file_info["language"]

            content = read_file_content(repo_path, rel_path)
            if not content or len(content) < 10:
                continue

            # Run pattern-based scanner
            findings = scan_file(rel_path, content, language)
            all_findings.extend(findings)
            files_scanned += 1

        scan_logger.agent_start(self.name, f"Pattern scan found {len(all_findings)} potential issues in {files_scanned} files")

        # 3. Scan dependency files
        dep_findings: List[Dict[str, Any]] = []
        for dep_file in tree_info.get("dependency_files", []):
            content = read_file_content(repo_path, dep_file)
            if content:
                dep_vulns = scan_dependencies(dep_file, content)
                dep_findings.extend(dep_vulns)

        all_findings.extend(dep_findings)
        if dep_findings:
            scan_logger.agent_start(self.name, f"Found {len(dep_findings)} vulnerable dependencies")

        # 4. AI-enhanced analysis on critical files (top priority files)
        ai_findings: List[Dict[str, Any]] = []
        if use_ai:
            sensitive_files = tree_info.get("sensitive_files", [])
            priority_files = sensitive_files[:5]  # Limit AI calls

            for rel_path in priority_files:
                content = read_file_content(repo_path, rel_path)
                if not content or len(content) < 20:
                    continue
                language = detect_language(rel_path)
                try:
                    ai_results = await ai_router.analyze_code(rel_path, content, language)
                    if isinstance(ai_results, list):
                        for r in ai_results:
                            r["file_path"] = rel_path
                            r["source"] = "ai_analysis"
                        ai_findings.extend(ai_results)
                except Exception as e:
                    scan_logger.agent_error(self.name, f"AI analysis failed for {rel_path}: {e}")

            if ai_findings:
                scan_logger.agent_start(self.name, f"AI analysis found {len(ai_findings)} additional issues")
            all_findings.extend(ai_findings)

        # 5. Deduplicate findings by file+line+type
        deduped = self._deduplicate(all_findings)

        elapsed_ms = int((time.time() - start) * 1000)
        scan_logger.agent_complete(self.name, f"Completed: {len(deduped)} unique findings from {files_scanned} files", elapsed_ms)

        return {
            "findings": deduped,
            "files_scanned": files_scanned,
            "total_lines": tree_info["total_lines"],
            "language_breakdown": tree_info["language_breakdown"],
            "dependency_files": tree_info.get("dependency_files", []),
            "sensitive_files": tree_info.get("sensitive_files", []),
            "duration_ms": elapsed_ms,
        }

    def _deduplicate(self, findings: List[Dict]) -> List[Dict]:
        """Remove duplicate findings based on file + line + type."""
        seen = set()
        unique = []
        for f in findings:
            key = (f.get("file_path", ""), f.get("line_start", 0), f.get("vulnerability_type", ""))
            if key not in seen:
                seen.add(key)
                unique.append(f)
        return unique


# Singleton
static_analysis_agent = StaticAnalysisAgent()
