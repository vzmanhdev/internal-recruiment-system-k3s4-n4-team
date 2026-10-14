from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

class InterviewTimes(BaseModel):
    @field_validator('start_time', 'end_time', 'proposed_start_time', check_fields=False)
    @classmethod
    def normalize_utc(cls, value):
        return value.astimezone(timezone.utc).replace(tzinfo=None) if value and value.tzinfo else value

class InterviewerInfo(BaseModel):
    id: int
    full_name: str
    email: str

class InterviewCreate(InterviewTimes):
    application_id: int = Field(..., description="ID hồ sơ ứng tuyển")
    title: str = Field(..., min_length=2, max_length=255, description="Tiêu đề (VD: Phỏng vấn Chuyên môn Vòng 1)")
    interview_type: str = Field("online", description="Hình thức: online hoặc offline")
    location_or_link: str = Field(..., min_length=2, description="Link Google Meet hoặc địa điểm phòng họp")
    start_time: datetime = Field(..., description="Thời gian bắt đầu")
    end_time: datetime = Field(..., description="Thời gian kết thúc")
    notes: Optional[str] = Field(None, description="Ghi chú dặn dò ứng viên/hội đồng")
    interviewer_ids: List[int] = Field(default=[], description="Danh sách ID người phỏng vấn được phân công")

class InterviewUpdate(InterviewTimes):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    interview_type: Optional[str] = Field(None)
    location_or_link: Optional[str] = Field(None)
    start_time: Optional[datetime] = Field(None)
    end_time: Optional[datetime] = Field(None)
    notes: Optional[str] = Field(None)
    status: Optional[str] = Field(None, description="scheduled, completed, cancelled, rescheduled")
    interviewer_ids: Optional[List[int]] = Field(None)

class CandidateInterviewResponse(InterviewTimes):
    response: str = Field(..., pattern="^(confirmed|declined|reschedule_requested)$")
    note: Optional[str] = Field(None, max_length=1000)
    proposed_start_time: Optional[datetime] = None

class InterviewConflictCheck(InterviewTimes):
    start_time: datetime
    end_time: datetime
    interviewer_ids: List[int] = Field(default_factory=list)
    interview_type: str = "online"
    location_or_link: str = ""
    exclude_interview_id: Optional[int] = None

class InterviewConflictItem(BaseModel):
    interview_id: int
    code: str
    title: str
    start_time: str
    end_time: str
    reason: str

class InterviewConflictResponse(BaseModel):
    has_conflict: bool
    conflicts: List[InterviewConflictItem] = Field(default_factory=list)

class InterviewBatchCreate(BaseModel):
    interviews: List[InterviewCreate] = Field(..., min_length=1, max_length=30)

class InterviewResponse(BaseModel):
    id: int
    code: str
    application_id: int
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    title: str
    interview_type: str
    location_or_link: str
    start_time: str
    end_time: str
    notes: Optional[str] = None
    status: str
    candidate_response: str = "pending"
    candidate_response_at: Optional[str] = None
    candidate_response_note: Optional[str] = None
    candidate_proposed_start_time: Optional[str] = None
    response_token: Optional[str] = None
    candidate_email: Optional[str] = None
    accepts_response: bool = True
    interviewers: List[InterviewerInfo] = []
    created_at: str
    updated_at: str

class PaginatedInterviewsResponse(BaseModel):
    items: List[InterviewResponse]
    total: int
    page: int
    page_size: int
    pages: int
