"""SAKSHAM - Report routes backed by Supabase."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.db.supabase_client import supabase_client

router = APIRouter()


@router.get("/")
async def list_reports():
    reports = await supabase_client.select("saved_reports", limit=100)
    return {"reports": reports}


@router.post("/generate")
async def generate_report():
    raise HTTPException(
        status_code=501,
        detail=f"Report generation is not implemented yet. Requested at {datetime.now(timezone.utc).isoformat()}",
    )
