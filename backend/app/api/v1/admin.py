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

    user.role = ",".join(new_roles)

    # Sync user_roles join table
    from app.models.rbac import Role, UserRole
    db.query(UserRole).filter(UserRole.user_id == user.id).delete()
    db.commit()

    matched_roles = db.query(Role).filter(Role.code.in_(new_roles)).all()
    for r_obj in matched_roles:
        db.add(UserRole(user_id=user.id, role_id=r_obj.id))

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
    record_audit_log(db, admin.email, "LOCK_ACCOUNT", "User", str(user.id), f"Khóa tài khoản {user.email}. Lý do: {user.lock_reason}")

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

ALL_ROLES = ["admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"]


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

        from app.services.rbac_service import update_permission_matrix
        update_permission_matrix(db, changes, current_admin.email)
        record_audit_log(db, current_admin.email, "BATCH_UPDATE_RBAC_MATRIX", "Permission", "ALL", "Đã cập nhật toàn bộ Ma trận Phân quyền RBAC vào CSDL")
        return {"message": "Cập nhật toàn bộ ma trận phân quyền RBAC vào CSDL thành công"}

    permission_code = payload.get("permission_code")
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




