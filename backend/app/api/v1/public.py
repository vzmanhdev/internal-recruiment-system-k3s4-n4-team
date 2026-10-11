"""Candidate self-service without an account: status lookup and e-mail links (tokens are random, stored as HMAC
digests and bound to exactly one application / interview / offer)."""
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.security import hash_token
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule
from app.models.offer_onboarding import JobOffer
from app.services.notification_service import notify

router = APIRouter()
INVALID_LINK = "Liên kết không hợp lệ hoặc đã hết hiệu lực."


class StatusLookup(BaseModel):
    tracking_code: str = Field(..., min_length=4, max_length=20)
    email: EmailStr


class TokenAction(BaseModel):
    token: str = Field(..., min_length=10)
    confirm: bool = False
    reason: Optional[str] = None


class InterviewReply(BaseModel):
    token: str = Field(..., min_length=10)
    response: str  # confirmed, reschedule_requested
    note: Optional[str] = None


class OfferReply(BaseModel):
    token: str = Field(..., min_length=10)
    decision: str  # accepted, declined
    reason_category: Optional[str] = None
    comment: Optional[str] = None


@router.post("/applications/status")
def lookup_status(payload: StatusLookup, db: Session = Depends(get_db)):
    """S4-05: tracking code + email → general status only (no internal notes, no interviewer names)."""
    app = db.query(JobApplication).filter(JobApplication.tracking_code == payload.tracking_code.strip().upper()).first()
    if not app or app.email.lower() != payload.email.strip().lower():
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khớp với mã tra cứu và email.")
    view = app.candidate_view()
    return {"tracking_code": app.tracking_code, "job_title": view["job_title"], "status": view["public_status"],
            "applied_date": view["applied_date"]}


def _by_token(db: Session, model, column, token: str):
    item = db.query(model).filter(column == hash_token(token)).first()
    if not item:
        raise HTTPException(status_code=404, detail=INVALID_LINK)
    return item


@router.post("/applications/withdraw")
def withdraw_by_link(payload: TokenAction, db: Session = Depends(get_db)):
    """S4-06: withdrawal from the confirmation e-mail; first call previews, second call (confirm=true) executes."""
    from app.api.v1.applications import withdraw
    app = _by_token(db, JobApplication, JobApplication.withdraw_token_hash, payload.token)
    if not payload.confirm:
        return {"confirm_required": True, "job_title": app.job_posting.title if app.job_posting else None,
                "status": app.candidate_view()["public_status"]}
    withdraw(db, app, None, payload.reason)
    db.commit()
    return {"withdrawn": True, "status": "Kết thúc"}


@router.get("/interviews")
def interview_by_link(token: str, db: Session = Depends(get_db)):
    i = _by_token(db, InterviewSchedule, InterviewSchedule.confirmation_token_hash, token)
    if i.status != "scheduled":
        raise HTTPException(status_code=410, detail=INVALID_LINK)
    return {"job_title": i.application.job_posting.title if i.application and i.application.job_posting else None,
            "round_name": i.round_name, "scheduled_time": i.scheduled_time.isoformat(), "duration_minutes": i.duration_minutes,
            "location": i.location, "meeting_link": i.meeting_link, "candidate_response": i.candidate_response}


@router.post("/interviews/respond")
def interview_reply(payload: InterviewReply, db: Session = Depends(get_db)):
    """S6-05 AC2/AC3: confirm or ask to reschedule; the recruiter sees the answer."""
    if payload.response not in ("confirmed", "reschedule_requested"):
        raise HTTPException(status_code=422, detail="Phản hồi chỉ nhận 'confirmed' hoặc 'reschedule_requested'.")
    i = _by_token(db, InterviewSchedule, InterviewSchedule.confirmation_token_hash, payload.token)
    if i.status != "scheduled" or i.scheduled_time < datetime.now():
        raise HTTPException(status_code=410, detail=INVALID_LINK)
    i.candidate_response, i.candidate_response_note, i.candidate_responded_at = payload.response, payload.note, datetime.utcnow()
    notify(db, [i.created_by_id], "interview_response",
           f"{i.application.full_name} {'xác nhận tham dự' if payload.response == 'confirmed' else 'đề nghị đổi lịch'} phỏng vấn",
           payload.note or "", link=f"/hr/interviews?interview={i.id}", entity_type="INTERVIEW", entity_id=i.id)
    db.commit()
    return {"candidate_response": i.candidate_response}


@router.get("/offers")
def offer_by_link(token: str, db: Session = Depends(get_db)):
    offer = _by_token(db, JobOffer, JobOffer.response_token_hash, token)
    if offer.status != "sent" or (offer.response_deadline and date.fromisoformat(offer.response_deadline[:10]) < date.today()):
        raise HTTPException(status_code=410, detail=INVALID_LINK)
    app = offer.application
    return {"candidate_name": app.full_name, "job_title": app.job_posting.title if app.job_posting else None,
            "offered_salary": offer.offered_salary, "allowance": offer.allowance, "currency": offer.currency,
            "start_date": offer.start_date, "work_location": offer.work_location,
            "probation_duration_months": offer.probation_duration_months,
            "probation_salary_percentage": offer.probation_salary_percentage, "response_deadline": offer.response_deadline}


@router.post("/offers/respond")
def offer_reply(payload: OfferReply, db: Session = Depends(get_db)):
    """S7-06: accept or decline (with comment) until the deadline; the pipeline updates immediately."""
    from app.api.v1.offer_onboarding import OfferResponse, _respond
    offer = _by_token(db, JobOffer, JobOffer.response_token_hash, payload.token)
    result = _respond(db, offer, None, OfferResponse(decision=payload.decision, reason_category=payload.reason_category,
                                                     comment=payload.comment), via_link=True)
    return {"status": result.status}
