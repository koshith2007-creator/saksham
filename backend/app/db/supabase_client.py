"""SAKSHAM - Supabase client wrapper."""

from typing import Optional, Dict, Any, List
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("supabase")


class SupabaseClient:
    """
    Supabase client wrapper.
    Uses in-memory storage only when DEMO_MODE is explicitly enabled.
    """

    def __init__(self):
        self.connected = False
        self._client = None
        self._startup_error = ""
        self._memory_db: Dict[str, List[Dict]] = {
            "profiles": [],
            "repositories": [],
            "scan_sessions": [],
            "vulnerabilities": [],
            "remediations": [],
            "agent_logs": [],
            "chat_sessions": [],
            "notifications": [],
            "attack_graphs": [],
            "threat_intelligence": [],
        }

        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if settings.SUPABASE_URL and supabase_key and not settings.DEMO_MODE:
            try:
                from supabase import create_client

                self._client = create_client(settings.SUPABASE_URL, supabase_key)
                self.connected = True
                logger.info("Supabase connected")
            except Exception as e:
                logger.error(f"Supabase connection failed: {e}")
                self._startup_error = str(e)
        elif settings.DEMO_MODE:
            logger.info("Using in-memory database (demo mode)")
            self._startup_error = ""
        else:
            self._startup_error = "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are required"
            logger.error(self._startup_error)

    def _ensure_available(self):
        if self.connected and self._client:
            return
        if settings.DEMO_MODE:
            return
        raise RuntimeError(f"Supabase is not available: {self._startup_error}")

    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record into a table."""
        self._ensure_available()
        if self.connected and self._client:
            try:
                result = self._client.table(table).insert(data).execute()
                return result.data[0] if result.data else data
            except Exception as e:
                logger.error(f"Insert failed: {e}")
                raise RuntimeError(f"Supabase insert into {table} failed: {e}") from e

        if table not in self._memory_db:
            self._memory_db[table] = []
        self._memory_db[table].append(data)
        return data

    async def select(self, table: str, filters: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict]:
        """Select records from a table."""
        self._ensure_available()
        if self.connected and self._client:
            try:
                query = self._client.table(table).select("*").limit(limit)
                if filters:
                    for key, value in filters.items():
                        query = query.eq(key, value)
                result = query.execute()
                return result.data or []
            except Exception as e:
                logger.error(f"Select failed: {e}")
                raise RuntimeError(f"Supabase select from {table} failed: {e}") from e

        records = self._memory_db.get(table, [])
        if filters:
            records = [record for record in records if all(record.get(key) == value for key, value in filters.items())]
        return records[:limit]

    async def update(self, table: str, record_id: str, data: Dict[str, Any], id_field: str = "id") -> Dict[str, Any]:
        """Update a record in a table."""
        self._ensure_available()
        if self.connected and self._client:
            try:
                result = self._client.table(table).update(data).eq(id_field, record_id).execute()
                return result.data[0] if result.data else data
            except Exception as e:
                logger.error(f"Update failed: {e}")
                raise RuntimeError(f"Supabase update on {table} failed: {e}") from e

        records = self._memory_db.get(table, [])
        for record in records:
            if record.get(id_field) == record_id:
                record.update(data)
                return record
        return data

    async def delete(self, table: str, record_id: str, id_field: str = "id") -> bool:
        """Delete a record from a table."""
        self._ensure_available()
        if self.connected and self._client:
            try:
                self._client.table(table).delete().eq(id_field, record_id).execute()
                return True
            except Exception as e:
                logger.error(f"Delete failed: {e}")
                raise RuntimeError(f"Supabase delete from {table} failed: {e}") from e

        records = self._memory_db.get(table, [])
        self._memory_db[table] = [record for record in records if record.get(id_field) != record_id]
        return True

    async def get_by_id(self, table: str, record_id: str, id_field: str = "id") -> Optional[Dict]:
        """Get a single record by ID."""
        results = await self.select(table, {id_field: record_id}, limit=1)
        return results[0] if results else None

    async def count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records in a table."""
        self._ensure_available()
        if self.connected and self._client:
            try:
                query = self._client.table(table).select("*", count="exact")
                if filters:
                    for key, value in filters.items():
                        query = query.eq(key, value)
                result = query.execute()
                return result.count or 0
            except Exception as e:
                raise RuntimeError(f"Supabase count for {table} failed: {e}") from e

        records = self._memory_db.get(table, [])
        if filters:
            records = [record for record in records if all(record.get(key) == value for key, value in filters.items())]
        return len(records)


supabase_client = SupabaseClient()


def get_supabase():
    """Return the live Supabase client when configured."""
    if not supabase_client.connected or supabase_client._client is None:
        raise RuntimeError("Supabase is not configured")
    return supabase_client._client
