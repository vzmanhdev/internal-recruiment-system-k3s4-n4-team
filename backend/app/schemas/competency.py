from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator

class CriteriaItemCreate(BaseModel):
    code: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=200, description='Tên tiêu chí')
    category: str = Field('Chuyên môn', description='Phân loại tiêu chí')
    weight: float = Field(..., ge=1, le=100, description='Trọng số phần trăm')
    required_level: int = Field(3, ge=1, le=5, description='Mức điểm chuẩn từ 1 đến 5')
    description: Optional[str] = None
    rubric_scale: Optional[Dict[str, str]] = None
    interview_questions: Optional[List[str]] = None
    sort_order: Optional[int] = 0

class FrameworkCreate(BaseModel):
    code: Optional[str] = None
    name: str = Field(..., min_length=3, max_length=200, description='Tên khung năng lực')
    category: Optional[str] = 'Chuyên môn kỹ thuật'
    description: Optional[str] = None
    job_titles: List[str] = Field(..., min_length=1, description='Danh sách chức danh áp dụng (AC01, AC03)')
    criteria: List[CriteriaItemCreate] = Field(..., min_length=1, description='Bộ tiêu chí đánh giá')

    @field_validator('criteria')
    @classmethod
    def validate_total_weight(cls, criteria_list: List[CriteriaItemCreate]):
        total_weight = round(sum(c.weight for c in criteria_list), 2)
        if total_weight != 100.0:
            raise ValueError(f'Tổng trọng số của các tiêu chí trong khung năng lực phải bằng chính xác 100% (Hiện tại là {total_weight}%). Vui lòng điều chỉnh lại trọng số.')
        return criteria_list

class FrameworkUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    job_titles: Optional[List[str]] = None
    criteria: Optional[List[CriteriaItemCreate]] = None
    status: Optional[str] = None

    @field_validator('criteria')
    @classmethod
    def validate_total_weight_update(cls, criteria_list: Optional[List[CriteriaItemCreate]]):
        if criteria_list is not None:
            total_weight = round(sum(c.weight for c in criteria_list), 2)
            if total_weight != 100.0:
                raise ValueError(f'Tổng trọng số của các tiêu chí trong khung năng lực phải bằng chính xác 100% (Hiện tại là {total_weight}%). Vui lòng điều chỉnh lại trọng số.')
        return criteria_list
