from pydantic import BaseModel
from typing import Optional, List

class DepartmentBase(BaseModel):
    code: str
    name: str
    managerName: Optional[str] = "Chưa bổ nhiệm"
    managerTitle: Optional[str] = "Trưởng Đơn Vị"
    headcountCurrent: Optional[int] = 0
    headcountBudget: Optional[int] = 5
    active_jobs: Optional[int] = 0
    status: Optional[str] = "active"
    parentId: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: str

    class Config:
        from_attributes = True

class SalaryBandBase(BaseModel):
    code: str
    title: str
    level: str
    minSalary: int
    maxSalary: int
    department: str
    status: Optional[str] = "active"

class SalaryBandCreate(SalaryBandBase):
    pass

class SalaryBandResponse(SalaryBandBase):
    id: str

    class Config:
        from_attributes = True
