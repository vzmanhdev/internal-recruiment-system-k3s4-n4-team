from pydantic import BaseModel, EmailStr, Field, field_validator
import re
from typing import Optional, Dict, List

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên người dùng")
    email: EmailStr = Field(..., description="Email làm việc hợp lệ")
    password: str = Field(..., min_length=6, description="Mật khẩu phải từ 6 ký tự trở lên")
    phone: Optional[str] = Field(None, max_length=20, description="Số điện thoại liên hệ")
    role: Optional[str] = Field("employee", description="Vai trò: employee, hr_manager, admin")

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
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Mật khẩu mới phải gồm ít nhất một chữ và một số")
        return value

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=4_000_000)

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
    department_id: Optional[int] = None
    role: str
    roles: List[str] = Field(default_factory=list)
    redirect_url: Optional[str] = None
    is_active: bool
    account_status: str = "active"
    lock_reason: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    redirect_url: str = "/"
    user: UserResponse

class RegistrationResponse(BaseModel):
    message: str
    user: UserResponse

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    field_errors: Optional[Dict[str, str]] = None
