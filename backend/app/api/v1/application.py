from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
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
    ApplicationResponse,
    ApplicationStageUpdate,
    PaginatedApplicationsResponse,
)
from app.services.audit import write_audit_log

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}

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
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    # Verify job exists and is published
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job or job.status != "published":
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng hoặc vị trí đã hết hạn nhận hồ sơ")

    current_user = get_user_from_token(authorization, db) if authorization else None
    candidate_id = current_user.id if current_user else None

    code = generate_app_code(db)

    app_record = JobApplication(
        code=code,
        job_id=payload.job_id,
        candidate_id=candidate_id,
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone.strip(),
        cv_url=payload.cv_url,
        cover_letter=payload.cover_letter,
        current_department=payload.current_department,
        referral_code=payload.referral_code,
        status="applied",
    )

    db.add(app_record)
    db.commit()
    db.refresh(app_record)

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
