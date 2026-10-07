from pydantic import BaseModel
from typing import Optional, List

class JobBase(BaseModel):
    title: str
    department: str
    location: Optional[str] = "Hà Nội"
    employmentType: Optional[str] = "Toàn thời gian"
    openings: Optional[str] = "1-2 người"
    status: Optional[str] = "open"
    description: Optional[str] = None
    skills: Optional[List[str]] = []
    deadline: Optional[str] = None
    responsibilities: Optional[List[str]] = []
    requirements: Optional[List[str]] = []

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str

    class Config:
        from_attributes = True
