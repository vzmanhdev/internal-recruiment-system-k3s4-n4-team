from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.hr import RecruiterAssignment
from app.models.interview import InterviewSchedule, InterviewInterviewer
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
    user_id = decode_access_token(token, db=db)
    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    return user

def scoped_applications(db: Session, user: User):
    roles = {role.strip().lower() for role in (user.role or "").split(",") if role.strip()}
    query = db.query(JobApplication)
    if roles.intersection({"admin", "hr_manager", "hr"}):
        return query
    if "recruiter" in roles:
        return query.join(JobPosting, JobApplication.job_posting_id == JobPosting.id).join(
            JobRequisition, JobPosting.requisition_id == JobRequisition.id
        ).join(RecruiterAssignment, RecruiterAssignment.requisition_id == JobRequisition.id).filter(
            RecruiterAssignment.recruiter_id == user.id
        ).distinct()
    if roles.intersection({"hiring_manager", "manager", "dept_manager"}):
        return query.join(JobPosting, JobApplication.job_posting_id == JobPosting.id).join(
            JobRequisition, JobPosting.requisition_id == JobRequisition.id
        ).filter((JobRequisition.created_by_id == user.id) | (JobRequisition.department_id == user.department_id))
    if "interviewer" in roles:
        return query.join(InterviewSchedule, InterviewSchedule.application_id == JobApplication.id).join(
            InterviewInterviewer, InterviewInterviewer.interview_id == InterviewSchedule.id
        ).filter(InterviewInterviewer.interviewer_id == user.id).distinct()
    if roles.intersection({"candidate", "employee"}):
        return query.filter(JobApplication.candidate_id == user.id)
    raise HTTPException(status_code=403, detail="B?n kh?ng c? quy?n xem h? s? ?ng tuy?n.")


@router.get("")
def list_applications(
    job_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    query = scoped_applications(db, user)
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
def get_application(app_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    app = scoped_applications(db, user).filter(JobApplication.id == app_id).first()
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
        user_id = decode_access_token(token, db=db)
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
    user_roles = {role.strip().lower() for role in (user.role or "").split(",") if role.strip()}
    if not user_roles.intersection({"admin", "hr_manager", "hr", "manager", "hiring_manager", "recruiter"}):
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật trạng thái hồ sơ ứng tuyển.")

    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Trạng thái '{payload.status}' không hợp lệ.")

    app = scoped_applications(db, user).filter(JobApplication.id == app_id).first()
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
