from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.core.security import decode_access_token

router = APIRouter()

ALLOWED_STATUSES = {"submitted", "screening", "interviewing", "offered", "hired", "rejected"}

class ApplicationCreate(BaseModel):
    job_posting_id: int
    full_name: str
    email: str
    phone: str
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    years_of_experience: int = 0
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None
    referral_code: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: str # screening, interviewing, offered, hired, rejected
    score: Optional[int] = None
    hr_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

def get_current_user(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    token = authorization.split(" ")[1]
    user_id = decode_access_token(token)
    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    return user

@router.get("")
def list_applications(
    job_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    query = db.query(JobApplication)
    if job_id:
        query = query.filter(JobApplication.job_posting_id == job_id)
    if status_filter:
        query = query.filter(JobApplication.status == status_filter)
    if search:
        query = query.filter(
            (JobApplication.full_name.ilike(f"%{search}%")) |
            (JobApplication.email.ilike(f"%{search}%")) |
            (JobApplication.phone.ilike(f"%{search}%"))
        )

    apps = query.order_by(JobApplication.created_at.desc()).all()
    return [a.to_dict() for a in apps]

@router.get("/{app_id}")
def get_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    
    res = app.to_dict()
    res["logs"] = [log.to_dict() for log in app.logs]
    res["interviews"] = [i.to_dict() for i in app.interviews]
    res["offer"] = app.offer.to_dict() if app.offer else None
    return res

@router.post("", status_code=201)
def submit_application(
    payload: ApplicationCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    candidate_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        user_id = decode_access_token(token)
        if user_id:
            candidate_id = int(user_id)

    try:
        app = JobApplication(
            job_posting_id=payload.job_posting_id,
            candidate_id=candidate_id,
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            current_company=payload.current_company,
            current_position=payload.current_position,
            years_of_experience=payload.years_of_experience,
            cv_url=payload.cv_url,
            cover_letter=payload.cover_letter,
            referral_code=payload.referral_code,
            status="submitted"
        )
        db.add(app)
        job.applications_count += 1
        db.commit()
        db.refresh(app)
        return app.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi nộp hồ sơ: {str(e)}")

@router.put("/{app_id}/status")
def update_application_status(
    app_id: int,
    payload: ApplicationStatusUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    user_roles = set(user.role.split(","))
    if not user_roles.intersection({"admin", "hr_manager", "manager"}):
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật trạng thái hồ sơ ứng tuyển.")

    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Trạng thái '{payload.status}' không hợp lệ.")

    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    old_status = app.status
    try:
        app.status = payload.status
        if payload.score is not None:
            app.score = payload.score
        if payload.hr_notes is not None:
            app.hr_notes = payload.hr_notes
        if payload.rejection_reason is not None:
            app.rejection_reason = payload.rejection_reason

        # Atomic Audit log
        log = ApplicationLog(
            application_id=app.id,
            changed_by_id=user.id,
            from_status=old_status,
            to_status=payload.status,
            comment=payload.hr_notes or payload.rejection_reason or f"Chuyển trạng thái từ {old_status} sang {payload.status}"
        )
        db.add(log)
        db.commit()
        db.refresh(app)
        return app.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật trạng thái hồ sơ: {str(e)}")
