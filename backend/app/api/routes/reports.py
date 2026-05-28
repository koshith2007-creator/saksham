"""SAKSHAM — Report Routes."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_reports():
    return {"reports": []}

@router.post("/generate")
async def generate_report():
    return {"status": "generating", "message": "Report generation initiated"}
