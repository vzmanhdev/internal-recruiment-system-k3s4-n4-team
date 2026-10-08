import csv
import io
from math import ceil
from typing import Optional, List

import openpyxl
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_admin
from app.core.security import generate_secure_random_password, hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminCreateUserRequest,
    LockUserRequest,
    PaginatedUsersResponse,
    ResetUserPasswordRequest,
    UpdateRolesRequest,
    VALID_ROLES,
)
from app.schemas.auth import UserResponse

router = APIRouter()


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
            "code": "employee",
            "name": "Nhân viên nội bộ / Ứng viên (Employee)",
            "authority_type": "BUSINESS",
            "description": "Xem cổng việc làm nội bộ, nộp ứng tuyển, giới thiệu nhân sự (Referral), cập nhật profile.",
        },
    ]
    return roles_list


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


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    payload: ResetUserPasswordRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng")

    new_pwd = payload.new_password if payload.new_password else generate_secure_random_password(16)
    user.hashed_password = hash_password(new_pwd)
    db.commit()
    db.refresh(user)

    return {
        "message": f"Đặt lại mật khẩu cho tài khoản {user.email} thành công.",
        "new_password": new_pwd,
        "user": user.to_dict(),
    }


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


@router.post("/users/import")
async def import_users_from_excel(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)

    filename = (file.filename or "").lower()
    if not (filename.endswith(".xlsx") or filename.endswith(".xls") or filename.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV (.csv).",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File tải lên bị rỗng.",
        )

    rows = []
    headers = []

    if filename.endswith(".csv"):
        text_content = content.decode("utf-8-sig", errors="ignore")
        csv_reader = csv.reader(io.StringIO(text_content))
        all_lines = [r for r in csv_reader if any(cell.strip() for cell in r)]
        if not all_lines:
            raise HTTPException(status_code=400, detail="File CSV không chứa dữ liệu")
        headers = [str(cell).strip() for cell in all_lines[0]]
        rows = all_lines[1:]
    else:
        try:
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            all_rows = list(sheet.iter_rows(values_only=True))
            non_empty_rows = [r for r in all_rows if r and any(cell is not None and str(cell).strip() != "" for cell in r)]
            if not non_empty_rows:
                raise HTTPException(status_code=400, detail="File Excel không chứa dữ liệu")
            headers = [str(cell).strip() if cell is not None else "" for cell in non_empty_rows[0]]
            rows = non_empty_rows[1:]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể đọc file Excel: {str(e)}",
            )

    # Validate Template Structure Headers
    normalized_headers = [h.lower().strip() for h in headers]

    # Required columns: Name, Email, Roles
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
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": f"File Excel không đúng cấu trúc mẫu. File thiếu các cột bắt buộc: {', '.join(missing)}.",
                "missing_columns": missing,
                "required_template_columns": ["Họ và tên", "Email", "Vai trò", "Số điện thoại", "Mã nhân viên", "Mật khẩu ban đầu"],
            },
        )

    import random

    total = len(rows)
    imported = 0
    skipped = 0
    failed = 0
    errors = []

    for idx, row in enumerate(rows, start=2):
        try:
            full_name = str(row[name_idx]).strip() if name_idx < len(row) and row[name_idx] is not None else ""
            email = str(row[email_idx]).strip().lower() if email_idx < len(row) and row[email_idx] is not None else ""
            roles_raw = str(row[roles_idx]).strip() if roles_idx < len(row) and row[roles_idx] is not None else "employee"
            phone = str(row[phone_idx]).strip() if phone_idx >= 0 and phone_idx < len(row) and row[phone_idx] is not None else None
            emp_code = str(row[code_idx]).strip() if code_idx >= 0 and code_idx < len(row) and row[code_idx] is not None else None
            raw_pwd = str(row[pwd_idx]).strip() if pwd_idx >= 0 and pwd_idx < len(row) and row[pwd_idx] is not None else None

            if not full_name and not email:
                skipped += 1
                continue

            if not email or "@" not in email:
                failed += 1
                errors.append({"row": idx, "email": email or "(Trống)", "reason": "Địa chỉ Email không hợp lệ."})
                continue

            if db.query(User).filter(User.email == email).first():
                skipped += 1
                errors.append({"row": idx, "email": email, "reason": "Email này đã tồn tại trong hệ thống (Đã bỏ qua)."})
                continue

            if emp_code and db.query(User).filter(User.employee_code == emp_code).first():
                emp_code = f"NV-{random.randint(100000, 999999)}"

            if not emp_code:
                while True:
                    candidate_code = f"NV-{random.randint(100000, 999999)}"
                    if not db.query(User).filter(User.employee_code == candidate_code).first():
                        emp_code = candidate_code
                        break

            parsed_roles = [r.strip().lower() for r in roles_raw.replace(";", ",").split(",") if r.strip()]
            valid_user_roles = [r for r in parsed_roles if r in VALID_ROLES]
            if not valid_user_roles:
                valid_user_roles = ["employee"]

            role_str = ",".join(dict.fromkeys(valid_user_roles))

            password_to_set = raw_pwd if (raw_pwd and len(raw_pwd) >= 6) else generate_secure_random_password(14)
            hashed_pwd = hash_password(password_to_set)

            new_user = User(
                email=email,
                full_name=full_name or email.split("@")[0],
                hashed_password=hashed_pwd,
                phone=phone,
                employee_code=emp_code,
                role=role_str,
                is_active=True,
                account_status="active",
            )
            db.add(new_user)
            db.commit()
            imported += 1
        except Exception as err:
            db.rollback()
            failed += 1
            errors.append({"row": idx, "email": email if "email" in locals() else "", "reason": f"Lỗi xử lý dòng: {str(err)}"})

    return {
        "message": f"Nhập dữ liệu thành công {imported}/{total} người dùng.",
        "total": total,
        "imported": imported,
        "skipped": skipped,
        "failed": failed,
        "errors": errors,
    }


