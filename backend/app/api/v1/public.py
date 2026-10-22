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


DEFAULT_CAREER_DATA = {
    "configured": True,
    "company_name": "Tập Đoàn Doanh Nghiệp Enterprise",
    "slogan": "Cùng nhau tạo nên những điều lớn lao và bứt phá nấc thang sự nghiệp",
    "contact_email": "tuyendung@enterprise.com",
    "contact_phone": "1900 6868",
    "address": "Tầng 12, Tòa nhà Enterprise Tower, Cầu Giấy, Hà Nội",
    "website": "https://enterprise.com",
    "logo_url": "",
    "banner_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
    "about_us": "Về danh tiếng và thị trường, công ty là điểm tựa vững chắc cho sự nghiệp của bạn. Chúng tôi tin rằng tài sản quý giá nhất chính là đội ngũ nhân sự. Sứ mệnh của chúng tôi là tạo nên không gian làm việc mở, công bằng và cơ hội phát triển không giới hạn cho mọi nhân viên.",
    "benefits": [
        {"title": "Bảo hiểm toàn diện", "description": "Bảo hiểm toàn diện nhân lương, bảo hiểm y tế mở rộng cho cả gia đình.", "icon": "ShieldCheck"},
        {"title": "Đào tạo chuyên sâu", "description": "Đào tạo chuyên sâu các kỹ năng mới, hỗ trợ 100% học bổng chứng chỉ quốc tế.", "icon": "GraduationCap"},
        {"title": "Thưởng thâm niên", "description": "Thưởng thâm niên và các chế độ đãi ngộ vượt bậc khi cống hiến lâu dài.", "icon": "Award"}
    ],
}


@router.get("/career-page")
def career_page(db: Session = Depends(get_db)):
    """Public career page content (company, about, benefits) as configured by HR; defaults provided if not configured."""
    from app.models.master_data import CareerPageSettings
    row = db.query(CareerPageSettings).filter(CareerPageSettings.id == 1).first()
    if row and row.data():
        d = row.data()
        return {
            **DEFAULT_CAREER_DATA,
            **d,
            "configured": True,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }
    return {**DEFAULT_CAREER_DATA, "configured": False}


@router.post("/applications/status")
def lookup_status(payload: StatusLookup, db: Session = Depends(get_db)):
    """S4-05: tracking code + email → general status only (no internal notes, no interviewer names)."""
    app = db.query(JobApplication).filter(JobApplication.tracking_code == payload.tracking_code.strip().upper()).first()
    if not app or app.email.lower() != payload.email.strip().lower():
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khớp với mã tra cứu và email.")
    view = app.candidate_view()
    return {
        "tracking_code": app.tracking_code,
        "job_title": view["job_title"],
        "status": view["public_status"],
        "applied_date": view["applied_date"],
    }


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
    cand_view = app.candidate_view()
    if not payload.confirm:
        return {
            "confirm_required": True,
            "job_title": app.job_posting.title if app.job_posting else None,
            "department": app.job_posting.department_name if app.job_posting else None,
            "status": cand_view["public_status"],
            "current_status": app.status,
            "tracking_code": cand_view["tracking_code"],
            "candidate_name": app.full_name,
            "full_name": app.full_name,
            "email": app.email,
            "phone": app.phone,
            "applied_date": cand_view["applied_date"],
            "can_withdraw": app.status not in ("hired", "rejected", "withdrawn", "onboarded", "offered"),
        }
    reason = (payload.reason or "Ứng viên chủ động rút hồ sơ").strip()
    withdraw(db, app, None, reason)
    db.commit()
    db.refresh(app)
    return {
        "withdrawn": True,
        "status": "Kết thúc",
        "current_status": "withdrawn",
        "tracking_code": app.tracking_code or f"APP-{app.id:08d}",
        "job_title": app.job_posting.title if app.job_posting else None,
        "candidate_name": app.full_name,
        "withdrawn_at": app.stage_entered_at.isoformat() if app.stage_entered_at else datetime.utcnow().isoformat(),
        "reason": reason,
        "message": f"Hồ sơ ứng tuyển vị trí {app.job_posting.title if app.job_posting else ''} đã được rút thành công. Cảm ơn bạn đã quan tâm đến công ty.",
    }


