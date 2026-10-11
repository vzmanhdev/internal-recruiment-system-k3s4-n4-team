import json
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.application import JobApplication, ApplicationLog
from app.models.offer_onboarding import JobOffer, OnboardingChecklist, OfferApprovalLog
from app.models.audit import AuditLog
from app.api.deps import get_current_user_obj
from app.models.hr import JobTitle
from app.models.master_data import OnboardingTemplate
from app.models.email_automation import EmailTemplate
from app.services.email_dispatch import frontend_link, new_link_token, queue_template_email, render
from app.services.notification_service import notify, users_with_roles
from app.services.access_scope import (
    visible_applications, ensure_can_manage_application, require_any_permission, has_permission,
    role_codes, forbidden, FULL_ACCESS_ROLES,
)

router = APIRouter()

ACTIVE_OFFER_STATES = {"draft", "pending_approval", "approved", "sent", "accepted"}
REVISABLE_STATES = {"draft", "rejected", "declined", "expired"}
DECLINE_REASONS = {"salary", "location", "other_offer", "personal", "other"}
DEFAULT_ONBOARDING_TASKS = [
    ("Chuẩn bị Hợp đồng Thử việc & Hồ sơ nhân sự", "HR", 7),
    ("Tạo Email Công ty & Tài khoản Slack/Jira", "IT", 3),
    ("Bàn giao Máy tính & Thiết bị làm việc", "IT", 1),
    ("Sắp xếp Chỗ ngồi & Thẻ nhân viên", "Admin", 1),
    ("Buổi Orientation & Giới thiệu Phòng ban", "HR", 0),
]


class OfferTerms(BaseModel):
    offered_salary: int = Field(..., gt=0, example=25000000)
    allowance: int = Field(default=0, ge=0)
    currency: str = "VND"
    probation_salary_percentage: int = Field(default=85, ge=50, le=100)
    start_date: str = Field(..., example="2026-11-02")
    probation_duration_months: int = Field(default=2, ge=0, le=6)
    work_location: str = "Hà Nội"
    notes: Optional[str] = None
    salary_justification: Optional[str] = None
    response_deadline: Optional[str] = None


class OfferCreate(OfferTerms):
    application_id: int
    save_as_draft: bool = False


class OfferDecision(BaseModel):
    action: str  # approved, rejected, changes_requested
    comment: Optional[str] = None


class OfferResponse(BaseModel):
    decision: str  # accepted, declined
    reason_category: Optional[str] = None
    comment: Optional[str] = None


class OfferStatusUpdate(BaseModel):
    """Legacy contract kept for older clients; only candidate responses are accepted."""
    status: str
    decline_reason: Optional[str] = None


class ChecklistItemUpdate(BaseModel):
    is_completed: Optional[bool] = None
    responsible_user_id: Optional[int] = None
    due_date: Optional[str] = None


def _parse_date(value: str, field: str) -> date:
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        raise HTTPException(status_code=422, detail=f"{field} không đúng định dạng YYYY-MM-DD.")


def _salary_band(db: Session, app: JobApplication):
    """S7-04: the standard band of the job title (fallback: the band approved on the requisition)."""
    req = app.job_posting.requisition if app.job_posting else None
    if not req:
        return None, None
    if req.job_title_id:
        title = db.query(JobTitle).filter(JobTitle.id == req.job_title_id).first()
        if title:
            return title.min_salary, title.max_salary
    return req.min_salary, req.max_salary


def _validate_terms(db: Session, app: JobApplication, terms: OfferTerms) -> bool:
    """Returns True when the salary is outside the standard band (requires escalation)."""
    start = _parse_date(terms.start_date, "Ngày nhận việc")
    if start < date.today():
        raise HTTPException(status_code=422, detail="Ngày dự kiến nhận việc không được ở quá khứ.")
    if terms.response_deadline:
        deadline = _parse_date(terms.response_deadline, "Hạn phản hồi")
        if deadline < date.today():
            raise HTTPException(status_code=422, detail="Hạn phản hồi offer không được ở quá khứ.")
    band_min, band_max = _salary_band(db, app)
    out_of_band = (band_min is not None and terms.offered_salary < band_min) or (band_max is not None and terms.offered_salary > band_max)
    if out_of_band and not (terms.salary_justification or "").strip():
        raise HTTPException(status_code=422, detail="Mức lương nằm ngoài dải chuẩn của chức danh, bắt buộc nhập giải trình.")
    return out_of_band


