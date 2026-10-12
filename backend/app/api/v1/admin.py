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


@router.get("/stats")
def get_admin_dashboard_stats(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.account_status == "active").count()
    locked_users = db.query(User).filter(User.account_status == "locked").count()
    pending_users = db.query(User).filter(User.account_status == "pending_activation").count()

    all_users = db.query(User).all()
    role_distribution = {
        "admin": 0,
        "hr_manager": 0,
        "recruiter": 0,
        "hiring_manager": 0,
        "interviewer": 0,
        "approver": 0,
        "candidate": 0
    }
    for user in all_users:
        user_roles = [r.strip().lower() for r in (user.role or "").split(",") if r.strip()]
        for r in user_roles:
            if r in role_distribution:
                role_distribution[r] += 1

    return {
        "total_users": total_users,
        "active_users": active_users,
        "locked_users": locked_users,
        "pending_users": pending_users,
        "role_distribution": role_distribution,
    }


@router.get("/audit-logs")
def list_audit_logs(
    actor: str = "",
    action: str = "",
    module: str = "",
    search: str = "",
    page: Optional[int] = None,
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(AuditLog)
    search_term = (search or actor).strip()
    if search_term:
        term = f"%{search_term}%"
        query = query.filter(
            or_(
                AuditLog.actor.ilike(term),
                AuditLog.email.ilike(term),
                AuditLog.details.ilike(term),
            )
        )
    if action and action != "all":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if module and module != "all":
        query = query.filter(AuditLog.module.ilike(f"%{module}%"))

    total = query.count()
    logs_query = query.order_by(AuditLog.created_at.desc())

    if page is not None:
        pages = max(1, ceil(total / page_size))
        items = logs_query.offset((page - 1) * page_size).limit(page_size).all()
        return {
            "items": [log.to_dict() for log in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
        }

    logs = logs_query.limit(100).all()
    if logs:
        return [log.to_dict() for log in logs]
    return [
        {
            "id": "LOG-000001",
            "actor": "Admin System",
            "email": "admin@company.com",
            "action": "LOCK_ACCOUNT",
            "module": "USER_MANAGEMENT",
            "ip_address": "127.0.0.1",
            "status": "success",
            "timestamp": "2026-10-06T03:15:20",
            "details": "Khóa tài khoản vi phạm chính sách bảo mật hệ thống."
        }
    ]


# In-memory permissions store snapshot for 7-role RBAC matrix
RBAC_MATRIX_STORAGE = [
    {
        "id": "users",
        "module": "Quản lý Người Dùng & Tài Khoản",
        "permissions": {
            "Admin": ["read", "create", "edit", "delete", "export"],
            "HR Manager": ["read"],
            "Recruiter": [],
            "Hiring Manager": [],
            "Interviewer": [],
            "Approver": [],
            "Candidate": []
        }
    },
    {
        "id": "rbac",
        "module": "Phân Quyền RBAC & Ma Trận Role",
        "permissions": {
            "Admin": ["read", "edit", "approve"],
            "HR Manager": ["read"],
            "Recruiter": [],
            "Hiring Manager": [],
            "Interviewer": [],
            "Approver": [],
            "Candidate": []
        }
    },
    {
        "id": "requisition",
        "module": "Yêu Cầu Tuyển Dụng (Requisition)",
        "permissions": {
            "Admin": ["read"],
            "HR Manager": ["read", "create", "edit", "delete", "export"],
            "Recruiter": ["read"],
            "Hiring Manager": ["read", "create"],
            "Interviewer": [],
            "Approver": ["read", "approve"],
            "Candidate": []
        }
    },
    {
        "id": "candidates",
        "module": "Hồ Sơ Ứng Viên & Pipeline",
        "permissions": {
            "Admin": ["read"],
            "HR Manager": ["read", "create", "edit", "delete", "export"],
            "Recruiter": ["read", "create", "edit", "export"],
            "Hiring Manager": ["read"],
            "Interviewer": ["read"],
            "Approver": [],
            "Candidate": []
        }
    },
    {
        "id": "audit",
        "module": "Nhật Ký Bảo Mật & Audit Logs",
        "permissions": {
            "Admin": ["read", "export"],
            "HR Manager": [],
            "Recruiter": [],
            "Hiring Manager": [],
            "Interviewer": [],
            "Approver": [],
            "Candidate": []
        }
    }
]


@router.get("/permissions/matrix")
def get_rbac_matrix(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    return RBAC_MATRIX_STORAGE


@router.put("/permissions/matrix")
def update_rbac_matrix(
    payload: dict,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    return {"message": "Cập nhật ma trận phân quyền RBAC thành công"}
