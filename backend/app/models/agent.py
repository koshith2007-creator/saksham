"""SAKSHAM — Pydantic models for agent system."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid


class AgentType(str, Enum):
    ORCHESTRATOR = "orchestrator"
    STATIC_ANALYSIS = "static_analysis"
    DEPENDENCY_SECURITY = "dependency_security"
    EXPLOITABILITY = "exploitability"
    THREAT_INTELLIGENCE = "threat_intelligence"
    RISK_SCORING = "risk_scoring"
    REMEDIATION = "remediation"
    REPOSITORY_INTEL = "repository_intel"
    ATTACK_GRAPH = "attack_graph"
    MEMORY = "memory"
    PDF_REPORT = "pdf_report"
    DEV_COPILOT = "dev_copilot"


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"


class AgentTask(BaseModel):
    """A task assigned to an agent by the orchestrator."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_type: AgentType
    scan_id: str
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Optional[Dict[str, Any]] = None
    status: AgentStatus = AgentStatus.IDLE
    reasoning: str = ""
    duration_ms: int = 0
    tokens_used: int = 0
    model_used: Optional[str] = None
    error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None


class AgentMessage(BaseModel):
    """Real-time message from an agent for WebSocket streaming."""
    agent: str
    action: str
    status: str = "running"
    progress: Optional[float] = None  # 0.0 to 1.0
    details: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ScanPipeline(BaseModel):
    """Defines the execution pipeline for a scan."""
    scan_id: str
    stages: List[str] = Field(default_factory=lambda: [
        "repository_clone",
        "repository_analysis",
        "static_analysis",
        "dependency_scan",
        "exploitability_validation",
        "threat_intelligence",
        "risk_scoring",
        "remediation_generation",
    ])
    current_stage: int = 0
    results: Dict[str, Any] = Field(default_factory=dict)
