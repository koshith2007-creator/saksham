"""SAKSHAM - Vulnerability routes backed by Supabase."""

from fastapi import APIRouter, HTTPException

from app.db import queries as db
from app.db.supabase_client import supabase_client

router = APIRouter()


@router.get("/")
async def list_vulnerabilities():
    vulnerabilities = await supabase_client.select("vulnerabilities", limit=1000)
    return {"vulnerabilities": vulnerabilities, "total": len(vulnerabilities)}


@router.get("/{vuln_id}")
async def get_vulnerability(vuln_id: str):
    vulnerability = await db.get_vulnerability(vuln_id)
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vulnerability
