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

class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    managerName: Optional[str] = None
    managerTitle: Optional[str] = None
    headcountCurrent: Optional[int] = None
    headcountBudget: Optional[int] = None
    active_jobs: Optional[int] = None
    status: Optional[str] = None
    parentId: Optional[str] = None

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

class SalaryBandUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    level: Optional[str] = None
    minSalary: Optional[int] = None
    maxSalary: Optional[int] = None
    department: Optional[str] = None
    status: Optional[str] = None

class SalaryBandResponse(SalaryBandBase):
    id: str

    class Config:
        from_attributes = True
