"""SAKSHAM — Repository Intelligence Agent: Understands codebases."""

import time
from typing import Dict, Any

from app.core.git_ops import scan_file_tree, read_file_content
from app.core.ai_router import ai_router
from app.utils.logger import ScanLogger


class RepositoryIntelAgent:
    """Agent that analyzes repository structure, frameworks, and architecture."""

    def __init__(self):
        self.name = "Repository Intel"

    async def analyze(
        self,
        repo_path: str,
        repo_name: str,
        scan_logger: ScanLogger,
    ) -> Dict[str, Any]:
        """Analyze repository for architectural intelligence."""
        start = time.time()
        scan_logger.agent_start(self.name, f"Analyzing repository structure: {repo_name}")

        tree_info = scan_file_tree(repo_path)

        # Build file tree string
        file_tree = "\n".join([f"  {f['path']} ({f['language']}, {f['lines']} lines)" for f in tree_info["files"][:50]])

        # Read samples from key files
        sample_files = tree_info.get("sensitive_files", [])[:3] + tree_info.get("dependency_files", [])[:2]
        samples = ""
        for sf in sample_files:
            content = read_file_content(repo_path, sf)
            if content:
                samples += f"\n--- {sf} ---\n{content[:500]}\n"

        # AI analysis
        try:
            analysis = await ai_router.analyze_repo(repo_name, file_tree, samples)
        except Exception:
            analysis = {
                "primary_language": max(tree_info["language_breakdown"], key=tree_info["language_breakdown"].get) if tree_info["language_breakdown"] else "unknown",
                "frameworks_detected": [],
                "entry_points": tree_info.get("sensitive_files", []),
                "architecture_pattern": "unknown",
            }

        elapsed_ms = int((time.time() - start) * 1000)
        scan_logger.agent_complete(self.name, f"Repository analyzed: {analysis.get('primary_language', 'unknown')} project", elapsed_ms)

        return {
            "analysis": analysis,
            "file_tree": tree_info,
            "duration_ms": elapsed_ms,
        }


# Singleton
repository_intel_agent = RepositoryIntelAgent()
