"""
SAKSHAM — AI-Native Autonomous Cybersecurity Platform
Configuration and Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    APP_NAME: str = "SAKSHAM"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # AI Providers
    GEMINI_API_KEY: str = ""
    HUGGINGFACE_API_TOKEN: str = ""
    HUGGINGFACE_MODEL: str = "google/gemma-2-2b-it"
    
    # Redis (Upstash)
    UPSTASH_REDIS_URL: str = ""
    UPSTASH_REDIS_TOKEN: str = ""
    
    # GitHub
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_APP_PRIVATE_KEY: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Frontend application URL
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Security
    JWT_SECRET: str = "saksham-dev-secret-change-in-production"
    API_RATE_LIMIT: int = 100  # requests per minute
    
    # Scanning
    SCAN_TEMP_DIR: str = "/tmp/saksham-scans"
    MAX_REPO_SIZE_MB: int = 500
    SCAN_TIMEOUT_SECONDS: int = 300
    
    # Demo Mode
    DEMO_MODE: bool = True
    DEMO_USER_EMAIL: str = "admin@saksham.ai"
    DEMO_USER_PASSWORD: str = "saksham2026"
    DEMO_USER_NAME: str = "Saksham Admin"
    
    # Observability
    SENTRY_DSN: str = ""
    POSTHOG_API_KEY: str = ""
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
