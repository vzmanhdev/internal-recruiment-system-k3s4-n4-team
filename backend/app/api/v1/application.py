from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from uuid import uuid4
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.application import JobApplication, ApplicationLog
from app.models.job import JobPosting
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationTrackingRequest,
    CandidateProfileUpdate,
    ApplicationResponse,
    ApplicationStageUpdate,
    PaginatedApplicationsResponse,
)
from app.services.audit import write_audit_log

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager", "recruiter"}
CV_MAX_BYTES = 10 * 1024 * 1024
CV_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}
CV_UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "cv"
CV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
_recent_submissions: dict[str, datetime] = {}

def get_user_from_token(authorization: Optional[str], db: Session) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        return None
    return db.query(User).filter(User.id == int(user_id_str)).first()

def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)


def generate_app_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(JobApplication).count() + 1
    return f"APP-{year}-{count:04d}"

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_application(
    payload: ApplicationCreate,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if payload.website:
        raise HTTPException(status_code=400, detail="Không thể gửi hồ sơ. Vui lòng tải lại trang và thử lại.")
    if payload.started_at:
        started_at = payload.started_at
        if started_at.tzinfo:
            started_at = started_at.astimezone(timezone.utc).replace(tzinfo=None)
        if datetime.utcnow() - started_at < timedelta(seconds=3):
            raise HTTPException(status_code=429, detail="Bạn thao tác quá nhanh. Vui lòng kiểm tra lại thông tin trước khi gửi.")

    # Verify job exists, is published and has not expired.
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job or job.status != "published" or (job.deadline and job.deadline < datetime.utcnow()):
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng hoặc vị trí đã hết hạn nhận hồ sơ")

    normalized_email = payload.email.lower().strip()
    duplicate = db.query(JobApplication).filter(
        JobApplication.job_id == payload.job_id,
        JobApplication.email == normalized_email,
        JobApplication.status.notin_(["withdrawn", "rejected"]),
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail=f"Bạn đã nộp hồ sơ cho vị trí này. Mã tra cứu: {duplicate.code}")

    client_ip = request.client.host if request.client else "unknown"
    spam_key = f"{client_ip}:{normalized_email}"
    previous = _recent_submissions.get(spam_key)
    if previous and datetime.utcnow() - previous < timedelta(seconds=30):
        raise HTTPException(status_code=429, detail="Bạn vừa gửi một hồ sơ. Vui lòng đợi 30 giây trước khi thử lại.")

    current_user = get_user_from_token(authorization, db) if authorization else None
    candidate_id = current_user.id if current_user else None

    code = generate_app_code(db)

    app_record = JobApplication(
        code=code,
        job_id=payload.job_id,
        candidate_id=candidate_id,
        full_name=payload.full_name.strip(),
        email=normalized_email,
        phone=payload.phone.strip(),
        cv_url=payload.cv_url,
        cv_filename=payload.cv_filename,
        cv_content_type=payload.cv_content_type,
        cv_extracted_data=json.dumps({
            "full_name": payload.full_name.strip(),
            "email": normalized_email,
            "phone": payload.phone.strip(),
            "skills": [],
            "education": "",
            "experience_summary": "",
        }, ensure_ascii=False),
        cover_letter=payload.cover_letter,
        current_department=payload.current_department,
        referral_code=payload.referral_code,
        status="applied",
    )

    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    _recent_submissions[spam_key] = datetime.utcnow()

    # Initial Log
    log = ApplicationLog(
        application_id=app_record.id,
        user_id=candidate_id,
        from_status="none",
        to_status="applied",
        note="Ứng viên nộp hồ sơ thành công",
    )
    db.add(log)
    db.commit()
    db.refresh(app_record)

    return app_record.to_dict()

@router.post("/upload-cv", status_code=status.HTTP_201_CREATED)
async def upload_cv(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    expected_suffix = CV_TYPES.get(file.content_type or "")
    if not expected_suffix or suffix != expected_suffix:
        raise HTTPException(status_code=415, detail="CV chỉ chấp nhận tệp PDF hoặc DOCX.")
    content = await file.read(CV_MAX_BYTES + 1)
    if len(content) > CV_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Dung lượng CV tối đa là 10MB.")
    if (suffix == ".pdf" and not content.startswith(b"%PDF")) or (suffix == ".docx" and not content.startswith(b"PK")):
        raise HTTPException(status_code=415, detail="Nội dung tệp CV không đúng định dạng PDF hoặc DOCX.")
    stored_name = f"{uuid4().hex}{suffix}"
    destination = CV_UPLOAD_DIR / stored_name
    destination.write_bytes(content)
    original_name = Path(file.filename or "CV").name
    return {
        "url": f"/uploads/cv/{stored_name}",
        "filename": original_name,
        "content_type": file.content_type,
        "size": len(content),
        "extracted_data": {
            "full_name": Path(original_name).stem.replace("_", " ").replace("-", " ").title(),
            "skills": [],
            "education": "",
            "experience_summary": "",
        },
    }

@router.post("/track")
def track_application(payload: ApplicationTrackingRequest, db: Session = Depends(get_db)):
    app_record = db.query(JobApplication).filter(JobApplication.code == payload.code.strip().upper()).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ với mã tra cứu này.")
    data = app_record.to_dict()
    return {
        "code": data["code"],
        "job_title": data["job_title"],
        "department_name": data["department_name"],
        "status": data["status"],
        "created_at": data["created_at"],
        "updated_at": data["updated_at"],
        "history": [{"to_status": item["to_status"], "created_at": item["created_at"]} for item in data["logs"]],
    }

@router.get("/my", response_model=PaginatedApplicationsResponse)
def get_my_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Bạn cần đăng nhập để xem danh sách hồ sơ đã nộp")
    
    current_user = get_user_from_token(authorization, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Phiên làm việc hết hạn")

    query = db.query(JobApplication).filter(
        or_(JobApplication.candidate_id == current_user.id, JobApplication.email == current_user.email.lower())
    )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(JobApplication.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [app.to_dict() for app in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.get("/manage/all", response_model=PaginatedApplicationsResponse)
def list_manage_applications(
    search: str = "",
    job_id: Optional[int] = None,
    status_filter: str = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    query = db.query(JobApplication)

    if job_id:
        query = query.filter(JobApplication.job_id == job_id)

    if status_filter != "all":
        query = query.filter(JobApplication.status == status_filter)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                JobApplication.full_name.ilike(term),
                JobApplication.email.ilike(term),
                JobApplication.phone.ilike(term),
                JobApplication.code.ilike(term),
            )
        )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(JobApplication.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [app.to_dict() for app in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_detail(
    application_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    current_user = get_user_from_token(authorization, db) if authorization else None
    
    # Check permissions: HR/Admin or Candidate owner
    is_hr = current_user and set(current_user.role.split(",")).intersection(HR_ADMIN_ROLES)
    is_owner = current_user and (app_record.candidate_id == current_user.id or app_record.email == current_user.email.lower())

    if not (is_hr or is_owner):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem thông tin hồ sơ này")

    return app_record.to_dict()

@router.put("/{application_id}/profile", response_model=ApplicationResponse)
def update_candidate_profile(
    application_id: int,
    payload: CandidateProfileUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates:
        updates["email"] = str(updates["email"]).lower().strip()
    if "cv_extracted_data" in updates:
        updates["cv_extracted_data"] = json.dumps(updates["cv_extracted_data"], ensure_ascii=False)
    if "tags" in updates:
        updates["tags"] = json.dumps(list(dict.fromkeys(updates["tags"])), ensure_ascii=False)
    for key, value in updates.items():
        setattr(app_record, key, value)
    app_record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app_record)
    return app_record.to_dict()

@router.post("/{application_id}/stage", response_model=ApplicationResponse)
def update_application_stage(
    application_id: int,
    payload: ApplicationStageUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    hr_user = get_hr_user(authorization, db)
    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    valid_statuses = {"applied", "screening", "interviewing", "offered", "hired", "rejected"}
    if payload.to_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Trạng thái phễu không hợp lệ")

    from_status = app_record.status
    app_record.status = payload.to_status
    app_record.updated_at = datetime.utcnow()

    log = ApplicationLog(
        application_id=app_record.id,
        user_id=hr_user.id,
        from_status=from_status,
        to_status=payload.to_status,
        note=payload.note.strip() if payload.note else f"Chuyển giai đoạn từ {from_status} sang {payload.to_status}",
    )
    db.add(log)
    db.commit()
    db.refresh(app_record)

    return app_record.to_dict()


@router.post("/{application_id}/withdraw", response_model=ApplicationResponse)
def withdraw_application(
    application_id: int,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_user_from_token(authorization, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Bạn cần đăng nhập để rút hồ sơ")
    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    is_owner = app_record.candidate_id == current_user.id or app_record.email == current_user.email.lower()
    if not is_owner:
        raise HTTPException(status_code=403, detail="Bạn không có quyền rút hồ sơ này")
    if app_record.status in {"withdrawn", "rejected", "hired"}:
        raise HTTPException(status_code=400, detail="Hồ sơ ở trạng thái hiện tại không thể rút")

    previous_status = app_record.status
    app_record.status = "withdrawn"
    app_record.updated_at = datetime.utcnow()
    db.add(ApplicationLog(
        application_id=app_record.id,
        user_id=current_user.id,
        from_status=previous_status,
        to_status="withdrawn",
        note="Ứng viên chủ động rút hồ sơ",
    ))
    db.commit()
    db.refresh(app_record)
    write_audit_log(db, action="Rút hồ sơ ứng tuyển", module="Ứng tuyển", request=request, user=current_user, status="warning", details=app_record.code)
    return app_record.to_dict()
