from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=30)
    parent_id: Optional[int] = None
    sort_order: int = Field(0, ge=0)

class JobTitleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    department_id: Optional[int] = None
    level: str = Field(..., min_length=2, max_length=60)
    min_salary: float = Field(..., ge=0)
    max_salary: float = Field(..., ge=0)
    description: Optional[str] = None

    @field_validator("max_salary")
    @classmethod
    def salary_order(cls, value: float, info):
        minimum = info.data.get("min_salary")
        if minimum is not None and value < minimum:
            raise ValueError("Mức lương tối đa phải lớn hơn hoặc bằng mức tối thiểu")
        return value

class CompetencyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=80)
    description: Optional[str] = None
    required_level: int = Field(3, ge=1, le=5)
    weight: float = Field(0, ge=0, le=100)
    sort_order: int = Field(0, ge=0)

class CategoryCreate(BaseModel):
    category_type: str = Field(..., min_length=2, max_length=60)
    name: str = Field(..., min_length=2, max_length=120)
    sort_order: int = Field(0, ge=0)

class ReorderCategories(BaseModel):
    ids: List[int] = Field(..., min_length=1)
