from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.core.security import decode_access_token

router = APIRouter()

class InterviewCreate(BaseModel):
    application_id: int
    round_number: int = 1
    round_name: str = "Vòng 1: HR Screening"
    scheduled_time: str # ISO string or YYYY-MM-DD HH:MM
    duration_minutes: int = 45
    location: str = "Phòng Họp 302 / Google Meet"
    meeting_link: Optional[str] = None
    interviewer_ids: List[int] = Field(default_factory=list)

class InterviewFeedbackUpdate(BaseModel):
    status: str = "completed" # completed, cancelled
    feedback_notes: Optional[str] = None
    score: Optional[int] = None # 1-10
    passed: Optional[bool] = None

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
def list_interviews(
    application_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InterviewSchedule)
    if application_id:
        query = query.filter(InterviewSchedule.application_id == application_id)
    if status_filter:
        query = query.filter(InterviewSchedule.status == status_filter)

    interviews = query.order_by(InterviewSchedule.scheduled_time.asc()).all()
    return [i.to_dict() for i in interviews]

@router.post("", status_code=201)
def schedule_interview(
    payload: InterviewCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    try:
        dt = datetime.fromisoformat(payload.scheduled_time.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.utcnow()

    interview = InterviewSchedule(
        application_id=payload.application_id,
        round_number=payload.round_number,
        round_name=payload.round_name,
        scheduled_time=dt,
        duration_minutes=payload.duration_minutes,
        location=payload.location,
        meeting_link=payload.meeting_link,
        status="scheduled",
        created_by_id=user.id
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Add interviewers
    for interviewer_id in payload.interviewer_ids:
        inv = InterviewInterviewer(
            interview_id=interview.id,
            interviewer_id=interviewer_id
        )
        db.add(inv)

    # Update application status to interviewing
    app.status = "interviewing"
    db.commit()
    db.refresh(interview)

    return interview.to_dict()

@router.put("/{interview_id}/feedback")
def update_interview_feedback(
    interview_id: int,
    payload: InterviewFeedbackUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    interview = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")

    interview.status = payload.status
    if payload.feedback_notes is not None:
        interview.feedback_notes = payload.feedback_notes
    if payload.score is not None:
        interview.score = payload.score
    if payload.passed is not None:
        interview.passed = payload.passed

    db.commit()
    db.refresh(interview)

    return interview.to_dict()