@router.get("/interviews")
def interview_by_link(token: str, db: Session = Depends(get_db)):
    i = _by_token(db, InterviewSchedule, InterviewSchedule.confirmation_token_hash, token)
    if i.status != "scheduled":
        raise HTTPException(status_code=410, detail="Buổi phỏng vấn đã bị hủy hoặc thay đổi. Liên kết không còn hiệu lực.")
    if i.scheduled_time < datetime.now():
        raise HTTPException(status_code=410, detail="Buổi phỏng vấn đã kết thúc, liên kết không còn hiệu lực.")
    posting = i.application.job_posting if i.application else None
    return {
        "id": i.id,
        "candidate_name": i.application.full_name if i.application else None,
        "candidate_email": i.application.email if i.application else None,
        "job_title": posting.title if posting else None,
        "department": posting.department_name if posting else None,
        "round_name": i.round_name,
        "round_number": i.round_number,
        "scheduled_time": i.scheduled_time.isoformat(),
        "duration_minutes": i.duration_minutes,
        "location": i.location,
        "meeting_link": i.meeting_link,
        "preparation_notes": i.preparation_notes or "Vui lòng có mặt trước 10 phút, trang phục lịch sự. Nếu phỏng vấn online, hãy kiểm tra camera/micro và kết nối Internet ổn định. Nếu trực tiếp, vui lòng mang theo CV bản in.",
        "candidate_response": i.candidate_response,
        "candidate_response_note": i.candidate_response_note,
        "candidate_responded_at": i.candidate_responded_at.isoformat() if i.candidate_responded_at else None,
    }


@router.post("/interviews/respond")
def interview_reply(payload: InterviewReply, db: Session = Depends(get_db)):
    """S6-05 AC2/AC3: confirm or ask to reschedule; the recruiter sees the answer."""
    if payload.response not in ("confirmed", "reschedule_requested"):
        raise HTTPException(status_code=422, detail="Phản hồi chỉ nhận 'confirmed' hoặc 'reschedule_requested'.")
    i = _by_token(db, InterviewSchedule, InterviewSchedule.confirmation_token_hash, payload.token)
    if i.status != "scheduled":
        raise HTTPException(status_code=410, detail="Buổi phỏng vấn đã bị hủy hoặc không còn ở trạng thái chờ phỏng vấn.")
    if i.scheduled_time < datetime.now():
        raise HTTPException(status_code=410, detail="Buổi phỏng vấn đã kết thúc trong quá khứ, liên kết không còn hiệu lực.")
    i.candidate_response, i.candidate_response_note, i.candidate_responded_at = payload.response, payload.note, datetime.utcnow()
    posting = i.application.job_posting if i.application else None
    action_label = "xác nhận tham dự" if payload.response == "confirmed" else "đề nghị đổi lịch"
    recipients = [i.created_by_id]
    if i.interviewers:
        recipients.extend(intv.interviewer_id for intv in i.interviewers)
    notify(db, list(dict.fromkeys(recipients)), "interview_response",
           f"{i.application.full_name} {action_label} phỏng vấn",
           payload.note or "", link=f"/recruiter/interviews?interview={i.id}", entity_type="INTERVIEW", entity_id=i.id)
    db.commit()
    return {
        "status": "success",
        "candidate_response": i.candidate_response,
        "candidate_response_note": i.candidate_response_note,
        "candidate_responded_at": i.candidate_responded_at.isoformat() if i.candidate_responded_at else None,
        "job_title": posting.title if posting else None,
        "scheduled_time": i.scheduled_time.isoformat(),
        "location": i.location,
        "meeting_link": i.meeting_link,
        "message": f"Đã ghi nhận {action_label} của bạn thành công.",
    }


@router.get("/offers")
def offer_by_link(token: str, db: Session = Depends(get_db)):
    offer = _by_token(db, JobOffer, JobOffer.response_token_hash, token)
    if offer.status != "sent" or (offer.response_deadline and date.fromisoformat(offer.response_deadline[:10]) < date.today()):
        raise HTTPException(status_code=410, detail=INVALID_LINK)
    app = offer.application
    posting = app.job_posting if app else None
    return {
        "candidate_name": app.full_name,
        "job_title": posting.title if posting else None,
        "department": posting.department_name if posting else None,
        "offered_salary": offer.offered_salary,
        "allowance": offer.allowance,
        "currency": offer.currency,
        "start_date": offer.start_date,
        "work_location": offer.work_location,
        "probation_duration_months": offer.probation_duration_months,
        "probation_salary_percentage": offer.probation_salary_percentage,
        "response_deadline": offer.response_deadline,
    }


@router.post("/offers/respond")
def offer_reply(payload: OfferReply, db: Session = Depends(get_db)):
    """S7-06: accept or decline (with comment) until the deadline; the pipeline updates immediately."""
    from app.api.v1.offer_onboarding import OfferResponse, _respond
    offer = _by_token(db, JobOffer, JobOffer.response_token_hash, payload.token)
    result = _respond(db, offer, None, OfferResponse(decision=payload.decision, reason_category=payload.reason_category,
                                                     comment=payload.comment), via_link=True)
    return {"status": result.status}
