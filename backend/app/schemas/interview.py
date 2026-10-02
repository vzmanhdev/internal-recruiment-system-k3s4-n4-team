from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class InterviewerInfo(BaseModel):
    id: int
    full_name: str
    email: str

class InterviewCreate(BaseModel):
    application_id: int = Field(..., description="ID hồ sơ ứng tuyển")
    title: str = Field(..., min_length=2, max_length=255, description="Tiêu đề (VD: Phỏng vấn Chuyên môn Vòng 1)")
    interview_type: str = Field("online", description="Hình thức: online hoặc offline")
    location_or_link: str = Field(..., min_length=2, description="Link Google Meet hoặc địa điểm phòng họp")
    start_time: datetime = Field(..., description="Thời gian bắt đầu")
    end_time: datetime = Field(..., description="Thời gian kết thúc")
    notes: Optional[str] = Field(None, description="Ghi chú dặn dò ứng viên/hội đồng")
    interviewer_ids: List[int] = Field(default=[], description="Danh sách ID người phỏng vấn được phân công")

class InterviewUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    interview_type: Optional[str] = Field(None)
    location_or_link: Optional[str] = Field(None)
    start_time: Optional[datetime] = Field(None)
    end_time: Optional[datetime] = Field(None)
    notes: Optional[str] = Field(None)
    status: Optional[str] = Field(None, description="scheduled, completed, cancelled, rescheduled")
    interviewer_ids: Optional[List[int]] = Field(None)

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
    interviewers: List[InterviewerInfo] = []
    created_at: str
    updated_at: str

class PaginatedInterviewsResponse(BaseModel):
    items: List[InterviewResponse]
    total: int
    page: int
    page_size: int
    pages: int
