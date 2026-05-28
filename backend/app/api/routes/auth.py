"""
SAKSHAM - Authentication routes.
Supports email/password auth plus Google and GitHub OAuth.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode
import uuid

import httpx
import jwt
import structlog
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.config import settings

logger = structlog.get_logger()
router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    expires_at: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str = "user"
    preferences: dict = {"theme": "dark", "notifications": True}


DEMO_USERS = {
    "admin@saksham.ai": {
        "id": "demo-admin-001",
        "email": "admin@saksham.ai",
        "password": "saksham2026",
        "full_name": "Saksham Admin",
        "avatar_url": None,
        "role": "admin",
        "preferences": {"theme": "dark", "notifications": True},
        "created_at": "2026-01-01T00:00:00Z",
    },
    "dev@saksham.ai": {
        "id": "demo-dev-002",
        "email": "dev@saksham.ai",
        "password": "saksham2026",
        "full_name": "Dev User",
        "avatar_url": None,
        "role": "user",
        "preferences": {"theme": "dark", "notifications": True},
        "created_at": "2026-01-01T00:00:00Z",
    },
}

OAUTH_PROVIDER_CONFIG = {
    "github": {
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "email_url": "https://api.github.com/user/emails",
        "scopes": "read:user user:email",
    },
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
        "scopes": "openid email profile",
    },
}


def create_token(user_id: str, email: str) -> tuple[str, datetime]:
    """Create a JWT token for authentication."""
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expires,
        "iat": datetime.now(timezone.utc),
        "iss": "saksham",
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    return token, expires


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


def create_oauth_state(provider: str, next_path: str) -> str:
    """Create a signed OAuth state token."""
    safe_next = normalize_next_path(next_path)
    payload = {
        "provider": provider,
        "next": safe_next,
        "purpose": "oauth_state",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_oauth_state(state: str) -> dict:
    """Decode and validate a signed OAuth state token."""
    try:
        payload = jwt.decode(state, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from exc

    if payload.get("purpose") != "oauth_state":
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    return payload


def normalize_next_path(next_path: str) -> str:
    """Prevent open redirects by allowing only local app paths."""
    if not next_path.startswith("/") or next_path.startswith("//"):
        return "/dashboard"
    return next_path


def get_provider_client_settings(provider: str) -> tuple[str, str]:
    """Return the client ID and secret for the provider."""
    if provider == "github":
        return settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET
    if provider == "google":
        return settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET
    raise HTTPException(status_code=404, detail="Unsupported OAuth provider")


def build_backend_callback_url(request: Request, provider: str) -> str:
    """Build the public callback URL on the backend."""
    base = str(request.base_url).rstrip("/")
    return f"{base}/api/auth/oauth/{provider}/callback"


def build_frontend_callback_redirect(token: str, user: dict, next_path: str) -> str:
    """Redirect back to the frontend callback page with auth payload."""
    callback_base = f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback"
    fragment = urlencode(
        {
            "token": token,
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user.get("avatar_url") or "",
            "role": user.get("role", "user"),
            "next": normalize_next_path(next_path),
        }
    )
    return f"{callback_base}#{fragment}"


async def exchange_oauth_code(provider: str, code: str, redirect_uri: str) -> dict:
    """Exchange an OAuth authorization code for provider tokens."""
    client_id, client_secret = get_provider_client_settings(provider)
    if not client_id or not client_secret:
        raise HTTPException(status_code=503, detail=f"{provider.title()} OAuth is not configured")

    if provider == "github":
        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
        headers = {"Accept": "application/json"}
    else:
        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        headers = {"Accept": "application/json"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            OAUTH_PROVIDER_CONFIG[provider]["token_url"],
            data=payload,
            headers=headers,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"{provider.title()} token exchange failed")

    token_data = response.json()
    if "error" in token_data:
        raise HTTPException(status_code=400, detail=f"{provider.title()} token exchange failed")
    return token_data


async def fetch_oauth_user(provider: str, access_token: str) -> dict:
    """Fetch the provider user profile."""
    headers = {"Authorization": f"Bearer {access_token}"}
    if provider == "github":
        headers["Accept"] = "application/vnd.github+json"
        headers["User-Agent"] = "saksham-oauth"

    async with httpx.AsyncClient(timeout=20.0) as client:
        profile_response = await client.get(OAUTH_PROVIDER_CONFIG[provider]["userinfo_url"], headers=headers)

        if profile_response.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"Unable to fetch {provider.title()} profile")

        profile = profile_response.json()

        if provider == "github":
            email_response = await client.get(OAUTH_PROVIDER_CONFIG[provider]["email_url"], headers=headers)
            if email_response.status_code < 400:
                profile["emails"] = email_response.json()

    return profile


def normalize_oauth_user(provider: str, profile: dict) -> dict:
    """Normalize provider-specific profiles into the app user shape."""
    if provider == "google":
        email = profile.get("email")
        full_name = profile.get("name") or email or "Google User"
        avatar_url = profile.get("picture")
        provider_user_id = profile.get("sub")
    else:
        email = profile.get("email")
        if not email:
            emails = profile.get("emails", [])
            primary = next((item for item in emails if item.get("primary") and item.get("verified")), None)
            fallback = next((item for item in emails if item.get("verified")), None)
            email = (primary or fallback or {}).get("email")
        if not email:
            login_name = profile.get("login") or "github-user"
            email = f"{login_name}@users.noreply.github.com"
        full_name = profile.get("name") or profile.get("login") or email
        avatar_url = profile.get("avatar_url")
        provider_user_id = str(profile.get("id"))

    return {
        "id": f"{provider}-{provider_user_id}",
        "email": email,
        "full_name": full_name,
        "avatar_url": avatar_url,
        "role": "user",
        "preferences": {"theme": "dark", "notifications": True},
    }


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token."""
    logger.info("Login attempt", email=request.email, demo_mode=settings.DEMO_MODE)

    if settings.DEMO_MODE:
        user = DEMO_USERS.get(request.email)
        if not user or user["password"] != request.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token, expires = create_token(user["id"], user["email"])
        return AuthResponse(
            access_token=token,
            user={
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "avatar_url": user["avatar_url"],
                "role": user["role"],
                "preferences": user["preferences"],
            },
            expires_at=expires.isoformat(),
        )

    try:
        from app.db.supabase_client import get_supabase

        supabase = get_supabase()
        auth_response = supabase.auth.sign_in_with_password(
            {
                "email": request.email,
                "password": request.password,
            }
        )

        token, expires = create_token(auth_response.user.id, auth_response.user.email)
        return AuthResponse(
            access_token=token,
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "full_name": auth_response.user.user_metadata.get("full_name", ""),
                "role": "user",
            },
            expires_at=expires.isoformat(),
        )
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid credentials") from e


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Register a new user."""
    logger.info("Signup attempt", email=request.email)

    if settings.DEMO_MODE:
        if request.email in DEMO_USERS:
            raise HTTPException(status_code=409, detail="User already exists")

        new_user = {
            "id": f"demo-{uuid.uuid4().hex[:8]}",
            "email": request.email,
            "password": request.password,
            "full_name": request.full_name,
            "avatar_url": None,
            "role": "user",
            "preferences": {"theme": "dark", "notifications": True},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        DEMO_USERS[request.email] = new_user

        token, expires = create_token(new_user["id"], new_user["email"])
        return AuthResponse(
            access_token=token,
            user={
                "id": new_user["id"],
                "email": new_user["email"],
                "full_name": new_user["full_name"],
                "avatar_url": None,
                "role": "user",
                "preferences": new_user["preferences"],
            },
            expires_at=expires.isoformat(),
        )

    try:
        from app.db.supabase_client import get_supabase

        supabase = get_supabase()
        auth_response = supabase.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "options": {"data": {"full_name": request.full_name}},
            }
        )

        token, expires = create_token(auth_response.user.id, auth_response.user.email)
        return AuthResponse(
            access_token=token,
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "full_name": request.full_name,
                "role": "user",
            },
            expires_at=expires.isoformat(),
        )
    except Exception as e:
        logger.error("Signup failed", error=str(e))
        raise HTTPException(status_code=400, detail="Signup failed") from e


@router.get("/oauth/{provider}/start")
async def start_oauth(provider: str, request: Request, next: str = "/dashboard"):
    """Redirect the browser to the provider OAuth authorization URL."""
    if provider not in OAUTH_PROVIDER_CONFIG:
        raise HTTPException(status_code=404, detail="Unsupported OAuth provider")

    client_id, client_secret = get_provider_client_settings(provider)
    if not client_id or not client_secret:
        raise HTTPException(status_code=503, detail=f"{provider.title()} OAuth is not configured")

    redirect_uri = build_backend_callback_url(request, provider)
    state = create_oauth_state(provider, next)

    if provider == "github":
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": OAUTH_PROVIDER_CONFIG[provider]["scopes"],
            "state": state,
        }
    else:
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": OAUTH_PROVIDER_CONFIG[provider]["scopes"],
            "state": state,
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "select_account",
        }

    authorize_url = f"{OAUTH_PROVIDER_CONFIG[provider]['authorize_url']}?{urlencode(params)}"
    return RedirectResponse(url=authorize_url, status_code=307)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    """Handle provider callback, mint app JWT, and return to the frontend."""
    if provider not in OAUTH_PROVIDER_CONFIG:
        raise HTTPException(status_code=404, detail="Unsupported OAuth provider")

    if error:
        raise HTTPException(status_code=400, detail=f"{provider.title()} OAuth failed: {error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth callback parameters")

    decoded_state = decode_oauth_state(state)
    if decoded_state.get("provider") != provider:
        raise HTTPException(status_code=400, detail="OAuth provider mismatch")

    redirect_uri = build_backend_callback_url(request, provider)
    token_data = await exchange_oauth_code(provider, code, redirect_uri)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail=f"{provider.title()} token exchange failed")

    provider_profile = await fetch_oauth_user(provider, access_token)
    user = normalize_oauth_user(provider, provider_profile)
    app_token, expires = create_token(user["id"], user["email"])

    redirect_target = build_frontend_callback_redirect(
        token=app_token,
        user=user,
        next_path=decoded_state.get("next", "/dashboard"),
    )

    logger.info("OAuth login succeeded", provider=provider, email=user["email"], expires_at=expires.isoformat())
    return RedirectResponse(url=redirect_target, status_code=307)


@router.get("/me")
async def get_current_user():
    """Get current user profile (simplified for demo)."""
    return {
        "id": "demo-admin-001",
        "email": "admin@saksham.ai",
        "full_name": "Saksham Admin",
        "role": "admin",
        "preferences": {"theme": "dark", "notifications": True},
    }


@router.post("/logout")
async def logout():
    """Logout user."""
    return {"message": "Logged out successfully"}
