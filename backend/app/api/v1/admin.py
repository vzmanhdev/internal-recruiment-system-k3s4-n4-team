import csv
import io
import json
import re
import uuid
from math import ceil
from typing import Optional, List, Any

import openpyxl
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session

from app.api.v1.auth import require_admin
from app.core.security import generate_secure_random_password, hash_password
from app.core.search import build_search_filter, build_search_score
from app.db.session import get_db
from app.models.user import User
from app.models.import_job import ImportJob
from app.schemas.admin import (
    AdminCreateUserRequest,
    LockUserRequest,
    PaginatedUsersResponse,
    ResetUserPasswordRequest,
    UpdateRolesRequest,
    VALID_ROLES,
    ImportRowPreview,
    ImportPreviewResponse,
    ImportCommitRequest,
    ImportCommitResponse,
)
from app.schemas.auth import UserResponse
from app.models.audit import AuditLog, Permission, RolePermission

router = APIRouter()



def record_audit_log(
    db: Session,
    actor_email: str,
    action: str,
    target_entity: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
):
    try:
        actor_user = db.query(User).filter(User.email == actor_email).first()
        log_entry = AuditLog(
            actor_id=actor_user.id if actor_user else None,
            actor_email=actor_email,
            action=action,
            target_entity=target_entity,
            target_id=target_id,
            ip_address=ip_address,
            payload_json=details,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()



def revoke_all_sessions(db: Session, user: User, reason: str) -> int:
    """Revoke every active server-side session and bump security_version (kill-switch for issued JWTs)."""
    from datetime import datetime
    from app.models.auth_session import AuthSession
    user.security_version = (user.security_version or 1) + 1
    return db.query(AuthSession).filter(
        AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)
    ).update({AuthSession.revoked_at: datetime.utcnow(), AuthSession.revoke_reason: reason}, synchronize_session=False)


def replace_user_roles(db: Session, user: User, role_codes: list) -> None:
    """Replace role assignments atomically (caller commits). Unknown role codes are rejected."""
    from app.models.rbac import Role, UserRole
    from app.services.rbac_service import DEFAULT_ROLES_MAP
    codes = list(dict.fromkeys(r.strip().lower() for r in role_codes if r and r.strip()))
    matched = db.query(Role).filter(Role.code.in_(codes)).all() if codes else []
    for code in set(codes) - {r.code for r in matched}:
        if code in DEFAULT_ROLES_MAP:  # system role not seeded yet on this database
            role = Role(code=code, name=DEFAULT_ROLES_MAP[code], is_active=True)
            db.add(role)
            db.flush()
            matched.append(role)
    unknown = sorted(set(codes) - {r.code for r in matched})
    if unknown:
        raise HTTPException(status_code=422, detail=f"Vai trò không tồn tại: {', '.join(unknown)}")
    db.query(UserRole).filter(UserRole.user_id == user.id).delete(synchronize_session=False)
    for role in matched:
        db.add(UserRole(user_id=user.id, role_id=role.id))
    user.role = ",".join(codes)


