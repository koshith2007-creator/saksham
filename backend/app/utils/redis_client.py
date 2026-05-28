"""SAKSHAM - Redis/Upstash client for caching and job queuing."""

from typing import Optional, Any, Dict
import json
import time

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("redis")


class RedisClient:
    """
    Redis client wrapper. Uses Upstash REST API when available,
    falls back to an in-memory dict for demo mode.
    """

    def __init__(self):
        self.connected = False
        self._memory_store: Dict[str, Any] = {}
        self._ttl_store: Dict[str, float] = {}

        if settings.UPSTASH_REDIS_URL and not settings.DEMO_MODE:
            try:
                import redis

                self.client = redis.from_url(
                    settings.UPSTASH_REDIS_URL,
                    decode_responses=True,
                )
                self.client.ping()
                self.connected = True
                logger.info("Redis connected", url=settings.UPSTASH_REDIS_URL[:30] + "...")
            except Exception as e:
                logger.warning(f"Redis connection failed, using in-memory fallback: {e}")
                self.connected = False
        else:
            logger.info("Using in-memory cache (demo mode)")

    async def get(self, key: str) -> Optional[str]:
        """Get a value by key."""
        if self.connected:
            return self.client.get(key)

        if key in self._ttl_store and time.time() > self._ttl_store[key]:
            del self._memory_store[key]
            del self._ttl_store[key]
            return None
        return self._memory_store.get(key)

    async def set(self, key: str, value: str, ttl: int = 3600):
        """Set a value with an optional TTL in seconds."""
        if self.connected:
            self.client.setex(key, ttl, value)
        else:
            self._memory_store[key] = value
            self._ttl_store[key] = time.time() + ttl

    async def delete(self, key: str):
        """Delete a key."""
        if self.connected:
            self.client.delete(key)
        else:
            self._memory_store.pop(key, None)
            self._ttl_store.pop(key, None)

    async def get_json(self, key: str) -> Optional[Any]:
        """Get and parse a JSON value."""
        raw = await self.get(key)
        if raw:
            return json.loads(raw)
        return None

    async def set_json(self, key: str, value: Any, ttl: int = 3600):
        """Serialize and set a JSON value."""
        await self.set(key, json.dumps(value, default=str), ttl)

    async def enqueue(self, queue_name: str, data: Dict[str, Any]):
        """Push a job onto a queue."""
        key = f"queue:{queue_name}"
        existing = await self.get_json(key) or []
        existing.append(data)
        await self.set_json(key, existing, ttl=86400)

    async def dequeue(self, queue_name: str) -> Optional[Dict[str, Any]]:
        """Pop a job from a queue."""
        key = f"queue:{queue_name}"
        existing = await self.get_json(key) or []
        if not existing:
            return None
        item = existing.pop(0)
        await self.set_json(key, existing, ttl=86400)
        return item

    async def cache_scan_progress(self, scan_id: str, progress: Dict[str, Any]):
        """Cache scan progress for real-time updates."""
        await self.set_json(f"scan_progress:{scan_id}", progress, ttl=7200)

    async def get_scan_progress(self, scan_id: str) -> Optional[Dict[str, Any]]:
        """Get cached scan progress."""
        return await self.get_json(f"scan_progress:{scan_id}")


redis_client = RedisClient()
