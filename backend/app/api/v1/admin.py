import csv
import io
import re
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
    department_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    query = db.query(User)
    if search.strip():
        term = f"%{search.strip()}%"
        from app.models.hr import Department
        dept_ids = [d.id for d in db.query(Department.id).filter(Department.name.ilike(term)).all()]
        filters = [User.full_name.ilike(term), User.email.ilike(term)]
        if dept_ids:
            filters.append(User.department_id.in_(dept_ids))
        query = query.filter(or_(*filters))
    if department_id is not None:
        query = query.filter(User.department_id == department_id)
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
    current_admin = require_admin(authorization, db)
    clean_email = payload.email.strip().lower()
    if db.query(User).filter(User.email == clean_email).first():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Email này đã tồn tại trong hệ thống.", "field_errors": {"email": "Email này đã tồn tại trong hệ thống."}},
        )

    # S1-08 AC: Tạo tài khoản gửi email kích hoạt kèm mật khẩu tạm
    temp_password = payload.password if (payload.password and len(payload.password) >= 6) else generate_secure_random_password(14)
    hashed_pwd = hash_password(temp_password)

    import random
    emp_code = None
    while True:
        candidate_code = f"NV-{random.randint(100000, 999999)}"
        if not db.query(User).filter(User.employee_code == candidate_code).first():
            emp_code = candidate_code
            break

    user = User(
        full_name=payload.full_name,
        email=clean_email,
        phone=payload.phone,
        department_id=payload.department_id,
        employee_code=emp_code,
        hashed_password=hashed_pwd,
        role=",".join(payload.roles),
        is_active=True,
        account_status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Gửi email kích hoạt kèm mật khẩu tạm
    from app.services.email_service import send_activation_and_temporary_password_email
    send_activation_and_temporary_password_email(
        to_email=user.email,
        full_name=user.full_name,
        temp_password=temp_password
    )

    record_audit_log(db, current_admin.email, "CREATE_USER", "User", str(user.id), f"Created account {user.email}")
    return user.to_dict()


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: AdminCreateUserRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Update internal account identity and organizational assignment."""
    admin = require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kh?ng t?m th?y t?i kho?n")
    email = str(payload.email).strip().lower()
    duplicate = db.query(User).filter(User.email == email, User.id != user_id).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Email n?y ?? t?n t?i trong h? th?ng.")
    if payload.department_id is not None:
        from app.models.hr import Department
        if not db.query(Department).filter(Department.id == payload.department_id, Department.is_active.is_(True)).first():
            raise HTTPException(status_code=400, detail="Ph?ng ban kh?ng t?n t?i ho?c ?? ng?ng ?p d?ng")
    user.full_name = payload.full_name.strip()
    user.email = email
    user.phone = payload.phone
    user.department_id = payload.department_id
    if payload.password:
        user.hashed_password = hash_password(payload.password)
        user.token_version = (user.token_version or 1) + 1
    db.commit()
    db.refresh(user)
    record_audit_log(db, admin.email, "UPDATE_USER", "User", str(user.id), "Updated internal account")
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
    user.token_version = (user.token_version or 1) + 1
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
    user.token_version = (user.token_version or 1) + 1
    db.commit()
    db.refresh(user)
    from app.services.email_service import send_activation_and_temporary_password_email
    send_activation_and_temporary_password_email(user.email, user.full_name, new_pwd)

    return {
        "message": f"Đặt lại mật khẩu cho tài khoản {user.email} thành công.",
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
    user.token_version = (user.token_version or 1) + 1
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
    user.token_version = (user.token_version or 1) + 1
    db.commit()
    db.refresh(user)
    return user.to_dict()


def parse_and_validate_excel_rows(content: bytes, filename: str, db: Session):
    filename = filename.lower()
    if not (filename.endswith(".xlsx") or filename.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV (.csv).",
        )

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

    normalized_headers = [h.lower().strip() for h in headers]
    name_idx = next((i for i, h in enumerate(normalized_headers) if any(k in h for k in ["họ và tên", "ho va ten", "full_name", "fullname", "tên", "name"])), -1)
    email_idx = next((i for i, h in enumerate(normalized_headers) if "email" in h), -1)
    roles_idx = next((i for i, h in enumerate(normalized_headers) if any(k in h for k in ["vai trò", "vai tro", "role", "roles"])), -1)
    phone_idx = next((i for i, h in enumerate(normalized_headers) if any(k in h for k in ["sđt", "sdt", "phone", "điện thoại"])), -1)
    code_idx = next((i for i, h in enumerate(normalized_headers) if any(k in h for k in ["mã nhân viên", "ma nhan vien", "code", "employee_code"])), -1)
    pwd_idx = next((i for i, h in enumerate(normalized_headers) if any(k in h for k in ["mật khẩu", "mat khau", "password"])), -1)

    missing = []
    if name_idx == -1: missing.append("Họ và tên")
    if email_idx == -1: missing.append("Email")
    if roles_idx == -1: missing.append("Vai trò")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File Excel không đúng cấu trúc mẫu. File thiếu các cột bắt buộc: {', '.join(missing)}.",
        )

    parsed_rows = []
    seen_emails_in_file = set()
    seen_employee_codes_in_file = set()

    for idx, row in enumerate(rows, start=2):
        row_errors = []
        full_name = str(row[name_idx]).strip() if name_idx < len(row) and row[name_idx] is not None else ""
        email = str(row[email_idx]).strip().lower() if email_idx < len(row) and row[email_idx] is not None else ""
        roles_raw = str(row[roles_idx]).strip() if roles_idx < len(row) and row[roles_idx] is not None else "employee"
        phone = str(row[phone_idx]).strip() if phone_idx >= 0 and phone_idx < len(row) and row[phone_idx] is not None else None
        emp_code = str(row[code_idx]).strip() if code_idx >= 0 and code_idx < len(row) and row[code_idx] is not None else None
        raw_pwd = str(row[pwd_idx]).strip() if pwd_idx >= 0 and pwd_idx < len(row) and row[pwd_idx] is not None else None

        if not full_name and not email:
            continue

        if not full_name or len(full_name) < 2:
            row_errors.append("Họ và tên không được để trống (tối thiểu 2 ký tự).")

        if not email:
            row_errors.append("Địa chỉ Email không được để trống.")
        elif "@" not in email or "." not in email.split("@")[-1]:
            row_errors.append("Địa chỉ Email không hợp lệ (Ví dụ: user@company.com).")
        elif email in seen_emails_in_file:
            row_errors.append("Email bị trùng lặp với dòng khác trong cùng tệp Excel.")
        elif db.query(User).filter(User.email == email).first():
            row_errors.append("Email này đã tồn tại trong hệ thống (Đã bỏ qua).")

        if email:
            seen_emails_in_file.add(email)
        if emp_code:
            normalized_code = emp_code.strip().lower()
            if normalized_code in seen_employee_codes_in_file:
                row_errors.append("Employee code is duplicated in this file")
            elif db.query(User).filter(User.employee_code == emp_code).first():
                row_errors.append("Employee code already exists in the system")
            seen_employee_codes_in_file.add(normalized_code)

        parsed_roles = [r.strip().lower() for r in roles_raw.replace(";", ",").split(",") if r.strip()]
        invalid_roles = [r for r in parsed_roles if r not in VALID_ROLES]
        if invalid_roles:
            row_errors.append(f"Vai trò không hợp lệ: {', '.join(invalid_roles)}.")

        valid_user_roles = [r for r in parsed_roles if r in VALID_ROLES]
        if not valid_user_roles:
            valid_user_roles = ["employee"]

        if phone:
            clean_phone = phone.replace(" ", "").replace("-", "")
            if not re.fullmatch(r"(?:\+84|0)(?:3|5|7|8|9)\d{8}", clean_phone):
                row_errors.append("Số điện thoại không đúng định dạng Việt Nam.")
            phone = clean_phone

        is_valid = len(row_errors) == 0
        parsed_rows.append({
            "row": idx,
            "full_name": full_name or email.split("@")[0],
            "email": email,
            "roles": valid_user_roles,
            "phone": phone,
            "employee_code": emp_code,
            "raw_pwd": raw_pwd,
            "is_valid": is_valid,
            "errors": row_errors,
        })

    valid_count = sum(1 for r in parsed_rows if r["is_valid"])
    invalid_count = sum(1 for r in parsed_rows if not r["is_valid"])
    return parsed_rows, len(parsed_rows), valid_count, invalid_count


# S2-01 AC: Xem trước và báo lỗi theo từng dòng trước khi nhập
@router.post("/users/import/preview")
async def preview_users_from_excel(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    require_admin(authorization, db)
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File v??t qu? gi?i h?n 10 MB")
    parsed_rows, total, valid_count, invalid_count = parse_and_validate_excel_rows(content, file.filename or "", db)
    return {
        "filename": file.filename,
        "total": total,
        "valid_count": valid_count,
        "invalid_count": invalid_count,
        "rows": [{key: value for key, value in row.items() if key != "raw_pwd"} for row in parsed_rows],
    }


# S2-01 AC: Dòng lỗi bị bỏ qua, dòng hợp lệ vẫn được nhập, có báo cáo tổng kết
@router.post("/users/import")
async def import_users_from_excel(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_admin = require_admin(authorization, db)
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File v??t qu? gi?i h?n 10 MB")
    parsed_rows, total, valid_count, invalid_count = parse_and_validate_excel_rows(content, file.filename or "", db)

    import random
    from app.services.email_service import send_activation_and_temporary_password_email

    imported = 0
    skipped = 0
    failed = 0
    errors = []

    for r in parsed_rows:
        if not r["is_valid"]:
            # S2-01 AC: Bỏ qua các dòng lỗi (skip) và ghi nhận vào báo cáo
            skipped += 1
            errors.append({
                "row": r["row"],
                "email": r["email"] or "(Trống)",
                "reason": "; ".join(r["errors"]),
            })
            continue

        try:
            emp_code = r["employee_code"]
            if emp_code and db.query(User).filter(User.employee_code == emp_code).first():
                emp_code = f"NV-{random.randint(100000, 999999)}"
            if not emp_code:
                while True:
                    cand_code = f"NV-{random.randint(100000, 999999)}"
                    if not db.query(User).filter(User.employee_code == cand_code).first():
                        emp_code = cand_code
                        break

            temp_password = r["raw_pwd"] if (r["raw_pwd"] and len(r["raw_pwd"]) >= 6) else generate_secure_random_password(14)
            hashed_pwd = hash_password(temp_password)

            new_user = User(
                email=r["email"],
                full_name=r["full_name"],
                hashed_password=hashed_pwd,
                phone=r["phone"],
                employee_code=emp_code,
                role=",".join(r["roles"]),
                is_active=True,
                account_status="active",
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            imported += 1

            send_activation_and_temporary_password_email(
                to_email=new_user.email,
                full_name=new_user.full_name,
                temp_password=temp_password,
            )
        except Exception as err:
            db.rollback()
            failed += 1
            errors.append({"row": r["row"], "email": r["email"], "reason": f"Lỗi lưu trữ dữ liệu: {str(err)}"})

    record_audit_log(
        db,
        current_admin.email,
        "IMPORT_USERS_EXCEL",
        "User",
        str(imported),
        f"Imported {imported}/{total} users from {file.filename}",
    )

    return {
        "message": f"Nhập dữ liệu thành công {imported}/{total} người dùng.",
        "total": total,
        "imported": imported,
        "imported_count": imported,
        "skipped": skipped,
        "skipped_count": skipped,
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



