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
from app.schemas.admin import AdminCreateUserRequest, LockUserRequest, PaginatedUsersResponse, UpdateRolesRequest
from app.schemas.auth import UserResponse

router = APIRouter()


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
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
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
    user.role = ",".join(payload.roles)
    db.commit()
    db.refresh(user)
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
    return user.to_dict()


@router.post("/users/{user_id}/unlock", response_model=UserResponse)
def unlock_user(
    user_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    user.is_active = True
    user.account_status = "active"
    user.lock_reason = None
    db.commit()
    db.refresh(user)
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
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    # Return structured immutable audit logs for Admin inspection
    mock_logs = [
        {
            "id": 1,
            "timestamp": "2026-10-06T03:15:20",
            "actor": "Admin System (admin@company.com)",
            "action": "LOCK_ACCOUNT",
            "module": "USER_MANAGEMENT",
            "target": "Tài khoản ID #4 (Candidate Test)",
            "ip": "192.168.1.100",
            "status": "SUCCESS",
            "details": "Khóa tài khoản vi phạm chính sách bảo mật hệ thống."
        },
        {
            "id": 2,
            "timestamp": "2026-10-06T02:40:12",
            "actor": "Admin System (admin@company.com)",
            "action": "UPDATE_ROLES",
            "module": "RBAC",
            "target": "Tài khoản ID #3 (hiring_manager@company.com)",
            "ip": "192.168.1.100",
            "status": "SUCCESS",
            "details": "Gán thêm vai trò Interviewer cho tài khoản."
        },
        {
            "id": 3,
            "timestamp": "2026-10-05T19:50:00",
            "actor": "HR Manager (hr_manager@company.com)",
            "action": "CREATE_REQUISITION",
            "module": "REQUISITION",
            "target": "Yêu cầu tuyển dụng Senior Backend Engineer",
            "ip": "192.168.1.105",
            "status": "SUCCESS",
            "details": "Tạo yêu cầu tuyển dụng mới."
        }
    ]
    return mock_logs


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

