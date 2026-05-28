"""SAKSHAM - AI Chat Routes."""

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.ai_router import ai_router

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    repository_id: str = ""


@router.post("/")
async def send_message(msg: ChatMessage):
    prompt = f"""You are SAKSHAM's cybersecurity assistant.

Answer the user's security engineering question using real model reasoning.
If you do not have repository context, say what context is missing and give general guidance.

Repository ID: {msg.repository_id or "not provided"}
User question:
{msg.message}
"""
    try:
        content = await ai_router.route(
            task_type="chat",
            prompt=prompt,
            temperature=0.2,
            max_tokens=2048,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI service unavailable. Gemini failed or is not configured, "
                f"and Hugging Face backup is unavailable: {exc}"
            ),
        ) from exc

    return {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/sessions")
async def list_sessions():
    return {"sessions": []}
