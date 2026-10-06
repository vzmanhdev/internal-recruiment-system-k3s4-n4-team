from typing import List, Optional, Union
from pydantic import BaseModel, Field

class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    department: str = Field(..., min_length=2, max_length=100)
    location: str = Field(default="Hà Nội", max_length=100)
    employment_type: str = Field(default="Toàn thời gian", max_length=50)
    openings: int = Field(default=1, ge=1)
    salary_range: str = Field(default="Thỏa thuận", max_length=100)
    experience_level: str = Field(default="Chuyên viên / Mid-level", max_length=50)
    deadline: str = Field(..., max_length=50)
    status: str = Field(default="open", max_length=30)
    approval_status: Optional[str] = Field(default="pending", max_length=30)
    description: str = Field(..., min_length=10)
    requirements: Union[str, List[str]]
    benefits: Optional[Union[str, List[str]]] = Field(default="")
    requisition_id: Optional[int] = None

class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    openings: Optional[int] = None
    salary_range: Optional[str] = None
    requisition_id: Optional[int] = None
    experience_level: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None
    approval_status: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[Union[str, List[str]]] = None
    benefits: Optional[Union[str, List[str]]] = None

class CandidateStageUpdateRequest(BaseModel):
    stage: str
    rating: Optional[int] = None
    hr_notes: Optional[str] = None

class InterviewCreateRequest(BaseModel):
    application_id: int
    candidate_name: str
    job_title: str
    interview_date: str
    interview_time: str
    format: str = "Online"
    location_or_link: str
    interviewer_names: str
    round_name: str = "Vòng 1 - Chuyên môn"

class ReferralStatusUpdateRequest(BaseModel):
    status: str
    bonus_status: Optional[str] = None
    notes: Optional[str] = None

class JobDraftFromRequisitionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    location: str = Field(default="Hà Nội", max_length=100)
    employment_type: str = Field(default="Toàn thời gian", max_length=50)
    deadline: str = Field(..., max_length=50)
    show_salary: bool = Field(default=True)
    status: str = Field(default="open", max_length=30)
