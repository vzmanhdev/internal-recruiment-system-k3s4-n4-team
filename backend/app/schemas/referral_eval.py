from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

class ReferralCreate(BaseModel):
    job_id: int = Field(..., description="ID vị trí tuyển dụng giới thiệu")
    candidate_name: str = Field(..., min_length=2, max_length=255, description="Tên ứng viên được giới thiệu")
    candidate_email: EmailStr = Field(..., description="Email ứng viên")
    candidate_phone: str = Field(..., min_length=8, max_length=50, description="Số điện thoại ứng viên")
    cv_url: str = Field(..., description="Link CV của ứng viên")
    relationship_note: Optional[str] = Field(None, max_length=1000, description="Mối quan hệ / Ghi chú giới thiệu")

class ReferralStatusUpdate(BaseModel):
    status: str = Field(..., description="Trạng thái: pending, contacted, interviewed, hired, bonus_paid, rejected")
    bonus_amount: Optional[float] = Field(None, ge=0, description="Số tiền thưởng giới thiệu (VNĐ)")

class ReferralResponse(BaseModel):
    id: int
    code: str
    referrer_id: int
    referrer_name: Optional[str] = None
    job_id: int
    job_title: Optional[str] = None
    department_name: Optional[str] = None
    candidate_name: str
    candidate_email: str
    candidate_phone: str
    cv_url: str
    relationship_note: Optional[str] = None
    status: str
    bonus_amount: float
    created_at: str
    updated_at: str

class PaginatedReferralsResponse(BaseModel):
    items: List[ReferralResponse]
    total: int
    page: int
    page_size: int
    pages: int

class EvaluationCreate(BaseModel):
    overall_score: float = Field(..., ge=1.0, le=5.0, description="Điểm tổng quan (1.0 - 5.0)")
    competency_score: float = Field(..., ge=1.0, le=5.0, description="Điểm năng lực chuyên môn (1.0 - 5.0)")
    culture_fit_score: float = Field(..., ge=1.0, le=5.0, description="Điểm phù hợp văn hóa (1.0 - 5.0)")
    recommendation: str = Field(..., description="Đề xuất: strong_hire, hire, hold, reject")
    feedback: str = Field(..., min_length=5, max_length=2000, description="Nhận xét chi tiết")

class EvaluationResponse(BaseModel):
    interview_id: Optional[int] = None
    framework_name: Optional[str] = None
    criteria_scores: List[dict] = Field(default_factory=list)
    id: int
    application_id: int
    evaluator_id: int
    evaluator_name: Optional[str] = None
    overall_score: float
    competency_score: float
    culture_fit_score: float
    recommendation: str
    feedback: str
    created_at: str
    updated_at: str

class CriterionScoreInput(BaseModel):
    criterion_id: int
    score: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=5, max_length=1000)

class ScorecardSubmit(BaseModel):
    criteria: List[CriterionScoreInput] = Field(..., min_length=1, max_length=100)
    recommendation: str = Field(..., pattern='^(strong_hire|hire|hold|reject)$')
    feedback: str = Field(..., min_length=5, max_length=2000)
