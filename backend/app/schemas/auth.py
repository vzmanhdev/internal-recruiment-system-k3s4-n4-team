from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict

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

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ErrorResponse(BaseModel):
    detail: str
    field_errors: Optional[Dict[str, str]] = None
