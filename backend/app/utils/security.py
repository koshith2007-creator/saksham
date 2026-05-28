"""SAKSHAM — Security utilities for authentication and token handling."""

from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt

from app.config import settings


# Demo user credentials store
DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "saksham@demo.ai": {
        "id": "demo-user-001",
        "email": "saksham@demo.ai",
        "full_name": "Saksham Admin",
        "password_hash": hashlib.sha256("SakshamSecure@2026".encode()).hexdigest(),
        "role": "admin",
        "avatar_url": None,
        "preferences": {"theme": "dark", "notifications": True},
    }
}

SECRET_KEY = settings.JWT_SECRET or "saksham-demo-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 (demo-grade; use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user with email and password."""
    user = DEMO_USERS.get(email)
    if user and verify_password(password, user["password_hash"]):
        return {k: v for k, v in user.items() if k != "password_hash"}
    return None


def register_user(email: str, password: str, full_name: str = "") -> Dict[str, Any]:
    """Register a new demo user."""
    if email in DEMO_USERS:
        raise ValueError("User already exists")

    user_id = f"user-{secrets.token_hex(6)}"
    user = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "password_hash": hash_password(password),
        "role": "user",
        "avatar_url": None,
        "preferences": {"theme": "dark", "notifications": True},
    }
    DEMO_USERS[email] = user
    return {k: v for k, v in user.items() if k != "password_hash"}


def generate_api_key() -> str:
    """Generate a random API key."""
    return f"sk-saksham-{secrets.token_hex(24)}"
