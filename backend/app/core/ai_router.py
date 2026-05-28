"""SAKSHAM - AI router with Gemini primary and Hugging Face fallback."""

import json
from enum import Enum
from typing import Any, Dict

from app.config import settings
from app.core.gemini_client import PROMPTS, gemini_client
from app.core.huggingface_client import huggingface_client
from app.utils.logger import get_logger

logger = get_logger("ai_router")


class TaskComplexity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ModelProvider(str, Enum):
    GEMINI = "gemini"
    HUGGINGFACE = "huggingface"
    MOCK = "mock"


ROUTING_TABLE = {
    "static_analysis": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.HIGH},
    "exploitability": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.CRITICAL},
    "remediation": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.HIGH},
    "repo_intelligence": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.MEDIUM},
    "threat_intel": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.MEDIUM},
    "risk_scoring": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.LOW},
    "dependency_check": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.LOW},
    "chat": {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.MEDIUM},
}


class AIRouter:
    """Routes AI tasks to Gemini first, Hugging Face second, mock data last."""

    def __init__(self):
        self.request_count = 0
        self.total_tokens = 0
        self.routing_stats: Dict[str, int] = {}

    async def route(
        self,
        task_type: str,
        prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> str:
        """Route a generic task to the configured provider chain."""
        route_config = ROUTING_TABLE.get(
            task_type,
            {"provider": ModelProvider.GEMINI, "complexity": TaskComplexity.MEDIUM},
        )

        provider = route_config["provider"]
        self.request_count += 1
        self.routing_stats[task_type] = self.routing_stats.get(task_type, 0) + 1

        logger.info("Routing AI task", task=task_type, provider=provider)
        return await self._generate_with_fallback(prompt, task_type, temperature, max_tokens)

    async def analyze_code(self, file_path: str, code: str, language: str = "python"):
        """Route code analysis to the provider chain."""
        prompt = PROMPTS["static_analysis"].format(file_path=file_path, language=language, code=code)
        response = await self._generate_with_fallback(prompt, "static_analysis")
        return self._parse_json(response, [])

    async def validate_exploitability(self, vuln_data: Dict, context: str = ""):
        """Route exploitability validation to the provider chain."""
        prompt = PROMPTS["exploitability"].format(
            title=vuln_data.get("title", ""),
            vuln_type=vuln_data.get("vulnerability_type", ""),
            file_path=vuln_data.get("file_path", ""),
            code_snippet=vuln_data.get("code_snippet", ""),
            context=context,
        )
        response = await self._generate_with_fallback(prompt, "exploitability")
        return self._parse_json(
            response,
            {"is_exploitable": False, "exploitability_score": 0.0, "reasoning": "Analysis failed"},
        )

    async def generate_remediation(self, vuln_data: Dict, language: str = "python"):
        """Route remediation generation to the provider chain."""
        prompt = PROMPTS["remediation"].format(
            title=vuln_data.get("title", ""),
            vuln_type=vuln_data.get("vulnerability_type", ""),
            severity=vuln_data.get("severity", "medium"),
            file_path=vuln_data.get("file_path", ""),
            language=language,
            code_snippet=vuln_data.get("code_snippet", ""),
        )
        response = await self._generate_with_fallback(prompt, "remediation")
        return self._parse_json(
            response,
            {"fix_description": "Manual review required", "patch_diff": "", "explanation": "", "confidence": 0.0},
        )

    async def analyze_repo(self, repo_name: str, file_tree: str, samples: str):
        """Route repository analysis to the provider chain."""
        prompt = PROMPTS["repo_intelligence"].format(repo_name=repo_name, file_tree=file_tree, samples=samples)
        response = await self._generate_with_fallback(prompt, "repo_intelligence")
        return self._parse_json(
            response,
            {"primary_language": "unknown", "frameworks_detected": [], "entry_points": []},
        )

    async def _generate_with_fallback(
        self,
        prompt: str,
        task_type: str,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> str:
        """Try Gemini first, Hugging Face second, then mock data."""
        if settings.GEMINI_API_KEY:
            try:
                return await gemini_client.generate(
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    fallback_to_mock=False,
                )
            except Exception as exc:
                logger.warning("Gemini failed, trying Hugging Face fallback", task=task_type, error=str(exc))

        if settings.HUGGINGFACE_API_TOKEN:
            try:
                return await huggingface_client.generate(
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            except Exception as exc:
                logger.warning("Hugging Face fallback failed, using mock response", task=task_type, error=str(exc))

        return gemini_client._mock_response(prompt)

    def _parse_json(self, response: str, fallback: Any) -> Any:
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI JSON response")
            return fallback

    def get_stats(self) -> Dict[str, Any]:
        """Get routing statistics."""
        return {
            "total_requests": self.request_count,
            "total_tokens": self.total_tokens,
            "routing_breakdown": self.routing_stats,
        }


ai_router = AIRouter()
