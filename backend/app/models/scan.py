"""SAKSHAM — Pydantic models for scan sessions."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class ScanStatus(str, Enum):
    PENDING = "pending"
    CLONING = "cloning"
    SCANNING = "scanning"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanType(str, Enum):
    FULL = "full"
    INCREMENTAL = "incremental"
    PR = "pr"
    QUICK = "quick"


class ScanRequest(BaseModel):
    """Request model for creating a new scan."""
    repository_url: str = Field(..., description="Git repository URL to scan")
    scan_type: ScanType = Field(default=ScanType.FULL, description="Type of scan")
    branch: Optional[str] = Field(default="main", description="Branch to scan")


class AgentLog(BaseModel):
    """Log entry from an individual agent."""
    agent: str
    action: str
    status: str = "pending"
    duration_ms: int = 0
    reasoning: Optional[str] = None
    tokens_used: int = 0
    model_used: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ScanSession(BaseModel):
    """Complete scan session model."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repository_url: str
    repository_name: str = ""
    status: ScanStatus = ScanStatus.PENDING
    scan_type: ScanType = ScanType.FULL
    branch: str = "main"
    commit_sha: Optional[str] = None
    total_vulnerabilities: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    files_scanned: int = 0
    lines_of_code: int = 0
    duration_seconds: float = 0
    agent_logs: List[AgentLog] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

    def derive_name(self):
        """Extract repository name from URL."""
        self.repository_name = self.repository_url.rstrip("/").split("/")[-1].replace(".git", "")
        return self
