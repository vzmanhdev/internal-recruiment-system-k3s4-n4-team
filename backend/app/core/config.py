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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    DEV_ADMIN_EMAIL: str = "admin@company.com"
    DEV_ADMIN_PASSWORD: str = "Admin12345"
    DEV_HR_EMAIL: str = "hr@company.com"
    DEV_HR_PASSWORD: str = "Admin12345"
    DEV_MANAGER_EMAIL: str = "manager@company.com"
    DEV_MANAGER_PASSWORD: str = "Manager12345"
    DEV_RECRUITER_EMAIL: str = "recruiter@company.com"
    DEV_RECRUITER_PASSWORD: str = "Recruit12345"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "no-reply@company.com"
    SMTP_USE_TLS: bool = True

    SMTP_APP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "TUYỂN DỤNG NỘI BỘ"
    SMTP_STARTTLS: bool = True
    PASSWORD_RESET_OTP_TTL_SECONDS: int = 600
    PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: int = 60
    PASSWORD_RESET_MAX_ATTEMPTS: int = 5
    PASSWORD_RESET_MAX_SENDS_PER_SESSION: int = 3
    PASSWORD_RESET_EMAIL_LIMIT: int = 5
    PASSWORD_RESET_EMAIL_WINDOW_SECONDS: int = 900
    PASSWORD_RESET_IP_LIMIT: int = 15
    PASSWORD_RESET_IP_WINDOW_SECONDS: int = 900
    PASSWORD_RESET_PASSWORD_LENGTH: int = 16

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
