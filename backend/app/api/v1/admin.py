from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.models.system import AuditLog, SystemSetting
from app.schemas.admin import AdminCreateUserRequest, LockUserRequest, PaginatedUsersResponse, UpdateRolesRequest
from app.schemas.auth import UserResponse
from app.schemas.system import SystemSettingsUpdate
from app.services.audit import write_audit_log

router = APIRouter()


def get_or_create_settings(db: Session) -> SystemSetting:
    current = db.query(SystemSetting).filter(SystemSetting.id == 1).first()
    if not current:
        current = SystemSetting(id=1)
        db.add(current)
        db.commit()
        db.refresh(current)
    return current


@router.get("/settings")
def get_settings(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_admin(authorization, db)
    return get_or_create_settings(db).to_dict()


@router.put("/settings")
def update_settings(
    payload: SystemSettingsUpdate,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    current = get_or_create_settings(db)
    for key, value in payload.model_dump().items():
        setattr(current, key, value)
    db.commit()
    db.refresh(current)
    write_audit_log(db, action="Cập nhật cấu hình hệ thống", module="Cấu hình", request=request, user=admin, details="Đã lưu các thiết lập hệ thống")
    return current.to_dict()


@router.get("/audit-logs")
def list_audit_logs(
    search: str = "",
    module: str = "all",
    limit: int = Query(200, ge=1, le=500),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(AuditLog)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(AuditLog.actor.ilike(term), AuditLog.email.ilike(term), AuditLog.action.ilike(term)))
    if module != "all":
        query = query.filter(AuditLog.module == module)
    return [item.to_dict() for item in query.order_by(AuditLog.created_at.desc()).limit(limit).all()]


@router.get("/users", response_model=PaginatedUsersResponse)
def list_users(
    search: str = "",
    account_status: str = Query("all", alias="status"),
    role: str = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(User)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(term), User.email.ilike(term)))
    if account_status != "all":
        query = query.filter(User.account_status == account_status)
    if role != "all":
        query = query.filter(User.role.ilike(f"%{role}%"))

    total = query.count()
    pages = max(1, ceil(total / page_size))
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [user.to_dict() for user in users], "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUserRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    if db.query(User).filter(User.email == payload.email).first():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Email này đã tồn tại trong hệ thống.", "field_errors": {"email": "Email này đã tồn tại."}},
        )
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=",".join(payload.roles),
        is_active=True,
        account_status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    write_audit_log(db, action="Tạo tài khoản", module="Quản lý tài khoản", request=request, user=admin, details=f"Đã tạo {user.email}")
    return user.to_dict()


@router.put("/users/{user_id}/roles", response_model=UserResponse)
def update_roles(
    user_id: int,
    payload: UpdateRolesRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if user.id == admin.id and "admin" not in payload.roles:
        raise HTTPException(status_code=400, detail="Bạn không thể tự thu hồi quyền Quản trị viên của mình")
    user.role = ",".join(payload.roles)
    db.commit()
    db.refresh(user)
    write_audit_log(db, action="Cập nhật vai trò", module="Quản lý tài khoản", request=request, user=admin, details=f"{user.email}: {user.role}")
    return user.to_dict()


@router.post("/users/{user_id}/lock", response_model=UserResponse)
def lock_user(
    user_id: int,
    payload: LockUserRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự khóa tài khoản của mình")
    user.is_active = False
    user.account_status = "locked"
    user.lock_reason = payload.reason.strip()
    db.commit()
    db.refresh(user)
    write_audit_log(db, action="Khóa tài khoản", module="Bảo mật", request=request, user=admin, status="warning", details=f"{user.email}: {user.lock_reason}")
    return user.to_dict()


@router.post("/users/{user_id}/unlock", response_model=UserResponse)
def unlock_user(
    user_id: int,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    user.is_active = True
    user.account_status = "active"
    user.lock_reason = None
    db.commit()
    db.refresh(user)
    write_audit_log(db, action="Mở khóa tài khoản", module="Bảo mật", request=request, user=admin, details=user.email)
    return user.to_dict()