@router.get("/roles")
def list_system_roles(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    roles_list = [
        {
            "code": "admin",
            "name": "Quản trị hệ thống (System Administrator)",
            "authority_type": "TECHNICAL",
            "description": "Quản trị người dùng, gán nhiều vai trò, khóa tài khoản, xem nhật ký hệ thống và toàn quyền truy cập.",
        },
        {
            "code": "hr_manager",
            "name": "Trưởng phòng Nhân sự (HR Manager)",
            "authority_type": "BUSINESS",
            "description": "Thẩm định & duyệt requisition, quản lý master data, duyệt offer, ghi đè headcount.",
        },
        {
            "code": "recruiter",
            "name": "Chuyên viên Tuyển dụng (Recruiter)",
            "authority_type": "BUSINESS",
            "description": "Đăng bài tuyển dụng, sàng lọc ứng viên, lên lịch phỏng vấn, phân công phỏng vấn và tạo offer.",
        },
        {
            "code": "hiring_manager",
            "name": "Trưởng bộ phận tuyển dụng (Hiring Manager)",
            "authority_type": "BUSINESS",
            "description": "Tạo yêu cầu tuyển dụng (requisition), duyệt cấp 1 bộ phận, phỏng vấn chuyên môn.",
        },
        {
            "code": "interviewer",
            "name": "Người phỏng vấn (Interviewer)",
            "authority_type": "BUSINESS",
            "description": "Xem lịch phỏng vấn được gán, chấm điểm phiếu đánh giá tiêu chí năng lực ứng viên.",
        },
        {
            "code": "approver",
            "name": "Người phê duyệt (Approver / CEO)",
            "authority_type": "BUSINESS",
            "description": "Xem và phê duyệt các Yêu cầu tuyển dụng (Requisition) và Đề xuất tuyển dụng (Offer).",
        },
        {
            "code": "candidate",
            "name": "Ứng viên (Candidate)",
            "authority_type": "BUSINESS",
            "description": "Người nộp hồ sơ từ bên ngoài doanh nghiệp, sử dụng cổng tuyển dụng để nộp CV, theo dõi trạng thái hồ sơ, xác nhận phỏng vấn và phản hồi Offer.",
        },
    ]
    return roles_list


@router.get("/users", response_model=PaginatedUsersResponse)
def list_users(
    search: str = "",
    account_status: str = Query("all", alias="status"),
    role: str = "all",
    department: str = "all",
    sort_by: Optional[str] = Query(None, alias="sortBy"),
    sort_order: str = Query("desc", alias="sortOrder"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(User)
    search_score = None
    if search.strip():
        search_cols = [User.full_name, User.email, User.department, User.employee_code]
        query = query.filter(build_search_filter(search_cols, search.strip()))
        search_score = build_search_score(search_cols, search.strip())
    if account_status != "all":
        query = query.filter(User.account_status == account_status)
    if department != "all":
        query = query.filter(User.department == department)
    if role != "all":
        # filter by the normalized role assignments, not the legacy comma-separated string
        from app.models.rbac import Role, UserRole
        query = query.filter(
            User.id.in_(
                db.query(UserRole.user_id).join(Role, Role.id == UserRole.role_id).filter(Role.code == role)
            )
        )

    # Deterministic sorting
    sort_columns = {
        "full_name": User.full_name,
        "email": User.email,
        "created_at": User.created_at,
        "employee_code": User.employee_code,
        "department": User.department,
        "account_status": User.account_status,
    }
    col = sort_columns.get(sort_by, User.created_at)
    order_func = asc if (sort_order or "").lower() == "asc" else desc
    if search_score is not None and not sort_by:
        query = query.order_by(search_score.desc(), order_func(col), User.id.desc())
    else:
        query = query.order_by(order_func(col), User.id.desc())

    total = query.count()
    pages = max(1, ceil(total / page_size))
    users = query.offset((page - 1) * page_size).limit(page_size).all()
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
    db.flush()
    replace_user_roles(db, user, payload.roles)
    db.commit()
    db.refresh(user)
    record_audit_log(db, admin.email, "CREATE_USER", "User", str(user.id), f"Khởi tạo tài khoản người dùng {user.email} với vai trò {user.role}")

    # Send welcome email with initial password
    try:
        from app.services.email_service import send_account_created_email
        send_account_created_email(
            to_email=user.email,
            full_name=user.full_name,
            initial_password=payload.password,
            roles_str=user.role,
        )
    except Exception as e:
        pass

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

    new_roles = [r.strip().lower() for r in payload.roles if r.strip()]
    if user.id == admin.id and "admin" not in new_roles:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bạn không thể tự thu hồi vai trò Quản trị hệ thống của chính mình.",
            headers={"X-Error-Code": "SELF_ADMIN_ROLE_REMOVE_DENIED"}
        )

    # Replace the normalized user_roles rows and the legacy string in ONE transaction
    replace_user_roles(db, user, new_roles)
    db.commit()
    db.refresh(user)

    record_audit_log(db, admin.email, "UPDATE_ROLES", "User", str(user.id), f"Cập nhật vai trò cho {user.email} thành: {user.role}")

    # Trigger email notification for role update
    try:
        from app.services.email_service import send_roles_updated_email
        send_roles_updated_email(to_email=user.email, full_name=user.full_name, new_roles_str=user.role)
    except Exception:
        pass

    from app.services.rbac_service import get_user_roles, get_effective_permissions
    user_dict = user.to_dict()
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["effective_permissions"] = get_effective_permissions(db, user)
    return user_dict


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    payload: ResetUserPasswordRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    admin = require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng")

    new_pwd = payload.new_password if payload.new_password else generate_secure_random_password(16)
    user.hashed_password = hash_password(new_pwd)
    revoke_all_sessions(db, user, "ADMIN_PASSWORD_RESET")
    db.commit()
    db.refresh(user)
    record_audit_log(db, admin.email, "ADMIN_RESET_PASSWORD", "User", str(user.id), f"Quản trị viên đặt lại mật khẩu cho tài khoản {user.email}")

    # Trigger email notification with new password
    try:
        from app.services.email_service import send_new_password_email
        send_new_password_email(to_email=user.email, new_password=new_pwd)
    except Exception:
        pass

    return {
        "message": f"Đặt lại mật khẩu cho tài khoản {user.email} thành công.",
        "new_password": new_pwd,
        "user": user.to_dict(),
    }


@router.get("/users/{user_id}/handover-check")
def handover_check(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """S1-10 AC3: positions owned or recruited by this user must be handed over before/after locking."""
    require_admin(authorization, db)
    from app.models.requisition import JobRequisition
    from app.models.hr import RecruiterAssignment
    open_states = ["draft", "changes_requested", "pending_manager", "pending_hr", "pending_executive", "approved", "paused"]
    owned = db.query(JobRequisition).filter(JobRequisition.created_by_id == user_id, JobRequisition.status.in_(open_states)).all()
    assigned_ids = [r[0] for r in db.query(RecruiterAssignment.requisition_id).filter(RecruiterAssignment.recruiter_id == user_id).all()]
    recruiting = db.query(JobRequisition).filter(JobRequisition.id.in_(assigned_ids or [-1]), JobRequisition.status.in_(open_states)).all()
    items = [{"requisition_id": r.id, "code": r.code, "title": r.title, "relation": "owner"} for r in owned] +             [{"requisition_id": r.id, "code": r.code, "title": r.title, "relation": "recruiter"} for r in recruiting]
    return {"user_id": user_id, "needs_handover": bool(items), "positions": items}


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
    revoked = revoke_all_sessions(db, user, f"ACCOUNT_LOCKED: {user.lock_reason}")
    db.commit()
    db.refresh(user)
    record_audit_log(db, admin.email, "LOCK_ACCOUNT", "User", str(user.id), f"Khóa tài khoản {user.email}. Lý do: {user.lock_reason}. Đã thu hồi {revoked} phiên.")

    # Trigger email notification for account lock
    try:
        from app.services.email_service import send_account_status_email
        send_account_status_email(to_email=user.email, full_name=user.full_name, is_locked=True, reason=user.lock_reason)
    except Exception:
        pass

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
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    record_audit_log(db, admin.email, "UNLOCK_ACCOUNT", "User", str(user.id), f"Mở khóa tài khoản {user.email}")

    # Trigger email notification for account unlock
    try:
        from app.services.email_service import send_account_status_email
        send_account_status_email(to_email=user.email, full_name=user.full_name, is_locked=False)
    except Exception:
        pass

    return user.to_dict()


def parse_uploaded_file(content: bytes, filename: str) -> tuple[List[str], List[List[Any]]]:
    """Parse Excel (.xlsx, .xls) or CSV bytes into headers and rows safely."""
    fname = filename.lower()
    if fname.endswith(".csv"):
        text_content = content.decode("utf-8-sig", errors="ignore")
        csv_reader = csv.reader(io.StringIO(text_content))
        all_lines = [r for r in csv_reader if any(str(cell).strip() for cell in r)]
        if not all_lines:
            raise HTTPException(status_code=400, detail="File CSV không chứa dữ liệu")
        headers = [str(cell).strip() for cell in all_lines[0]]
        rows = all_lines[1:]
        return headers, rows

    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active
        all_rows = list(sheet.iter_rows(values_only=True))
        non_empty = [r for r in all_rows if r and any(cell is not None and str(cell).strip() != "" for cell in r)]
        if not non_empty:
            raise HTTPException(status_code=400, detail="File Excel không chứa dữ liệu")
        headers = [str(cell).strip() if cell is not None else "" for cell in non_empty[0]]
        rows = non_empty[1:]
        return headers, rows
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể đọc file Excel. Vui lòng kiểm tra tệp có đúng định dạng .xlsx và không bị hỏng.",
        )


def validate_import_data(
    rows: List[List[Any]],
    headers: List[str],
    db: Session,
) -> tuple[List[dict], int, int]:
    """Validates rows, detects duplicates, formats errors, and returns row validation results."""
    normalized_headers = [h.lower().strip() for h in headers]

    name_idx = next(
        (i for i, h in enumerate(normalized_headers) if any(k in h for k in ["họ và tên", "ho va ten", "full_name", "fullname", "tên", "name"])),
        -1,
    )
    email_idx = next((i for i, h in enumerate(normalized_headers) if "email" in h), -1)
    roles_idx = next(
        (i for i, h in enumerate(normalized_headers) if any(k in h for k in ["vai trò", "vai tro", "role", "roles"])),
        -1,
    )
    phone_idx = next(
        (i for i, h in enumerate(normalized_headers) if any(k in h for k in ["sđt", "sdt", "phone", "điện thoại"])),
        -1,
    )
    dept_idx = next(
        (i for i, h in enumerate(normalized_headers) if any(k in h for k in ["phòng ban", "phong ban", "department", "bộ phận"])),
        -1,
    )
    code_idx = next(
        (i for i, h in enumerate(normalized_headers) if any(k in h for k in ["mã nhân viên", "ma nhan vien", "code", "employee_code"])),
        -1,
    )
    pwd_idx = next(
        (i for i, h in enumerate(normalized_headers) if any(k in h for k in ["mật khẩu", "mat khau", "password"])),
        -1,
    )

    missing = []
    if name_idx == -1:
        missing.append("Họ và tên")
    if email_idx == -1:
        missing.append("Email")
    if roles_idx == -1:
        missing.append("Vai trò")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File Excel không đúng cấu trúc mẫu. Thiếu các cột bắt buộc: {', '.join(missing)}.",
        )

    # Fetch existing emails in database for case-insensitive duplicate detection (TC-S1-08-X01)
    existing_emails = {e[0].lower().strip() for e in db.query(User.email).all()}
    seen_in_file = set()

    email_regex = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
    results = []
    valid_count = 0
    error_count = 0

    for idx, row in enumerate(rows, start=2):
        full_name = str(row[name_idx]).strip() if name_idx < len(row) and row[name_idx] is not None else ""
        raw_email = str(row[email_idx]).strip() if email_idx < len(row) and row[email_idx] is not None else ""
        email = raw_email.lower()
        roles_raw = str(row[roles_idx]).strip() if roles_idx < len(row) and row[roles_idx] is not None else "candidate"
        phone = str(row[phone_idx]).strip() if phone_idx >= 0 and phone_idx < len(row) and row[phone_idx] is not None else ""
        dept = str(row[dept_idx]).strip() if dept_idx >= 0 and dept_idx < len(row) and row[dept_idx] is not None else "Nhân sự"
        emp_code = str(row[code_idx]).strip() if code_idx >= 0 and code_idx < len(row) and row[code_idx] is not None else ""
        raw_pwd = str(row[pwd_idx]).strip() if pwd_idx >= 0 and pwd_idx < len(row) and row[pwd_idx] is not None else ""

        if not full_name and not raw_email:
            continue  # ignore blank row

        status_val = "VALID"
        reason = None

        # Validation rules
        if not full_name or len(full_name) < 2:
            status_val = "ERROR"
            reason = "Họ và tên bắt buộc và phải có ít nhất 2 ký tự."
        elif not raw_email or not email_regex.match(raw_email):
            status_val = "ERROR"
            reason = f"Địa chỉ email '{raw_email}' không đúng định dạng."
        elif email in seen_in_file:
            status_val = "DUPLICATE"
            reason = f"Email '{raw_email}' bị trùng lặp nhiều dòng trong file import."
        elif email in existing_emails:
            status_val = "DUPLICATE"
            reason = f"Email '{raw_email}' đã tồn tại trong hệ thống (Đã bỏ qua)."

        seen_in_file.add(email)

        # Parse & validate roles
        from app.db.rbac_catalog import canonical_role
        parsed_roles = list(dict.fromkeys(canonical_role(r) for r in roles_raw.replace(";", ",").split(",") if r.strip()))
        valid_user_roles = [r for r in parsed_roles if r in VALID_ROLES]
        if not valid_user_roles:
            valid_user_roles = ["candidate"]

        if status_val == "VALID":
            valid_count += 1
        else:
            error_count += 1

        results.append({
            "row_num": idx,
            "full_name": full_name or "(Chưa có tên)",
            "email": raw_email,
            "phone": phone or None,
            "employee_code": emp_code or None,
            "department": dept or "Nhân sự",
            "roles": valid_user_roles,
            "password": raw_pwd or None,
            "status": status_val,
            "error_reason": reason,
        })

    return results, valid_count, error_count


@router.post("/users/import/preview", response_model=ImportPreviewResponse)
async def preview_users_import(
    file: UploadFile = File(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """S2-01 AC2: Upload Excel/CSV, validate structure and rows, and return a preview with row-level error reports."""
    admin = require_admin(authorization, db)

    filename = file.filename or "import.xlsx"
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    if ext not in ("xlsx", "xls", "csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV (.csv).",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File tải lên bị rỗng.")

    headers, rows = parse_uploaded_file(content, filename)
    validated_rows, valid_count, error_count = validate_import_data(rows, headers, db)

    # Persist staged ImportJob
    job_id = str(uuid.uuid4())
    job = ImportJob(
        job_id=job_id,
        filename=filename,
        file_type=ext,
        total_rows=len(validated_rows),
        valid_rows=valid_count,
        error_rows=error_count,
        imported_rows=0,
        status="preview",
        stage_data_json=json.dumps(validated_rows, ensure_ascii=False),
        created_by_id=admin.id,
    )
    db.add(job)
    db.commit()

    total = len(validated_rows)
    pages = max(1, ceil(total / page_size))
    items_slice = validated_rows[(page - 1) * page_size: page * page_size]

    return {
        "job_id": job_id,
        "filename": filename,
        "total": total,
        "valid_count": valid_count,
        "error_count": error_count,
        "items": items_slice,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/users/import/preview/{job_id}", response_model=ImportPreviewResponse)
def get_import_preview_page(
    job_id: str,
    status_filter: str = Query("all", description="Lọc theo trạng thái: all, valid, error, duplicate"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Server-side pagination and filtering for Excel import preview rows."""
    require_admin(authorization, db)
    job = db.query(ImportJob).filter(ImportJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên xem trước import.")

    raw_data = json.loads(job.stage_data_json or "[]")
    if status_filter == "valid":
        filtered = [r for r in raw_data if r.get("status") == "VALID"]
    elif status_filter in ("error", "failed"):
        filtered = [r for r in raw_data if r.get("status") in ("ERROR", "DUPLICATE")]
    elif status_filter == "duplicate":
        filtered = [r for r in raw_data if r.get("status") == "DUPLICATE"]
    else:
        filtered = raw_data

    total = len(filtered)
    pages = max(1, ceil(total / page_size))
    items_slice = filtered[(page - 1) * page_size: page * page_size]

    return {
        "job_id": job.job_id,
        "filename": job.filename,
        "total": total,
        "valid_count": job.valid_rows,
        "error_count": job.error_rows,
        "items": items_slice,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.post("/users/import/commit", response_model=ImportCommitResponse)
def commit_users_import(
    payload: ImportCommitRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """S2-01 AC3: Batch import confirmed valid rows with atomic chunking and normalized role assignments."""
    import random
    admin = require_admin(authorization, db)

    job = db.query(ImportJob).filter(ImportJob.job_id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên import.")

    if job.status == "completed":
        # Idempotent response if already completed
        summary = json.loads(job.summary_json or "{}")
        return {
            "job_id": job.job_id,
            "total": job.total_rows,
            "imported": job.imported_rows,
            "skipped": summary.get("skipped", 0),
            "failed": summary.get("failed", 0),
            "message": f"Phiên import đã hoàn thành trước đó: đã nhập {job.imported_rows} người dùng.",
            "errors": summary.get("errors", []),
        }

    raw_rows = json.loads(job.stage_data_json or "[]")
    valid_rows = [r for r in raw_rows if r.get("status") == "VALID"]
    error_rows = [r for r in raw_rows if r.get("status") != "VALID"]

    job.status = "importing"
    db.commit()

    total = len(raw_rows)
    imported = 0
    skipped = 0
    failed = len(error_rows)
    errors = [{"row": r["row_num"], "email": r["email"], "reason": r.get("error_reason", "Dữ liệu không hợp lệ")} for r in error_rows]

    # Process in bounded transaction batches of 50
    CHUNK_SIZE = 50
    for i in range(0, len(valid_rows), CHUNK_SIZE):
        chunk = valid_rows[i: i + CHUNK_SIZE]
        for row in chunk:
            email = row["email"].lower().strip()
            # Double check email uniqueness in DB
            if db.query(User).filter(User.email.ilike(email)).first():
                skipped += 1
                errors.append({"row": row["row_num"], "email": email, "reason": "Email đã tồn tại trong hệ thống (Đã bỏ qua)."})
                continue

            emp_code = row.get("employee_code")
            if emp_code and db.query(User).filter(User.employee_code == emp_code).first():
                emp_code = f"NV-{random.randint(100000, 999999)}"

            if not emp_code:
                while True:
                    cand = f"NV-{random.randint(100000, 999999)}"
                    if not db.query(User).filter(User.employee_code == cand).first():
                        emp_code = cand
                        break

            raw_pwd = row.get("password")
            valid_pwd = False
            if raw_pwd:
                try:
                    from app.core.security import validate_password_complexity
                    validate_password_complexity(str(raw_pwd))
                    valid_pwd = True
                except ValueError:
                    valid_pwd = False
            pwd_to_set = str(raw_pwd) if valid_pwd else generate_secure_random_password(16)
            hashed_pwd = hash_password(pwd_to_set)

            roles_to_assign = row.get("roles") or ["candidate"]
            role_str = ",".join(dict.fromkeys(roles_to_assign))

            new_user = User(
                email=email,
                full_name=row.get("full_name") or email.split("@")[0],
                hashed_password=hashed_pwd,
                phone=row.get("phone"),
                employee_code=emp_code,
                department=row.get("department") or "Nhân sự",
                role=role_str,
                is_active=True,
                account_status="active",
            )
            db.add(new_user)
            db.flush()
            replace_user_roles(db, new_user, roles_to_assign)
            imported += 1

        db.commit()

    # Update job completion state
    job.status = "completed"
    job.imported_rows = imported
    summary_data = {
        "total": total,
        "imported": imported,
        "skipped": skipped,
        "failed": failed,
        "errors": errors[:50],  # cap error summary in db
    }
    job.summary_json = json.dumps(summary_data, ensure_ascii=False)
    db.commit()

    record_audit_log(
        db,
        admin.email,
        "BULK_USER_IMPORT",
        "ImportJob",
        job.job_id,
        f"Hoàn tất nhập dữ liệu từ {job.filename}: {imported} thành công, {skipped} bỏ qua, {failed} lỗi.",
    )

    return {
        "job_id": job.job_id,
        "total": total,
        "imported": imported,
        "skipped": skipped,
        "failed": failed,
        "message": f"Nhập dữ liệu thành công {imported}/{total} người dùng.",
        "errors": errors,
    }


@router.post("/users/import")
async def import_users_from_excel(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Direct synchronous import (backward compatible with CLI and direct API calls), with fixed role assignment."""
    import random
    admin = require_admin(authorization, db)

    filename = (file.filename or "").lower()
    if not (filename.endswith(".xlsx") or filename.endswith(".xls") or filename.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV (.csv).",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File tải lên bị rỗng.")

    headers, rows = parse_uploaded_file(content, filename)
    validated_rows, valid_count, error_count = validate_import_data(rows, headers, db)

    imported = 0
    skipped = 0
    failed = 0
    errors = []

    for row in validated_rows:
        if row["status"] != "VALID":
            if row["status"] == "DUPLICATE":
                skipped += 1
            else:
                failed += 1
            errors.append({"row": row["row_num"], "email": row["email"], "reason": row.get("error_reason", "Dòng không hợp lệ")})
            continue

        email = row["email"].lower().strip()
        if db.query(User).filter(User.email.ilike(email)).first():
            skipped += 1
            errors.append({"row": row["row_num"], "email": email, "reason": "Email này đã tồn tại trong hệ thống (Đã bỏ qua)."})
            continue

        emp_code = row.get("employee_code")
        if emp_code and db.query(User).filter(User.employee_code == emp_code).first():
            emp_code = f"NV-{random.randint(100000, 999999)}"

        if not emp_code:
            while True:
                cand = f"NV-{random.randint(100000, 999999)}"
                if not db.query(User).filter(User.employee_code == cand).first():
                    emp_code = cand
                    break

        raw_pwd = row.get("password")
        valid_pwd = False
        if raw_pwd:
            try:
                from app.core.security import validate_password_complexity
                validate_password_complexity(str(raw_pwd))
                valid_pwd = True
            except ValueError:
                valid_pwd = False
        pwd_to_set = str(raw_pwd) if valid_pwd else generate_secure_random_password(16)
        hashed_pwd = hash_password(pwd_to_set)

        roles_to_assign = row.get("roles") or ["candidate"]
        role_str = ",".join(dict.fromkeys(roles_to_assign))

        try:
            new_user = User(
                email=email,
                full_name=row.get("full_name") or email.split("@")[0],
                hashed_password=hashed_pwd,
                phone=row.get("phone"),
                employee_code=emp_code,
                department=row.get("department") or "Nhân sự",
                role=role_str,
                is_active=True,
                account_status="active",
            )
            db.add(new_user)
            db.flush()
            replace_user_roles(db, new_user, roles_to_assign)
            db.commit()
            imported += 1
        except Exception:
            db.rollback()
            failed += 1
            errors.append({"row": row["row_num"], "email": email, "reason": "Dữ liệu dòng vi phạm ràng buộc cơ sở dữ liệu."})

    record_audit_log(
        db,
        admin.email,
        "CREATE_USER_BULK",
        "User",
        str(imported),
        f"Nhập hàng loạt: {imported} thành công, {skipped} bỏ qua, {failed} lỗi từ tệp {filename}.",
    )

    return {
        "message": f"Nhập dữ liệu thành công {imported}/{len(validated_rows)} người dùng.",
        "total": len(validated_rows),
        "imported": imported,
        "skipped": skipped,
        "failed": failed,
        "errors": errors,
    }


@router.get("/users/import/template")
def download_import_template(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """S2-01 AC1: Download official template with standard headers and sample data."""
    auth = authorization or (f"Bearer {token}" if token else None)
    if auth:
        try:
            require_admin(auth, db)
        except Exception:
            pass
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "User_Import_Template"

    headers = ["Họ và tên", "Email", "Vai trò", "Số điện thoại", "Phòng ban", "Mã nhân viên", "Mật khẩu ban đầu"]
    ws.append(headers)

    sample_rows = [
        ["Nguyễn Văn Trưởng HR", "hrmanager_demo@company.com", "hr_manager,recruiter", "0912345678", "Phòng Tuyển Dụng & Đào Tạo", "NV-HR-001", "Password123!"],
        ["Trần Thị Hiring Manager", "manager_demo@company.com", "hiring_manager,interviewer", "0923456789", "Khối Công Nghệ & Kỹ Thuật", "NV-HM-002", "Password123!"],
        ["Lê Văn Recruiter", "recruiter_demo@company.com", "recruiter", "0934567890", "Phòng Tuyển Dụng & Đào Tạo", "NV-REC-003", ""],
        ["Hoàng Minh Interviewer", "interviewer_demo@company.com", "interviewer", "0945678901", "Khối Công Nghệ & Kỹ Thuật", "NV-INT-004", ""],
        ["Phạm Thu Nhân Viên", "employee_demo@company.com", "candidate", "0956789012", "Ban Giám Đốc", "NV-EMP-005", ""],
    ]
    for r in sample_rows:
        ws.append(r)

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 18)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    headers_resp = {"Content-Disposition": "attachment; filename=mau_import_nguoi_dung.xlsx"}
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers_resp,
    )



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
        "candidate": 0,
    }
    from app.services.rbac_service import get_user_roles
    for user in all_users:
        user_roles = [r["code"].lower() for r in get_user_roles(db, user)]
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


    return audit_log_records


@router.get("/audit-logs")
def list_audit_logs(
    actor: str = "",
    action: str = "",
    module: str = "",
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    if actor.strip():
        query = query.filter(build_search_filter([AuditLog.actor_email], actor.strip()))
    if action.strip():
        query = query.filter(build_search_filter([AuditLog.action], action.strip()))
    if module.strip():
        query = query.filter(build_search_filter([AuditLog.target_entity], module.strip()))

    logs = query.limit(100).all()
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat() if log.created_at else "",
            "actor": f"{log.actor_email}",
            "action": log.action,
            "module": log.target_entity or "SYSTEM",
            "target": f"{log.target_entity} ID #{log.target_id}" if log.target_id else (log.target_entity or "System"),
            "ip": log.ip_address or "127.0.0.1",
            "status": "SUCCESS",
            "details": log.payload_json or "",
        })
    return result


def ensure_permissions_seeded(db: Session):
    existing_count = db.query(Permission).count()
    if existing_count == 0:
        initial_perms = [
            {"code": "user:view", "name": "Xem người dùng", "module": "users", "description": "Xem danh sách người dùng & tài khoản"},
            {"code": "user:create", "name": "Tạo người dùng", "module": "users", "description": "Tạo mới tài khoản người dùng"},
            {"code": "user:edit", "name": "Sửa người dùng", "module": "users", "description": "Cập nhật thông tin tài khoản"},
            {"code": "user:lock", "name": "Khóa/Mở khóa", "module": "users", "description": "Khóa hoặc mở khóa tài khoản"},
            {"code": "user:reset_password", "name": "Reset Mật khẩu", "module": "users", "description": "Reset mật khẩu người dùng"},
            {"code": "requisition:view", "name": "Xem Yêu cầu tuyển dụng", "module": "requisition", "description": "Xem danh sách yêu cầu tuyển dụng"},
            {"code": "requisition:create", "name": "Tạo Yêu cầu tuyển dụng", "module": "requisition", "description": "Tạo mới yêu cầu tuyển dụng"},
            {"code": "requisition:approve", "name": "Phê duyệt Yêu cầu", "module": "requisition", "description": "Phê duyệt hoặc từ chối yêu cầu"},
            {"code": "candidate:view", "name": "Xem Hồ sơ Ứng viên", "module": "candidate", "description": "Xem danh sách và chi tiết ứng viên"},
            {"code": "candidate:evaluate", "name": "Đánh giá Ứng viên", "module": "candidate", "description": "Đánh giá, chấm điểm và chuyển trạng thái ứng viên"},
            {"code": "offer:create", "name": "Tạo Thư mời", "module": "offer", "description": "Tạo mới đề xuất offer cho ứng viên"},
            {"code": "offer:approve", "name": "Duyệt Thư mời", "module": "offer", "description": "Phê duyệt đề xuất offer"},
            {"code": "master_data:manage", "name": "Quản lý Danh mục", "module": "audit", "description": "Quản lý danh mục dữ liệu hệ thống"},
            {"code": "audit:view", "name": "Xem Nhật ký Audit Logs", "module": "audit", "description": "Xem nhật ký thao tác hệ thống"},
        ]
        for p in initial_perms:
            db.add(Permission(**p))
        db.commit()

        initial_grants = {
            "admin": ["user:view", "user:create", "user:edit", "user:lock", "user:reset_password", "requisition:view", "requisition:create", "requisition:approve", "candidate:view", "candidate:evaluate", "offer:create", "offer:approve", "master_data:manage", "audit:view"],
            "hr_manager": ["user:view", "requisition:view", "requisition:create", "candidate:view", "candidate:evaluate", "offer:create", "offer:approve"],
            "recruiter": ["requisition:view", "candidate:view", "candidate:evaluate", "offer:create"],
            "hiring_manager": ["requisition:view", "requisition:create", "candidate:view", "candidate:evaluate", "offer:create"],
            "interviewer": ["candidate:view", "candidate:evaluate"],
            "approver": ["requisition:view", "requisition:approve", "offer:approve"],
            "candidate": []
        }
        for role, perm_codes in initial_grants.items():
            for code in perm_codes:
                db.add(RolePermission(role_code=role, permission_code=code, is_granted=True))
        db.commit()


MODULE_TITLE_MAP = {
    "users": "Quản lý Người Dùng & Tài Khoản",
    "requisition": "Yêu Cầu Tuyển Dụng (Requisition)",
    "candidate": "Hồ Sơ Ứng Viên & Phỏng Vấn",
    "offer": "Đề Xuất Offer & Phê Duyệt",
    "audit": "Nhật Ký Hệ Thống & Audit Logs",
}

ALL_ROLES = ["admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "candidate"]


@router.get("/permissions/matrix")
def get_rbac_matrix(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    ensure_permissions_seeded(db)

    permissions = db.query(Permission).all()
    role_perms = db.query(RolePermission).filter(RolePermission.is_granted == True).all()

    # Map role -> granted permissions set
    role_granted_map = {r: set() for r in ALL_ROLES}

    for rp in role_perms:
        r_code = rp.role_code.lower()
        if r_code in role_granted_map:
            role_granted_map[r_code].add(rp.permission_code)

    # Super Admin ALWAYS has 100% ALL system permissions
    all_perm_codes = {p.code for p in permissions}
    role_granted_map["admin"] = all_perm_codes

    # Group by module matching frontend format
    modules_order = ["users", "requisition", "candidate", "offer", "audit"]
    result = []

    for mod_id in modules_order:
        mod_perms = [p for p in permissions if p.module == mod_id]
        if not mod_perms:
            continue

        module_obj = {
            "id": mod_id,
            "module": MODULE_TITLE_MAP.get(mod_id, f"Phân hệ {mod_id.capitalize()}"),
            "permissions": {}
        }

        for r_code in ALL_ROLES:
            granted_in_mod = [p.code for p in mod_perms if p.code in role_granted_map[r_code]]
            module_obj["permissions"][r_code] = granted_in_mod

        result.append(module_obj)

    return result


@router.put("/permissions/matrix")
def update_rbac_matrix(
    payload: dict,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_admin = require_admin(authorization, db)
    ensure_permissions_seeded(db)

    # Phase 9: the target role and permission must exist; unknown codes are rejected (no silent rows).
    from app.models.rbac import Role
    from app.db.rbac_catalog import ROLES_DATA
    known_roles = {r.code for r in db.query(Role.code).all()} | {r["code"] for r in ROLES_DATA}
    known_perms = {p.code for p in db.query(Permission.code).all()}

    def _validate_target(r_code: str, p_code: str) -> None:
        if r_code not in known_roles:
            raise HTTPException(status_code=422, detail=f"Vai trò '{r_code}' không tồn tại.", headers={"X-Error-Code": "UNKNOWN_ROLE"})
        if p_code not in known_perms:
            raise HTTPException(status_code=422, detail=f"Quyền '{p_code}' không tồn tại.", headers={"X-Error-Code": "UNKNOWN_PERMISSION"})

    # 1. Single toggle check
    role_code = (payload.get("role_code") or "").lower().strip()
    is_granted = payload.get("is_granted", True)

    if role_code == "admin" and not is_granted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quyền của vai trò Quản trị hệ thống là quyền toàn phần và không thể thay đổi.",
            headers={"X-Error-Code": "ADMIN_PERMISSION_IMMUTABLE"}
        )

    # 2. Batch changes check
    changes = payload.get("changes") or payload.get("matrix") or payload.get("batch")
    if changes and isinstance(changes, list):
        for item in changes:
            r_c = (item.get("role_code") or "").lower().strip()
            allowed = item.get("allowed", item.get("is_granted", True))
            if r_c == "admin" and not allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quyền của vai trò Quản trị hệ thống là quyền toàn phần và không thể thay đổi.",
                    headers={"X-Error-Code": "ADMIN_PERMISSION_IMMUTABLE"}
                )
            _validate_target(r_c, (item.get("permission_code") or "").strip())

        from app.services.rbac_service import update_permission_matrix
        update_permission_matrix(db, changes, current_admin.email)
        record_audit_log(db, current_admin.email, "BATCH_UPDATE_RBAC_MATRIX", "Permission", "ALL", "Đã cập nhật toàn bộ Ma trận Phân quyền RBAC vào CSDL")
        return {"message": "Cập nhật toàn bộ ma trận phân quyền RBAC vào CSDL thành công"}

    permission_code = payload.get("permission_code")
    if not role_code or not permission_code:
        raise HTTPException(status_code=400, detail="Thiếu role_code hoặc permission_code")
    _validate_target(role_code, permission_code)

    existing = db.query(RolePermission).filter(
        RolePermission.role_code == role_code,
        RolePermission.permission_code == permission_code
    ).first()

    if existing:
        existing.is_granted = is_granted
    else:
        new_rp = RolePermission(role_code=role_code, permission_code=permission_code, is_granted=is_granted)
        db.add(new_rp)

    db.commit()
    record_audit_log(db, current_admin.email, "UPDATE_RBAC_MATRIX", "Permission", permission_code, f"Set {role_code} -> {is_granted}")
    return {"message": "Cập nhật ma trận phân quyền RBAC thành công"}




