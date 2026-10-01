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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email công ty để nhận liên kết khôi phục mật khẩu")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới có ít nhất 8 ký tự, gồm chữ và số")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Mật khẩu mới phải gồm ít nhất một chữ và một số")
        return value

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    roles: List[str] = Field(default_factory=list)
    is_active: bool
    account_status: str = "active"
    lock_reason: Optional[str] = None
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegistrationResponse(BaseModel):
    message: str
    user: UserResponse

class ErrorResponse(BaseModel):
    detail: str
    field_errors: Optional[Dict[str, str]] = None