def _snapshot(offer: JobOffer) -> str:
    return json.dumps({
        "revision": offer.revision, "offered_salary": offer.offered_salary, "currency": offer.currency,
        "start_date": offer.start_date, "probation_salary_percentage": offer.probation_salary_percentage,
        "probation_duration_months": offer.probation_duration_months, "work_location": offer.work_location,
        "status": offer.status,
    }, ensure_ascii=False)


def _log(db: Session, offer: JobOffer, actor: User, action: str, comment: Optional[str] = None, snapshot: bool = False):
    db.add(OfferApprovalLog(
        offer_id=offer.id, actor_id=actor.id, action=action, level=offer.approval_level,
        comment=comment, snapshot_json=_snapshot(offer) if snapshot else None,
    ))
    db.add(AuditLog(
        actor_id=actor.id, actor_email=actor.email, action=f"OFFER_{action.upper()}",
        target_entity="OFFER", target_id=str(offer.id),
        payload_json=json.dumps({"status": offer.status, "level": offer.approval_level, "revision": offer.revision}, ensure_ascii=False),
    ))


def _transition(db: Session, offer: JobOffer, from_status: str, values: dict) -> None:
    values = dict(values, updated_at=datetime.utcnow())
    updated = db.query(JobOffer).filter(JobOffer.id == offer.id, JobOffer.status == from_status).update(values, synchronize_session=False)
    if updated != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="Offer vừa được người khác xử lý. Vui lòng tải lại.")
    db.refresh(offer)


def _app_log(db: Session, app: JobApplication, actor: User, to_status: str, comment: str):
    if app.status != to_status:
        db.add(ApplicationLog(application_id=app.id, changed_by_id=actor.id, from_status=app.status, to_status=to_status, comment=comment))
        app.status = to_status


def _notify_offer_pending(db: Session, offer: JobOffer, actor_id: int) -> None:
    roles = ["approver"] if offer.approval_level == "approver" else ["hr_manager"]
    name = offer.application.full_name if offer.application else f"#{offer.application_id}"
    notify(db, users_with_roles(db, roles, exclude_user_id=actor_id), "approval_pending", f"Offer chờ duyệt: {name}",
           "Vượt dải lương chuẩn" if offer.requires_escalation else "", link=f"/hr/offers?offer={offer.id}",
           entity_type="OFFER", entity_id=offer.id)


def _letter_variables(offer: JobOffer) -> dict:
    app = offer.application
    return {"candidate_name": app.full_name, "job_title": app.job_posting.title if app.job_posting else "",
            "offer_salary": f"{offer.offered_salary:,} {offer.currency}", "offer_allowance": f"{offer.allowance or 0:,} {offer.currency}",
            "start_date": offer.start_date, "offer_deadline": offer.response_deadline or ""}


def _onboarding_items(db: Session, offer: JobOffer) -> list:
    """S7-08 AC1: department template, else company default template, else built-in defaults."""
    dept_id = offer.application.job_posting.department_id if offer.application and offer.application.job_posting else None
    for dep in (dept_id, None):
        tpl = db.query(OnboardingTemplate).filter(OnboardingTemplate.department_id == dep, OnboardingTemplate.is_active == True).first()  # noqa: E712
        if tpl and tpl.items():
            return [(i["task_name"], i.get("assigned_role", "HR"), int(i.get("days_before_start", 0))) for i in tpl.items()]
    return DEFAULT_ONBOARDING_TASKS


def _get_offer(db: Session, offer_id: int) -> JobOffer:
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời nhận việc")
    return offer


def _expire_if_overdue(db: Session, offer: JobOffer) -> None:
    if offer.status == "sent" and offer.response_deadline:
        try:
            if date.fromisoformat(offer.response_deadline[:10]) < date.today():
                offer.status = "expired"
                db.add(OfferApprovalLog(offer_id=offer.id, actor_id=offer.created_by_id, action="expired",
                                        comment="Quá hạn phản hồi offer"))
                db.commit()
        except ValueError:
            pass


def _visible_offers(db: Session, user: User):
    query = db.query(JobOffer)
    if role_codes(db, user) & FULL_ACCESS_ROLES or has_permission(db, user, "offer:approve"):
        return query
    app_ids = visible_applications(db, user).with_entities(JobApplication.id)
    return query.filter(JobOffer.application_id.in_(app_ids))


