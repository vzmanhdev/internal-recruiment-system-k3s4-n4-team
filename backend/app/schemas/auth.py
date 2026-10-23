from pydantic import BaseModel, EmailStr, Field, field_validator
import re
from typing import Optional, Dict, List, Any

class RegistrationStartRequest(BaseModel):
    """Public candidate self-registration. There is deliberately NO role field: the backend always assigns
    the candidate role, and unknown fields such as "role" sent by a client are ignored."""
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên")
    email: EmailStr = Field(..., description="Email nhận mã xác thực")
    password: str = Field(..., max_length=128, description="Mật khẩu")
    confirm_password: str = Field(..., max_length=128, description="Nhập lại mật khẩu")
    phone: Optional[str] = Field(None, max_length=20, description="Số điện thoại liên hệ")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Họ và tên phải có ít nhất 2 ký tự")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_policy(cls, value: str) -> str:
        from app.core.security import validate_password_complexity
        return validate_password_complexity(value, field_name="Mật khẩu")

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(cls, value: str, info) -> str:
        if "password" in info.data and value != info.data["password"]:
            raise ValueError("Mật khẩu xác nhận không trùng khớp")
        return value


class RegistrationVerifyRequest(BaseModel):
    challenge_id: str = Field(..., min_length=20, max_length=64)
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP 6 chữ số")

    @field_validator("otp")
    @classmethod
    def validate_otp_format(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise ValueError("Mã OTP phải bao gồm chính xác 6 chữ số")
        return cleaned


class RegistrationResendRequest(BaseModel):
    challenge_id: str = Field(..., min_length=20, max_length=64)


class RegistrationChallengeResponse(BaseModel):
    message: Optional[str] = None
    challenge_id: str
    challenge_status: str
    masked_email: str
    max_attempts: int
    remaining_attempts: int
    expires_in_seconds: int
    resend_available_in_seconds: int
    can_resend: bool

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Email làm việc")
    password: str = Field(..., description="Mật khẩu")

# =========================================================================
# PASSWORD RESET OTP SCHEMAS
# =========================================================================

class PasswordResetInitRequest(BaseModel):
    email: EmailStr = Field(..., description="Email công ty đã đăng ký trong hệ thống")

class PasswordResetInitResponse(BaseModel):
    message: str
    reset_session_id: str
    masked_email: str
    expires_in_seconds: int = 600
    resend_cooldown_seconds: int = 60

class PasswordResetVerifyRequest(BaseModel):
    reset_session_id: str = Field(..., min_length=10, description="Mã phiên reset password (UUID)")
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP 6 chữ số")

    @field_validator("otp")
    @classmethod
    def validate_otp_format(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise ValueError("Mã OTP phải bao gồm chính xác 6 chữ số")
        return cleaned

class PasswordResetVerifyResponse(BaseModel):
    message: str
    success: bool = True
    masked_email: str

class PasswordResetResendRequest(BaseModel):
    reset_session_id: str = Field(..., min_length=10, description="Mã phiên reset password (UUID)")

class PasswordResetResendResponse(BaseModel):
    message: str
    reset_session_id: str
    resend_cooldown_seconds: int = 60

# Backwards compatibility legacy schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email công ty để nhận liên kết khôi phục mật khẩu")

class ForgotPasswordResponse(BaseModel):
    message: str
    reset_url: Optional[str] = None
    reset_session_id: Optional[str] = None
    masked_email: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: Optional[str] = Field(None)
    reset_session_id: Optional[str] = Field(None)
    otp: Optional[str] = Field(None)
    new_password: Optional[str] = Field(None)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới có ít nhất 8 ký tự, gồm chữ và số")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        from app.core.security import validate_password_complexity
        return validate_password_complexity(value, field_name="Mật khẩu mới")

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=4_000_000)
    date_of_birth: Optional[str] = Field(None, max_length=50)
    dob: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=20)
    job_title: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)

    @field_validator("phone")
    @classmethod
    def validate_vietnam_phone(cls, value: Optional[str]) -> Optional[str]:
        if value and not re.fullmatch(r"(?:\+84|0)(?:3|5|7|8|9)\d{8}", value.replace(" ", "")):
            raise ValueError("Số điện thoại Việt Nam không hợp lệ")
        return value

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    employee_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    role: str
    roles: Optional[Any] = None
    permissions: List[str] = Field(default_factory=list)
    effective_permissions: List[str] = Field(default_factory=list)
    redirect_url: Optional[str] = None
    is_active: bool
    account_status: str = "active"
    lock_reason: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Refresh Token (nếu không dùng HttpOnly Cookie)")

class SessionResponse(BaseModel):
    id: str
    user_id: int
    device_name: str
    browser: str
    os: str
    ip_address: str
    created_at: Optional[str] = None
    last_active_at: Optional[str] = None
    expires_at: Optional[str] = None
    is_revoked: bool = False
    revoke_reason: Optional[str] = None
    current: bool = False

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    redirect_url: str = "/"
    user: UserResponse

class RegistrationCompletedResponse(BaseModel):
    message: str
    challenge_status: str
    redirect_url: str
    user: Dict[str, Any]

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    field_errors: Optional[Dict[str, str]] = None

class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict] = None
    field_errors: Optional[Dict[str, str]] = None

class StandardErrorResponse(BaseModel):
    success: bool = False
    error: ApiErrorDetail
    request_id: Optional[str] = None

