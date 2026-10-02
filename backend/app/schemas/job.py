from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class JobPostingCreate(BaseModel):
    requisition_id: Optional[int] = Field(None, description="ID của tờ trình được duyệt (nếu tạo từ tờ trình)")
    title: str = Field(..., min_length=3, max_length=255)
    department_id: int
    job_title_id: Optional[int] = None
    quantity: int = Field(1, ge=1, le=100)
    min_salary: Optional[float] = Field(None, ge=0)
    max_salary: Optional[float] = Field(None, ge=0)
    is_salary_negotiable: bool = False
    work_location: str = Field("Trụ sở chính", min_length=2, max_length=255)
    employment_type: str = "full_time"
    experience_years: str = Field("1-3 năm", max_length=50)
    deadline: Optional[datetime] = None
    is_featured: bool = False
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: str = "published"

    @model_validator(mode="after")
    def validate_values(self):
        if self.max_salary is not None and self.min_salary is not None and self.max_salary < self.min_salary:
            raise ValueError("Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu")
        if self.status not in {"draft", "published", "paused", "expired"}:
            raise ValueError("Trạng thái tin tuyển dụng không hợp lệ")
        return self


class JobPostingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    department_id: Optional[int] = None
    job_title_id: Optional[int] = None
    quantity: Optional[int] = Field(None, ge=1, le=100)
    min_salary: Optional[float] = Field(None, ge=0)
    max_salary: Optional[float] = Field(None, ge=0)
    is_salary_negotiable: Optional[bool] = None
    work_location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_years: Optional[str] = None
    deadline: Optional[datetime] = None
    is_featured: Optional[bool] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: Optional[str] = None


class JobPostingResponse(BaseModel):
    id: int
    code: str
    requisition_id: Optional[int] = None
    requisition_code: Optional[str] = None
    title: str
    department_id: int
    department_name: Optional[str] = None
    job_title_id: Optional[int] = None
    job_title_name: Optional[str] = None
    quantity: int
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    is_salary_negotiable: bool
    work_location: str
    employment_type: str
    experience_years: str
    deadline: Optional[str] = None
    is_featured: bool
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: str
    views_count: int
    created_by_id: int
    creator_name: Optional[str] = None
    created_at: str
    updated_at: str


class PaginatedJobPostingsResponse(BaseModel):
    items: List[JobPostingResponse]
    total: int
    page: int
    page_size: int
    pages: int