@router.get("")
def list_offers(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    query = _visible_offers(db, current_user)
    if status_filter:
        query = query.filter(JobOffer.status == status_filter)
    offers = query.order_by(JobOffer.created_at.desc()).all()
    for offer in offers:
        _expire_if_overdue(db, offer)
    return [o.to_dict() for o in offers]


@router.get("/{offer_id}")
def get_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    offer = _visible_offers(db, current_user).filter(JobOffer.id == offer_id).first()
    if not offer:
        if db.query(JobOffer.id).filter(JobOffer.id == offer_id).first():
            raise forbidden("Bạn không có quyền xem offer này.")
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời nhận việc")
    _expire_if_overdue(db, offer)
    return offer.to_dict()


@router.post("", status_code=201)
def create_offer(
    payload: OfferCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    require_any_permission(db, current_user, "offer:create")
    app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    if app.status in {"hired", "rejected", "withdrawn", "onboarded"}:
        raise HTTPException(status_code=409, detail=f"Không thể tạo offer cho hồ sơ ở trạng thái '{app.status}'.")
    if db.query(JobOffer.id).filter(JobOffer.application_id == app.id).first():
        raise HTTPException(status_code=409, detail="Ứng viên đã có offer. Hãy chỉnh sửa (revise) offer hiện tại thay vì tạo mới.")

    out_of_band = _validate_terms(db, app, payload)
    offer = JobOffer(
        application_id=app.id,
        **payload.model_dump(exclude={"application_id", "save_as_draft"}),
        status="draft" if payload.save_as_draft else "pending_approval",
        requires_escalation=out_of_band,
        approval_level=None if payload.save_as_draft else "hr_manager",
        created_by_id=current_user.id,
    )
    db.add(offer)
    db.flush()
    _log(db, offer, current_user, "created" if payload.save_as_draft else "submitted", snapshot=True)
    if not payload.save_as_draft:
        _notify_offer_pending(db, offer, current_user.id)
    db.commit()
    db.refresh(offer)
    return offer.to_dict()


@router.put("/{offer_id}")
def revise_offer(
    offer_id: int,
    payload: OfferTerms,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    """Edit a draft, or create a revised offer after rejection/decline (S7-07). Previous terms are kept in history."""
    require_any_permission(db, current_user, "offer:create")
    offer = _get_offer(db, offer_id)
    ensure_can_manage_application(db, current_user, offer.application)
    if offer.status not in REVISABLE_STATES:
        raise HTTPException(status_code=409, detail=f"Không thể sửa offer ở trạng thái '{offer.status}'.")

    out_of_band = _validate_terms(db, offer.application, payload)
    from_status = offer.status
    if from_status != "draft":
        _log(db, offer, current_user, "superseded", comment=f"Offer phiên bản {offer.revision} được thay thế", snapshot=True)
    values = payload.model_dump()
    values.update(requires_escalation=out_of_band, status="draft", approval_level=None, decline_reason=None,
                  revision=offer.revision + (0 if from_status == "draft" else 1))
    _transition(db, offer, from_status, values)
    _log(db, offer, current_user, "revised", snapshot=True)
    db.commit()
    db.refresh(offer)
    return offer.to_dict()


@router.post("/{offer_id}/submit")
def submit_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    require_any_permission(db, current_user, "offer:create")
    offer = _get_offer(db, offer_id)
    ensure_can_manage_application(db, current_user, offer.application)
    if offer.status != "draft":
        raise HTTPException(status_code=409, detail=f"Chỉ gửi duyệt được offer ở trạng thái Nháp (hiện tại '{offer.status}').")
    _transition(db, offer, "draft", {"status": "pending_approval", "approval_level": "hr_manager"})
    _log(db, offer, current_user, "submitted")
    _notify_offer_pending(db, offer, current_user.id)
    db.commit()
    db.refresh(offer)
    return offer.to_dict()


@router.post("/{offer_id}/decision")
def decide_offer(
    offer_id: int,
    payload: OfferDecision,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    """S7-05: in-band offers are approved by the HR Manager; over-band offers escalate to an Approver."""
    offer = _get_offer(db, offer_id)
    if offer.status != "pending_approval":
        raise HTTPException(status_code=409, detail=f"Offer không ở trạng thái chờ duyệt (hiện tại '{offer.status}').")
    roles = role_codes(db, current_user)
    if offer.approval_level == "approver":
        allowed = "admin" in roles or ("approver" in roles and has_permission(db, current_user, "offer:approve"))
    else:
        allowed = bool(roles & {"admin", "hr_manager"})
    if not allowed:
        raise forbidden("Bạn không phải cấp duyệt hiện tại của offer này.")
    if offer.created_by_id == current_user.id and "admin" not in roles:
        raise forbidden("Người tạo offer không được tự duyệt offer của mình.")

    comment = (payload.comment or "").strip()
    if payload.action in ("rejected", "changes_requested") and not comment:
        raise HTTPException(status_code=422, detail="Từ chối hoặc Yêu cầu sửa bắt buộc phải nhập ý kiến.")

    if payload.action == "approved":
        if offer.approval_level == "hr_manager" and offer.requires_escalation:
            values = {"approval_level": "approver"}
        else:
            values = {"status": "approved"}
    elif payload.action == "rejected":
        values = {"status": "rejected"}
    elif payload.action == "changes_requested":
        values = {"status": "draft", "approval_level": None}
    else:
        raise HTTPException(status_code=422, detail="Hành động chỉ chấp nhận 'approved', 'rejected' hoặc 'changes_requested'.")

    level = offer.approval_level
    _transition(db, offer, "pending_approval", values)
    db.add(OfferApprovalLog(offer_id=offer.id, actor_id=current_user.id, action=payload.action, level=level, comment=comment or None))
    db.add(AuditLog(actor_id=current_user.id, actor_email=current_user.email, action="OFFER_DECISION", target_entity="OFFER",
                    target_id=str(offer.id), payload_json=json.dumps({"action": payload.action, "level": level, "status": offer.status}, ensure_ascii=False)))
    if offer.status == "pending_approval":
        _notify_offer_pending(db, offer, current_user.id)
    db.commit()
    db.refresh(offer)
    return offer.to_dict()


@router.post("/{offer_id}/send")
def send_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    require_any_permission(db, current_user, "offer:create")
    offer = _get_offer(db, offer_id)
    ensure_can_manage_application(db, current_user, offer.application)
    if offer.status != "approved":
        raise HTTPException(status_code=409, detail="Chỉ gửi được offer đã được duyệt.")
    deadline = offer.response_deadline or (date.today() + timedelta(days=7)).isoformat()
    raw, digest = new_link_token()
    _transition(db, offer, "approved", {"status": "sent", "sent_at": datetime.utcnow(), "response_deadline": deadline,
                                        "response_token_hash": digest})
    _app_log(db, offer.application, current_user, "offered", "Đã gửi thư mời nhận việc")
    _log(db, offer, current_user, "sent")
    link = frontend_link("/candidate/offer", raw)
    app = offer.application
    queue_template_email(db, "OFFER_LETTER", app.email, app.full_name, _letter_variables(offer), related_entity="APPLICATION",
                         related_id=app.id, force=True,
                         footer_html=f'<p>Vui lòng phản hồi trước ngày {deadline}: <a href="{link}">{link}</a></p>')
    db.commit()
    db.refresh(offer)
    return offer.to_dict()


def _respond(db: Session, offer: JobOffer, actor: Optional[User], payload: OfferResponse, via_link: bool = False) -> JobOffer:
    app = offer.application
    if not via_link:
        is_candidate = app.candidate_id is not None and app.candidate_id == actor.id
        if not is_candidate:
            require_any_permission(db, actor, "offer:create")
            ensure_can_manage_application(db, actor, app)
    if actor is None:  # the candidate answered through the e-mail link (no account): attribute to the offer owner, audit the real actor
        actor = db.query(User).filter(User.id == offer.created_by_id).one()
    _expire_if_overdue(db, offer)
    if offer.status != "sent":
        raise HTTPException(status_code=409, detail=f"Offer không ở trạng thái chờ phản hồi (hiện tại '{offer.status}').")

    if payload.decision == "accepted":
        _transition(db, offer, "sent", {"status": "accepted", "responded_at": datetime.utcnow()})
        _app_log(db, app, actor, "hired", "Ứng viên chấp nhận offer")
        start = _parse_date(offer.start_date, "Ngày nhận việc")
        for task_name, role, days_before in _onboarding_items(db, offer):
            db.add(OnboardingChecklist(offer_id=offer.id, task_name=task_name, assigned_role=role,
                                       due_date=(start - timedelta(days=days_before)).isoformat(), is_completed=False))
    elif payload.decision == "declined":
        if payload.reason_category not in DECLINE_REASONS:
            raise HTTPException(status_code=422, detail="Từ chối offer cần chọn lý do: salary, location, other_offer, personal, other.")
        reason = payload.reason_category + (f": {payload.comment}" if payload.comment else "")
        _transition(db, offer, "sent", {"status": "declined", "decline_reason": reason, "responded_at": datetime.utcnow()})
    else:
        raise HTTPException(status_code=422, detail="Phản hồi chỉ chấp nhận 'accepted' hoặc 'declined'.")
    _log(db, offer, actor, payload.decision,
         comment=("[Ứng viên phản hồi qua liên kết email] " if via_link else "") + (payload.comment or ""))
    offer.response_token_hash = None  # link valid for one answer only
    notify(db, [offer.created_by_id], "offer_response",
           f"{app.full_name} {'chấp nhận' if payload.decision == 'accepted' else 'từ chối'} offer", payload.comment or "",
           link=f"/hr/offers?offer={offer.id}", entity_type="OFFER", entity_id=offer.id)
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/respond")
def respond_offer(
    offer_id: int,
    payload: OfferResponse,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    offer = _respond(db, _get_offer(db, offer_id), current_user, payload)
    out = offer.to_dict()
    out["suggest_talent_pool"] = offer.status == "declined"  # S7-07 AC3
    return out


@router.put("/{offer_id}/status")
def update_offer_status(
    offer_id: int,
    payload: OfferStatusUpdate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    if payload.status not in ("accepted", "declined"):
        raise HTTPException(
            status_code=422,
            detail="Trạng thái offer chỉ thay đổi qua quy trình: /submit, /decision, /send, /respond.",
        )
    response = OfferResponse(decision=payload.status, reason_category="other" if payload.status == "declined" else None,
                             comment=payload.decline_reason)
    return _respond(db, _get_offer(db, offer_id), current_user, response).to_dict()


@router.put("/{offer_id}/onboarding/{item_id}")
def update_onboarding_item(
    offer_id: int,
    item_id: int,
    payload: ChecklistItemUpdate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    offer = _get_offer(db, offer_id)
    roles = role_codes(db, current_user)
    item = db.query(OnboardingChecklist).filter(OnboardingChecklist.id == item_id, OnboardingChecklist.offer_id == offer.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục onboarding")
    if not (roles & FULL_ACCESS_ROLES) and item.responsible_user_id != current_user.id:
        raise forbidden("Chỉ HR hoặc người phụ trách mục này mới được cập nhật.")
    if payload.responsible_user_id is not None:
        if not (roles & FULL_ACCESS_ROLES):
            raise forbidden("Chỉ HR mới được phân công người phụ trách.")
        if not db.query(User.id).filter(User.id == payload.responsible_user_id, User.account_status == "active").first():
            raise HTTPException(status_code=422, detail="Người phụ trách không tồn tại hoặc không hoạt động.")
        item.responsible_user_id = payload.responsible_user_id
    if payload.due_date is not None:
        _parse_date(payload.due_date, "Hạn hoàn thành")
        item.due_date = payload.due_date
    if payload.is_completed is not None:
        item.is_completed = payload.is_completed
        item.completed_at = datetime.utcnow() if payload.is_completed else None
    db.flush()
    db.refresh(offer)
    if offer.onboarding_items and all(i.is_completed for i in offer.onboarding_items):
        _app_log(db, offer.application, current_user, "onboarded", "Hoàn tất checklist onboarding")
    db.commit()
    db.refresh(offer)
    return offer.to_dict()


@router.get("/{offer_id}/letter-preview")
def offer_letter_preview(offer_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S7-04 AC3: preview the offer letter with the offer's real data before submitting/sending."""
    offer = _get_offer(db, offer_id)
    ensure_can_manage_application(db, current_user, offer.application)
    from app.services.email_templates import ensure_default_templates
    ensure_default_templates(db)
    tpl = db.query(EmailTemplate).filter(EmailTemplate.code == "OFFER_LETTER").first()
    variables = {"company_name": "", **_letter_variables(offer)}
    from app.core.config import settings
    variables["company_name"] = settings.SMTP_FROM_NAME
    return {"subject": render(tpl.subject, variables), "body_html": render(tpl.body_html, variables)}
