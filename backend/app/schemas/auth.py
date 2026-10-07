from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên người dùng")
    email: EmailStr = Field(..., description="Email làm việc hợp lệ")
    password: str = Field(..., min_length=6, description="Mật khẩu phải từ 6 ký tự trở lên")
    phone: Optional[str] = Field(None, max_length=20, description="Số điện thoại liên hệ")
    role: Optional[str] = Field("employee", description="Vai trò: employee, hr_manager, admin")
    employee_code: Optional[str] = Field(None, max_length=50, description="Mã nhân viên (tùy chọn hoặc tự động sinh)")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Email làm việc")
    password: str = Field(..., description="Mật khẩu")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email công ty để nhận mã OTP khôi phục mật khẩu")

class PasswordResetVerify(BaseModel):
    email: EmailStr = Field(..., description="Email công ty")
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP 6 chữ số")

class PasswordResetConfirm(BaseModel):
    reset_token: str = Field(..., description="Reset token được phát hành sau khi xác thực OTP thành công")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới tối thiểu 8 ký tự")
    confirm_password: Optional[str] = Field(None, description="Xác nhận mật khẩu mới")

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    employee_code: Optional[str] = None
    role: str
    redirect_route: Optional[str] = "/"
    avatar_url: Optional[str] = None
    avatar_base64: Optional[str] = None
    position_title: Optional[str] = None
    department_id: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True
    account_status: Optional[str] = "active"
    failed_login_attempts: Optional[int] = 0
    locked_until: Optional[str] = None
    last_login_at: Optional[str] = None
    password_changed_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    position_title: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    avatar_base64: Optional[str] = Field(None, description="Chuỗi ảnh Base64 hợp lệ")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới tối thiểu 8 ký tự")
    confirm_password: Optional[str] = Field(None, description="Xác nhận mật khẩu mới")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ErrorResponse(BaseModel):
    detail: str
    field_errors: Optional[Dict[str, str]] = None

class UserBulkImportItem(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Optional[str] = "employee"
    position_title: Optional[str] = None
    department_id: Optional[str] = None
    password: Optional[str] = "company123"

class BulkImportRequest(BaseModel):
    users: list[UserBulkImportItem]


