"""SAKSHAM - Hugging Face Inference Providers fallback client."""

import asyncio
import time
from typing import Any

import httpx

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("huggingface")


class HuggingFaceClient:
    """OpenAI-compatible Hugging Face chat completions client."""

    def __init__(self):
        self.api_token = settings.HUGGINGFACE_API_TOKEN
        self.model = settings.HUGGINGFACE_MODEL
        self.base_url = "https://router.huggingface.co/v1/chat/completions"
        self.total_requests = 0

    @property
    def configured(self) -> bool:
        return bool(self.api_token and self.model)

    async def generate(
        self,
        prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        retries: int = 2,
    ) -> str:
        """Generate text using Hugging Face as a backup provider."""
        if not self.configured:
            raise RuntimeError("Hugging Face API token or model is not configured")

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        for attempt in range(retries):
            try:
                start = time.time()
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                self.total_requests += 1
                elapsed = int((time.time() - start) * 1000)

                text = self._clean_response(self._extract_text(data).strip())
                logger.info("Hugging Face response", model=self.model, duration_ms=elapsed, length=len(text))
                return text
            except Exception as exc:
                logger.warning(f"Hugging Face attempt {attempt + 1}/{retries} failed: {exc}")
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise

        raise RuntimeError("Hugging Face generation failed")

    def _extract_text(self, data: dict[str, Any]) -> str:
        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError("Hugging Face response did not include choices")

        first_choice = choices[0]
        message = first_choice.get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content

        text = first_choice.get("text")
        if isinstance(text, str):
            return text

        raise RuntimeError("Hugging Face response did not include text")

    def _clean_response(self, text: str) -> str:
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3].strip()
        return text


huggingface_client = HuggingFaceClient()