@router.get("/users/import/template")
def download_import_template(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "User_Import_Template"

    headers = ["Họ và tên", "Email", "Vai trò", "Số điện thoại", "Mã nhân viên", "Mật khẩu ban đầu"]
    ws.append(headers)

    sample_rows = [
        ["Nguyễn Văn Trưởng HR", "hrmanager_demo@company.com", "hr_manager,recruiter", "0912345678", "NV-HR-001", "Password123!"],
        ["Trần Thị Hiring Manager", "manager_demo@company.com", "hiring_manager,interviewer", "0923456789", "NV-HM-002", "Password123!"],
        ["Lê Văn Chuyên Viên", "employee_demo@company.com", "employee", "0934567890", "NV-EMP-003", ""],
    ]
    for r in sample_rows:
        ws.append(r)

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 15)

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
        "employee": 0,
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


from app.models.audit import AuditLog, Permission, RolePermission

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
        query = query.filter(AuditLog.actor_email.ilike(f"%{actor.strip()}%"))
    if action.strip():
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))
    if module.strip():
        query = query.filter(AuditLog.target_entity.ilike(f"%{module.strip()}%"))

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


@router.get("/permissions/matrix")
def get_rbac_matrix(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    permissions = db.query(Permission).all()
    role_perms = db.query(RolePermission).all()

    # Group by module
    modules_map = {}
    for p in permissions:
        mod = p.module
        if mod not in modules_map:
            modules_map[mod] = {
                "id": mod,
                "module": f"Phân hệ {mod.capitalize()}",
                "permissions": {
                    "admin": [],
                    "hr_manager": [],
                    "recruiter": [],
                    "hiring_manager": [],
                    "interviewer": [],
                    "approver": [],
                    "candidate": [],
                    "employee": [],
                },
            }

    # Fill granted permissions per role
    for rp in role_perms:
        perm = db.query(Permission).filter(Permission.code == rp.permission_code).first()
        if perm and perm.module in modules_map and rp.is_granted:
            r_code = rp.role_code.lower()
            if r_code in modules_map[perm.module]["permissions"]:
                if perm.code not in modules_map[perm.module]["permissions"][r_code]:
                    modules_map[perm.module]["permissions"][r_code].append(perm.code)

    return list(modules_map.values())


@router.put("/permissions/matrix")
def update_rbac_matrix(
    payload: dict,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_admin = require_admin(authorization, db)
    role_code = payload.get("role_code")
    permission_code = payload.get("permission_code")
    is_granted = payload.get("is_granted", True)

    if not role_code or not permission_code:
        raise HTTPException(status_code=400, detail="Thiếu role_code hoặc permission_code")

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



