"""SAKSHAM — Repository Routes."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.get("/")
async def list_repositories():
    return {"repositories": [
        {"id": "repo-001", "name": "payment-service", "url": "https://github.com/acme-corp/payment-service", "language": "Python", "framework": "FastAPI", "health_score": 62, "last_scanned_at": datetime.now(timezone.utc).isoformat()},
        {"id": "repo-002", "name": "auth-gateway", "url": "https://github.com/acme-corp/auth-gateway", "language": "TypeScript", "framework": "Express", "health_score": 78, "last_scanned_at": datetime.now(timezone.utc).isoformat()},
        {"id": "repo-003", "name": "user-api", "url": "https://github.com/acme-corp/user-api", "language": "Java", "framework": "Spring Boot", "health_score": 85, "last_scanned_at": datetime.now(timezone.utc).isoformat()},
        {"id": "repo-004", "name": "frontend-app", "url": "https://github.com/acme-corp/frontend-app", "language": "TypeScript", "framework": "Next.js", "health_score": 91, "last_scanned_at": datetime.now(timezone.utc).isoformat()},
    ]}

class AddRepoRequest(BaseModel):
    url: str
    name: Optional[str] = None

@router.post("/")
async def add_repository(request: AddRepoRequest):
    name = request.name or request.url.split("/")[-1].replace(".git", "")
    return {"id": str(uuid.uuid4()), "name": name, "url": request.url, "status": "added", "created_at": datetime.now(timezone.utc).isoformat()}
