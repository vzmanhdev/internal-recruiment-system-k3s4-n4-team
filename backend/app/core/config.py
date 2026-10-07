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

    # SMTP Configuration (Gmail SMTP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_APP_PASSWORD: str = os.getenv("SMTP_APP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Tuyển Dụng Nội Bộ")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    # Password Reset & OTP Configuration
    PASSWORD_RESET_OTP_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_OTP_EXPIRE_MINUTES", "5"))
    PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: int = int(os.getenv("PASSWORD_RESET_RESEND_COOLDOWN_SECONDS", "60"))
    PASSWORD_RESET_MAX_ATTEMPTS: int = int(os.getenv("PASSWORD_RESET_MAX_ATTEMPTS", "5"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
