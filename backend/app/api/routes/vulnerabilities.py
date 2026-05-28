"""SAKSHAM — Vulnerability Routes."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_vulnerabilities():
    return {"vulnerabilities": [], "total": 0}

@router.get("/{vuln_id}")
async def get_vulnerability(vuln_id: str):
    return {"id": vuln_id, "title": "Demo Vulnerability", "status": "open"}
