"""SAKSHAM — Structured logging utility."""

import structlog
import logging
from datetime import datetime, timezone


def setup_logging(level: str = "INFO"):
    """Configure structured logging for the application."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
    )


def get_logger(name: str = "saksham"):
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class ScanLogger:
    """Specialized logger for scan operations that tracks agent activity."""

    def __init__(self, scan_id: str):
        self.scan_id = scan_id
        self.logger = get_logger("scan")
        self.events: list = []

    def agent_start(self, agent_name: str, action: str):
        """Log an agent starting work."""
        event = {
            "agent": agent_name,
            "action": action,
            "status": "running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.events.append(event)
        self.logger.info(f"🤖 [{agent_name}] {action}", scan_id=self.scan_id)
        return event

    def agent_complete(self, agent_name: str, action: str, duration_ms: int = 0):
        """Log an agent completing work."""
        event = {
            "agent": agent_name,
            "action": action,
            "status": "completed",
            "duration_ms": duration_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.events.append(event)
        self.logger.info(f"✅ [{agent_name}] {action} ({duration_ms}ms)", scan_id=self.scan_id)
        return event

    def agent_error(self, agent_name: str, error: str):
        """Log an agent error."""
        event = {
            "agent": agent_name,
            "action": f"Error: {error}",
            "status": "failed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.events.append(event)
        self.logger.error(f"❌ [{agent_name}] {error}", scan_id=self.scan_id)
        return event

    def get_events(self) -> list:
        """Return all logged events."""
        return self.events
