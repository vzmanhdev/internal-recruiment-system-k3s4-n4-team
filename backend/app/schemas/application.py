from datetime import datetime
from typing import Any, Optional, List
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
    cv_filename: Optional[str] = Field(None, max_length=255)
    cv_content_type: Optional[str] = Field(None, max_length=120)
    website: Optional[str] = Field(None, max_length=200, description="Trường bẫy chống bot, luôn để trống")
    started_at: Optional[datetime] = Field(None, description="Thời điểm người dùng bắt đầu điền form")

class ApplicationTrackingRequest(BaseModel):
    code: str = Field(..., min_length=8, max_length=50)

class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=8, max_length=50)
    current_company: Optional[str] = Field(None, max_length=255)
    current_position: Optional[str] = Field(None, max_length=255)
    years_of_experience: Optional[int] = Field(None, ge=0, le=60)
    cv_extracted_data: Optional[dict[str, Any]] = None
    tags: Optional[list[str]] = None
    recruiter_notes: Optional[str] = Field(None, max_length=5000)
    rating: Optional[int] = Field(None, ge=0, le=5)
    fit_score: Optional[int] = Field(None, ge=0, le=100)
    screening_result: Optional[str] = Field(None, pattern="^(pending|passed|failed)$")
    is_talent_pool: Optional[bool] = None

class ApplicationStageUpdate(BaseModel):
    to_status: str = Field(..., description="Trạng thái phễu mới: applied, screening, interviewing, offered, hired, rejected")
    note: Optional[str] = Field(None, max_length=1000, description="Ghi chú nhận xét của HR")

class CandidateNoteCreate(BaseModel):
    note: str = Field(..., min_length=2, max_length=2000)

class CandidateMergeRequest(BaseModel):
    duplicate_id: int = Field(..., gt=0)

class SavedFilterCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    criteria: dict[str, Any]

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
    cv_filename: Optional[str] = None
    cv_content_type: Optional[str] = None
    cv_extracted_data: dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    recruiter_notes: Optional[str] = None
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    years_of_experience: Optional[int] = None
    cover_letter: Optional[str] = None
    current_department: Optional[str] = None
    referral_code: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    logs: List[ApplicationLogResponse] = Field(default_factory=list)
    rating: int = 0
    fit_score: int = 0
    screening_result: str = "pending"
    sla_due_at: Optional[str] = None
    sla_overdue: bool = False
    is_talent_pool: bool = False
    merged_into_id: Optional[int] = None

class PaginatedApplicationsResponse(BaseModel):
    items: List[ApplicationResponse]
    total: int
    page: int
    page_size: int
    pages: int
