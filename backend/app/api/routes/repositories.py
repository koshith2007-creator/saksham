"""SAKSHAM - Repository routes backed by Supabase."""

from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.api.routes.auth import verify_token
from app.db import queries as db

router = APIRouter()


class AddRepoRequest(BaseModel):
    url: str
    name: Optional[str] = None


def _require_user_id(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return user_id


@router.get("/")
async def list_repositories():
    repositories = await db.list_repositories()
    return {"repositories": repositories}


@router.post("/")
async def add_repository(request: AddRepoRequest, authorization: Optional[str] = Header(default=None)):
    user_id = _require_user_id(authorization)
    name = request.name or request.url.rstrip("/").split("/")[-1].replace(".git", "")
    repository = await db.create_repository(
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": name,
            "url": request.url,
            "default_branch": "main",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return repository
