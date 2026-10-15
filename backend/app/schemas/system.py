from pydantic import BaseModel, Field, field_validator


class SystemSettingsUpdate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    allow_registration: bool
    require_approval: bool
    email_notifications: bool
    session_timeout: int = Field(..., ge=15, le=1440)

    @field_validator("session_timeout")
    @classmethod
    def supported_timeout(cls, value: int) -> int:
        if value not in {30, 60, 120, 480}:
            raise ValueError("Thời gian phiên phải là 30, 60, 120 hoặc 480 phút")
        return value
