from datetime import datetime
from math import ceil
from typing import Optional, List
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
    PaginatedInterviewsResponse,
)

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}

def get_current_user_from_header(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập để thực hiện thao tác này")
    token = authorization.split(" ", 1)[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên làm việc không hợp lệ hoặc đã hết hạn")
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản chưa được kích hoạt hoặc không khả dụng")
    return user

def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)

def generate_interview_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(InterviewSchedule).count() + 1
    return f"INT-{year}-{count:04d}"

# ==================== INTERVIEW SCHEDULING ENDPOINTS ====================

@router.post("/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: InterviewCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    app_record = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    code = generate_interview_code(db)

    schedule = InterviewSchedule(
        code=code,
        application_id=payload.application_id,
        title=payload.title.strip(),
        interview_type=payload.interview_type,
        location_or_link=payload.location_or_link.strip(),
        start_time=payload.start_time,
        end_time=payload.end_time,
        notes=payload.notes,
        status="scheduled",
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    # Assign interviewers
    if payload.interviewer_ids:
        for u_id in set(payload.interviewer_ids):
            user = db.query(User).filter(User.id == u_id).first()
            if user:
                interviewer_rel = InterviewInterviewer(
                    interview_id=schedule.id,
                    interviewer_id=user.id,
                )
                db.add(interviewer_rel)
        db.commit()
        db.refresh(schedule)

    return schedule.to_dict()

@router.get("/interviews/my", response_model=PaginatedInterviewsResponse)
def get_my_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_header(authorization, db)

    query = (
        db.query(InterviewSchedule)
        .join(InterviewInterviewer, InterviewSchedule.id == InterviewInterviewer.interview_id)
        .filter(InterviewInterviewer.interviewer_id == current_user.id)
    )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(InterviewSchedule.start_time.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [sc.to_dict() for sc in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.get("/interviews/manage/all", response_model=PaginatedInterviewsResponse)
def list_manage_interviews(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    query = db.query(InterviewSchedule)
    if status_filter != "all":
        query = query.filter(InterviewSchedule.status == status_filter)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InterviewSchedule.title.ilike(term),
                InterviewSchedule.code.ilike(term),
            )
        )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(InterviewSchedule.start_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [sc.to_dict() for sc in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.put("/interviews/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    payload: InterviewUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    schedule = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")

    if payload.title is not None:
        schedule.title = payload.title.strip()
    if payload.interview_type is not None:
        schedule.interview_type = payload.interview_type
    if payload.location_or_link is not None:
        schedule.location_or_link = payload.location_or_link.strip()
    if payload.start_time is not None:
        schedule.start_time = payload.start_time
    if payload.end_time is not None:
        schedule.end_time = payload.end_time
    if payload.notes is not None:
        schedule.notes = payload.notes
    if payload.status is not None:
        schedule.status = payload.status
    schedule.updated_at = datetime.utcnow()

    if payload.interviewer_ids is not None:
        # Clear existing interviewers
        db.query(InterviewInterviewer).filter(InterviewInterviewer.interview_id == schedule.id).delete()
        for u_id in set(payload.interviewer_ids):
            user = db.query(User).filter(User.id == u_id).first()
            if user:
                interviewer_rel = InterviewInterviewer(
                    interview_id=schedule.id,
                    interviewer_id=user.id,
                )
                db.add(interviewer_rel)

    db.commit()
    db.refresh(schedule)

    return schedule.to_dict()

@router.get("/applications/{application_id}/interviews", response_model=List[InterviewResponse])
def get_application_interviews(
    application_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    schedules = (
        db.query(InterviewSchedule)
        .filter(InterviewSchedule.application_id == application_id)
        .order_by(InterviewSchedule.start_time.asc())
        .all()
    )

    return [sc.to_dict() for sc in schedules]
