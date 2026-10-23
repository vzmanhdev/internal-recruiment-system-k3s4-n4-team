import re
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.auth import UserResponse

VALID_ROLES = {
    "admin",
    "hr_manager",
    "recruiter",
    "hiring_manager",
    "interviewer",
    "approver",
    "candidate",
    "manager",
    "dept_manager"
}


class AdminCreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=20)
    roles: List[str] = Field(default_factory=lambda: ["candidate"], min_length=1)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        from app.core.security import validate_password_complexity
        return validate_password_complexity(value, field_name="Mật khẩu")

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, roles: List[str]) -> List[str]:
        from app.db.rbac_catalog import canonical_role
        normalized = list(dict.fromkeys(canonical_role(r) for r in roles))
        if any(role not in VALID_ROLES for role in normalized):
            raise ValueError("Vai trò không hợp lệ")
        return normalized


class UpdateRolesRequest(BaseModel):
    roles: List[str] = Field(..., min_length=1)

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, roles: List[str]) -> List[str]:
        from app.db.rbac_catalog import canonical_role
        normalized = list(dict.fromkeys(canonical_role(r) for r in roles))
        if any(role not in VALID_ROLES for role in normalized):
            raise ValueError("Vai trò không hợp lệ")
        return normalized


class LockUserRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class ResetUserPasswordRequest(BaseModel):
    new_password: Optional[str] = Field(None, min_length=8, description="Mật khẩu mới nếu muốn chỉ định, nếu không truyền sẽ tự sinh ngẫu nhiên")

    @field_validator("new_password")
    @classmethod
    def validate_optional_password(cls, value: Optional[str]) -> Optional[str]:
        if value:
            from app.core.security import validate_password_complexity
            return validate_password_complexity(value, field_name="Mật khẩu mới")
        return value


class PaginatedUsersResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ImportRowPreview(BaseModel):
    row_num: int
    full_name: str
    email: str
    phone: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    status: str  # VALID, ERROR, DUPLICATE
    error_reason: Optional[str] = None


class ImportPreviewResponse(BaseModel):
    job_id: str
    filename: str
    total: int
    valid_count: int
    error_count: int
    items: List[ImportRowPreview]
    page: int
    page_size: int
    pages: int


class ImportCommitRequest(BaseModel):
    job_id: str
    skip_errors: bool = True


class ImportCommitResponse(BaseModel):
    job_id: str
    total: int
    imported: int
    skipped: int
    failed: int
    message: str
    errors: List[dict] = Field(default_factory=list)


