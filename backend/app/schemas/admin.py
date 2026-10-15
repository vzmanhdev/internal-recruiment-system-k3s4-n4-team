import re
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.auth import UserResponse

VALID_ROLES = {"candidate", "employee", "recruiter", "manager", "hr_manager", "admin", "interviewer", "approver"}


class AdminCreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=20)
    roles: List[str] = Field(default_factory=lambda: ["employee"], min_length=1)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Mật khẩu phải gồm ít nhất một chữ và một số")
        return value

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, roles: List[str]) -> List[str]:
        normalized = list(dict.fromkeys(roles))
        if any(role not in VALID_ROLES for role in normalized):
            raise ValueError("Vai trò không hợp lệ")
        return normalized


class UpdateRolesRequest(BaseModel):
    roles: List[str] = Field(..., min_length=1)

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, roles: List[str]) -> List[str]:
        normalized = list(dict.fromkeys(roles))
        if any(role not in VALID_ROLES for role in normalized):
            raise ValueError("Vai trò không hợp lệ")
        return normalized


class LockUserRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class PaginatedUsersResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int
