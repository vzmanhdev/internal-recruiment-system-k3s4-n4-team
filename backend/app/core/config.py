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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

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
