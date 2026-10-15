from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class OfferCreate(BaseModel):
    application_id: int = Field(..., description="ID hồ sơ ứng tuyển")
    position_title: str = Field(..., min_length=2, max_length=255, description="Chức danh công việc đề xuất")
    offered_salary: float = Field(..., ge=0, allow_inf_nan=False, description="Mức lương đề xuất (VNĐ)")
    start_date: datetime = Field(..., description="Ngày bắt đầu làm việc")
    probation_period_months: int = Field(2, ge=0, le=12, description="Thời gian thử việc (Tháng)")
    work_location: str = Field(..., min_length=2, description="Địa điểm làm việc")
    expiration_date: datetime = Field(..., description="Hạn ứng viên phản hồi Offer")
    notes: Optional[str] = Field(None, description="Ghi chú điều khoản phúc lợi thêm")
    salary_exception_reason: Optional[str] = Field(None, max_length=2000)

class OfferStatusUpdate(BaseModel):
    status: str = Field(..., description="draft, sent, accepted, declined, expired")
    notes: Optional[str] = Field(None)

class OfferResponse(BaseModel):
    id: int
    code: str
    application_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    position_title: str
    offered_salary: float
    start_date: str
    probation_period_months: int
    work_location: str
    expiration_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    salary_exception_reason: Optional[str] = None
    response_notes: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    approvals: list[dict] = Field(default_factory=list)
    created_at: str
    updated_at: str

class PaginatedOffersResponse(BaseModel):
    items: List[OfferResponse]
    total: int
    page: int
    page_size: int
    pages: int

class OnboardingUpdate(BaseModel):
    welcome_email_sent: Optional[bool] = None
    equipment_prepared: Optional[bool] = None
    account_created: Optional[bool] = None
    documents_submitted: Optional[bool] = None
    orientation_scheduled: Optional[bool] = None
    status: Optional[str] = Field(None, description="pending, in_progress, completed")

class OnboardingResponse(BaseModel):
    id: int
    application_id: int
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    department_name: Optional[str] = None
    welcome_email_sent: bool
    equipment_prepared: bool
    account_created: bool
    documents_submitted: bool
    orientation_scheduled: bool
    status: str
    created_at: str
    updated_at: str

class PaginatedOnboardingResponse(BaseModel):
    items: List[OnboardingResponse]
    total: int
    page: int
    page_size: int
    pages: int
