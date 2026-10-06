from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.admin import AdminCreateUserRequest, LockUserRequest, PaginatedUsersResponse, UpdateRolesRequest
from app.schemas.auth import UserResponse

router = APIRouter()

def record_audit_log(
    db: Session,
    actor_name: str,
    actor_email: str,
    action: str,
    target: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
):
    try:
        log = AuditLog(
            actor_name=actor_name,
            actor_email=actor_email,
            action=action,
            target=target,
            details=details,
            ip_address=ip_address or "127.0.0.1",
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")

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
        # Fix: Exact role token matching in comma-separated strings
        # e.g., 'manager' should NOT match 'hr_manager'
        query = query.filter(
            or_(
                User.role == role,
                User.role.like(f"{role},%"),
                User.role.like(f"%,{role},%"),
                User.role.like(f"%,{role}"),
            )
        )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [user.to_dict() for user in users], "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUserRequest,
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

    record_audit_log(
        db=db,
        actor_name=admin.full_name,
        actor_email=admin.email,
        action="Tạo tài khoản",
        target=f"{user.full_name} ({user.email})",
        details=f"Đã tạo tài khoản với vai trò: {user.role}",
    )
    return user.to_dict()


@router.put("/users/{user_id}/roles", response_model=UserResponse)
def update_roles(
    user_id: int,
    payload: UpdateRolesRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if user.id == admin.id and "admin" not in payload.roles:
        raise HTTPException(status_code=400, detail="Bạn không thể tự thu hồi quyền Quản trị viên của mình")
    old_roles = user.role
    user.role = ",".join(payload.roles)
    db.commit()
    db.refresh(user)

    record_audit_log(
        db=db,
        actor_name=admin.full_name,
        actor_email=admin.email,
        action="Cập nhật vai trò",
        target=f"{user.full_name} ({user.email})",
        details=f"Thay đổi vai trò từ [{old_roles}] sang [{user.role}]",
    )
    return user.to_dict()


@router.post("/users/{user_id}/lock", response_model=UserResponse)
def lock_user(
    user_id: int,
    payload: LockUserRequest,
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

    record_audit_log(
        db=db,
        actor_name=admin.full_name,
        actor_email=admin.email,
        action="Khóa tài khoản",
        target=f"{user.full_name} ({user.email})",
        details=f"Lý do khóa: {user.lock_reason}",
    )
    return user.to_dict()


@router.post("/users/{user_id}/unlock", response_model=UserResponse)
def unlock_user(
    user_id: int,
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

    record_audit_log(
        db=db,
        actor_name=admin.full_name,
        actor_email=admin.email,
        action="Mở khóa tài khoản",
        target=f"{user.full_name} ({user.email})",
        details="Tài khoản đã được mở khóa và kích hoạt lại",
    )
    return user.to_dict()


@router.get("/audit-logs")
def list_audit_logs(
    search: str = "",
    action: str = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(AuditLog)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.actor_name.ilike(term),
                AuditLog.actor_email.ilike(term),
                AuditLog.target.ilike(term),
                AuditLog.details.ilike(term),
            )
        )
    if action != "all":
        query = query.filter(AuditLog.action == action)

    total = query.count()
    pages = max(1, ceil(total / page_size))
    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [log.to_dict() for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
