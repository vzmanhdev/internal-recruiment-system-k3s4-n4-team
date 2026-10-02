from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

class ApplicationCreate(BaseModel):
    job_id: int = Field(..., description="ID của tin tuyển dụng nộp hồ sơ")
    full_name: str = Field(..., min_length=2, max_length=255, description="Họ và tên ứng viên")
    email: EmailStr = Field(..., description="Email liên hệ")
    phone: str = Field(..., min_length=8, max_length=50, description="Số điện thoại")
    cv_url: str = Field(..., description="File/Link CV hoặc Data URL của ứng viên")
    cover_letter: Optional[str] = Field(None, description="Thư giới thiệu / Động lực ứng tuyển")
    current_department: Optional[str] = Field(None, max_length=255, description="Phòng ban hiện tại nếu là ứng viên nội bộ")
    referral_code: Optional[str] = Field(None, max_length=50, description="Mã nhân sự giới thiệu (nếu có)")

class ApplicationStageUpdate(BaseModel):
    to_status: str = Field(..., description="Trạng thái phễu mới: applied, screening, interviewing, offered, hired, rejected")
    note: Optional[str] = Field(None, max_length=1000, description="Ghi chú nhận xét của HR")

class ApplicationLogResponse(BaseModel):
    id: int
    application_id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    from_status: str
    to_status: str
    note: Optional[str] = None
    created_at: str

class ApplicationResponse(BaseModel):
    id: int
    code: str
    job_id: int
    job_code: Optional[str] = None
    job_title: Optional[str] = None
    department_name: Optional[str] = None
    candidate_id: Optional[int] = None
    full_name: str
    email: str
    phone: str
    cv_url: str
    cover_letter: Optional[str] = None
    current_department: Optional[str] = None
    referral_code: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    logs: List[ApplicationLogResponse] = []

class PaginatedApplicationsResponse(BaseModel):
    items: List[ApplicationResponse]
    total: int
    page: int
    page_size: int
    pages: int
