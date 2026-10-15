import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Internal Recruitment System API"
    API_V1_STR: str = "/api/v1"
    
    # PostgreSQL Connection URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/recruitment_db"
    )
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15 # 15 minutes Access JWT TTL
    SESSION_IDLE_TIMEOUT_MINUTES: int = 60 # 60 minutes Idle Timeout
    SESSION_ABSOLUTE_TIMEOUT_HOURS: int = 12 # 12 hours Absolute Session Expiration
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 days Refresh Token Max Lifespan
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    APP_ENV: str = "development"  # development | test | production
    FRONTEND_URL: str = "http://localhost:3000"

    # Comma separated list or JSON list of allowed browser origins (never "*" with credentials)
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    # SQLite fallback is a development convenience only; production must fail fast.
    ALLOW_SQLITE_FALLBACK: bool = True
    # Create missing tables/columns on startup (development only). Production uses "alembic upgrade head".
    AUTO_CREATE_SCHEMA: bool = True
    # Uploaded files (CVs, avatars) are stored outside the web root and served only through /api/v1/files.
    FILE_STORAGE_DIR: str = "./storage"
    # Background worker: delivers queued emails (outbox) and runs the daily jobs (SLA reminders, expired postings).
    BACKGROUND_WORKER_ENABLED: bool = True

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.strip().lower() in {"production", "prod"}

    @property
    def cors_origins(self) -> list:
        import json
        raw = (self.BACKEND_CORS_ORIGINS or "").strip()
        try:
            values = json.loads(raw) if raw.startswith("[") else raw.split(",")
        except ValueError:
            values = raw.split(",")
        return [v.strip().rstrip("/") for v in values if v and v.strip() and v.strip() != "*"]


    # SMTP Gmail & Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_APP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "TUYỂN DỤNG NỘI BỘ"
    SMTP_FROM_EMAIL: str = "no-reply@company.com"
    SMTP_STARTTLS: bool = True

    # Password Reset OTP Policies & Security Limits
    PASSWORD_RESET_OTP_TTL_SECONDS: int = 600 # 10 minutes
    PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: int = 60 # 60 seconds cooldown
    PASSWORD_RESET_MAX_ATTEMPTS: int = 5 # 5 max wrong attempts before locking
    PASSWORD_RESET_MAX_SENDS_PER_SESSION: int = 3 # 3 max sends per session
    PASSWORD_RESET_EMAIL_LIMIT: int = 5 # 5 requests per 15 mins per email
    PASSWORD_RESET_EMAIL_WINDOW_SECONDS: int = 900
    PASSWORD_RESET_IP_LIMIT: int = 15 # 15 requests per 15 mins per IP
    PASSWORD_RESET_IP_WINDOW_SECONDS: int = 900
    PASSWORD_RESET_PASSWORD_LENGTH: int = 16

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
