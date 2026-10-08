from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class RequisitionCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Tên vị trí tuyển dụng")
    department_id: int = Field(..., description="ID phòng ban yêu cầu")
    job_title_id: Optional[int] = Field(None, description="ID chức danh liên quan")
    quantity: int = Field(1, ge=1, le=100, description="Số lượng cần tuyển")
    reason: str = Field(..., description="Lý do tuyển dụng: new_headcount, replacement, expansion")
    replacement_for: Optional[str] = Field(None, max_length=255, description="Nhân sự thay thế (nếu lý do là replacement)")
    min_salary: Optional[float] = Field(None, ge=0)
    max_salary: Optional[float] = Field(None, ge=0)
    work_location: str = Field("Trụ sở chính", max_length=255)
    employment_type: str = Field("full_time", description="full_time, part_time, contract")
    experience_years: str = Field("1-3 năm", max_length=50)
    deadline: Optional[datetime] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    submit_immediately: bool = Field(False, description="Nếu True, chuyển thẳng sang trạng thái pending_dept")

class RequisitionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    department_id: Optional[int] = None
    job_title_id: Optional[int] = None
    quantity: Optional[int] = Field(None, ge=1, le=100)
    reason: Optional[str] = None
    replacement_for: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    work_location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_years: Optional[str] = None
    deadline: Optional[datetime] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None

class RequisitionApprovalAction(BaseModel):
    comment: Optional[str] = Field(None, max_length=1000, description="Ghi chú hoặc lý do từ chối")
    override_budget: bool = False

class RequisitionAssignment(BaseModel):
    recruiter_id: int = Field(gt=0)
    support_recruiter_id: Optional[int] = Field(None, gt=0)

class RequisitionLogResponse(BaseModel):
    id: int
    requisition_id: int
    approver_id: int
    approver_name: Optional[str] = None
    approver_role: Optional[str] = None
    action: str
    comment: Optional[str] = None
    created_at: str

class RequisitionResponse(BaseModel):
    id: int
    recruiter_id: Optional[int] = None
    recruiter_name: Optional[str] = None
    support_recruiter_id: Optional[int] = None
    support_recruiter_name: Optional[str] = None
    headcount_budget_id: Optional[int] = None
    reserved_monthly_salary: Optional[float] = None
    code: str
    title: str
    department_id: int
    department_name: Optional[str] = None
    job_title_id: Optional[int] = None
    job_title_name: Optional[str] = None
    quantity: int
    reason: str
    replacement_for: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    work_location: str
    employment_type: str
    experience_years: str
    deadline: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: str
    created_by_id: int
    creator_name: Optional[str] = None
    created_at: str
    updated_at: str
    approval_logs: List[RequisitionLogResponse] = []

class PaginatedRequisitionsResponse(BaseModel):
    items: List[RequisitionResponse]
    total: int
    page: int
    page_size: int
    pages: int
