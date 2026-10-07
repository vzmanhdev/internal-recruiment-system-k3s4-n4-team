from pydantic import BaseModel
from typing import Optional

class RequisitionBase(BaseModel):
    code: str
    title: str
    department: str
    level: Optional[str] = "Senior"
    targetCount: Optional[int] = 1
    recruiterName: Optional[str] = "Trần Thị Mai"
    targetDate: str
    openDays: Optional[int] = 0
    priority: Optional[str] = "High"
    status: Optional[str] = "open"
    minSalary: Optional[int] = None
    maxSalary: Optional[int] = None
    description: Optional[str] = None

class RequisitionCreate(RequisitionBase):
    pass

class RequisitionResponse(RequisitionBase):
    id: str

    class Config:
        from_attributes = True
