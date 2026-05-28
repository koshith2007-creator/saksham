"""SAKSHAM — Pydantic models for repositories."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class Repository(BaseModel):
    """Repository model."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    url: str
    default_branch: str = "main"
    language: Optional[str] = None
    framework: Optional[str] = None
    description: Optional[str] = None
    last_scanned_at: Optional[str] = None
    health_score: float = 0.0
    file_count: int = 0
    lines_of_code: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class RepositoryAnalysis(BaseModel):
    """Repository analysis results from the Repository Intelligence agent."""
    repository_id: str
    language_breakdown: Dict[str, int] = Field(default_factory=dict)
    frameworks_detected: List[str] = Field(default_factory=list)
    entry_points: List[str] = Field(default_factory=list)
    sensitive_files: List[str] = Field(default_factory=list)
    dependency_files: List[str] = Field(default_factory=list)
    total_files: int = 0
    total_lines: int = 0
    architecture_summary: str = ""
