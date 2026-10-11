from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.email_automation import EmailTemplate, EmailLog
from app.models.application import JobApplication
from app.models.audit import AuditLog
from app.api.deps import require_roles_dep
from app.services.access_scope import ensure_application_visible
from app.services.email_service import deliver_email_log, SENSITIVE_BODY_PLACEHOLDER
from app.services.email_templates import DEFAULT_TEMPLATES, ensure_default_templates
from app.schemas.email_automation import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplatePreviewRequest,
    EmailTemplateResponse,
    EmailLogResponse
)

router = APIRouter(prefix="/email-automation", tags=["email-automation"])

# Backlog matrix "Email & thông báo": Recruiter F, HR Manager F (Admin full access).
EMAIL_STAFF = require_roles_dep({"hr_manager", "recruiter"})
MAX_EMAIL_ATTEMPTS = 3


def seed_defaults_if_empty(db: Session):
    if ensure_default_templates(db):
        db.commit()


@router.get("/templates", response_model=List[EmailTemplateResponse])
def get_email_templates(current_user: User = Depends(EMAIL_STAFF), db: Session = Depends(get_db)):
    seed_defaults_if_empty(db)
    templates = db.query(EmailTemplate).order_by(EmailTemplate.id.asc()).all()
    return [t.to_dict() for t in templates]


def _template_audit(db: Session, actor: User, action: str, template: EmailTemplate) -> None:
    db.add(AuditLog(actor_id=actor.id, actor_email=actor.email, action=action, target_entity="EMAIL_TEMPLATE",
                    target_id=str(template.id), payload_json=template.code))


@router.post("/templates", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_email_template(payload: EmailTemplateCreate, current_user: User = Depends(EMAIL_STAFF), db: Session = Depends(get_db)):
    existing = db.query(EmailTemplate).filter(EmailTemplate.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Mẫu email với mã '{payload.code}' đã tồn tại.")

    template = EmailTemplate(**payload.model_dump())
    db.add(template)
    db.flush()
    _template_audit(db, current_user, "EMAIL_TEMPLATE_CREATE", template)
    db.commit()
    db.refresh(template)
    return template.to_dict()


@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
def update_email_template(template_id: int, payload: EmailTemplateUpdate, current_user: User = Depends(EMAIL_STAFF), db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, val)
    template.updated_at = datetime.utcnow()
    _template_audit(db, current_user, "EMAIL_TEMPLATE_UPDATE", template)
    db.commit()
    db.refresh(template)
    return template.to_dict()


@router.delete("/templates/{template_id}")
def delete_email_template(template_id: int, current_user: User = Depends(require_roles_dep({"hr_manager"})), db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email.")
    _template_audit(db, current_user, "EMAIL_TEMPLATE_DELETE", template)
    db.delete(template)
    db.commit()
    return {"message": "Đã xóa mẫu email thành công"}


PLACEHOLDER_VARIABLES = ["{candidate_name}", "{job_title}", "{company_name}", "{interview_time}", "{interview_location}",
                         "{interviewer_name}", "{offer_salary}", "{requisition_code}", "{portal_link}"]


def _variables_for_application(db: Session, app: JobApplication) -> dict:
    from app.core.config import settings
    job = app.job_posting
    values = {
        "{candidate_name}": app.full_name,
        "{job_title}": job.title if job else "",
        "{company_name}": settings.SMTP_FROM_NAME,
        "{portal_link}": settings.FRONTEND_URL,
        "{requisition_code}": job.requisition.code if job and job.requisition else "",
    }
    upcoming = sorted((i for i in app.interviews if i.status == "scheduled"), key=lambda i: i.scheduled_time)
    if upcoming:
        nxt = upcoming[0]
        values["{interview_time}"] = nxt.scheduled_time.strftime("%H:%M - %d/%m/%Y")
        values["{interview_location}"] = nxt.meeting_link or nxt.location
        values["{interviewer_name}"] = ", ".join(i.interviewer.full_name for i in nxt.interviewers if i.interviewer)
    if app.offer:
        values["{offer_salary}"] = f"{app.offer.offered_salary:,} {app.offer.currency}"
    return values


@router.post("/templates/{template_id}/preview")
def preview_email_template(template_id: int, payload: Optional[EmailTemplatePreviewRequest] = None,
                           current_user: User = Depends(EMAIL_STAFF), db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email.")

    subject = (payload.subject if payload and payload.subject else template.subject)
    body_html = (payload.body_html if payload and payload.body_html else template.body_html)

    replacements = {}
    source = "placeholders"
    if payload and payload.application_id:
        app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển để xem trước.")
        ensure_application_visible(db, current_user, app)
        replacements = _variables_for_application(db, app)
        source = "application"
    if payload and payload.sample_data:
        replacements.update({(k if k.startswith("{") else "{" + k + "}"): v for k, v in payload.sample_data.items()})

    rendered_subject, rendered_body = subject, body_html
    for key, val in replacements.items():
        rendered_subject = rendered_subject.replace(key, str(val))
        rendered_body = rendered_body.replace(key, str(val))

    return {
        "template_id": template.id,
        "code": template.code,
        "name": template.name,
        "rendered_subject": rendered_subject,
        "rendered_body_html": rendered_body,
        "data_source": source,
        "available_variables": PLACEHOLDER_VARIABLES,
    }


@router.get("/logs", response_model=List[EmailLogResponse])
def get_email_logs(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(EMAIL_STAFF),
    db: Session = Depends(get_db)
):
    query = db.query(EmailLog)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(EmailLog.status == status_filter.lower())
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (EmailLog.recipient_name.ilike(pattern)) |
            (EmailLog.recipient_email.ilike(pattern)) |
            (EmailLog.subject.ilike(pattern))
        )
    logs = query.order_by(EmailLog.sent_at.desc()).limit(500).all()
    return [log.to_dict() for log in logs]


@router.post("/logs/{log_id}/retry", response_model=EmailLogResponse)
def retry_failed_email_log(log_id: int, current_user: User = Depends(EMAIL_STAFF), db: Session = Depends(get_db)):
    """Re-attempt delivery and return the REAL outcome (sent / failed / skipped). Bounded attempts."""
    log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhật ký gửi email.")
    if log.status not in ("failed", "skipped"):
        raise HTTPException(status_code=409, detail=f"Chỉ gửi lại được email thất bại hoặc bị bỏ qua (hiện tại '{log.status}').")
    if log.body_html == SENSITIVE_BODY_PLACEHOLDER:
        raise HTTPException(status_code=409, detail="Email chứa OTP/mật khẩu không được gửi lại; người dùng cần yêu cầu mã mới.")
    if (log.attempts or 1) >= MAX_EMAIL_ATTEMPTS:
        raise HTTPException(status_code=409, detail=f"Đã đạt số lần gửi tối đa ({MAX_EMAIL_ATTEMPTS}).")

    log.attempts = (log.attempts or 1) + 1
    log.retried_at = datetime.utcnow()
    db.add(AuditLog(actor_id=current_user.id, actor_email=current_user.email, action="EMAIL_RETRY",
                    target_entity="EMAIL_LOG", target_id=str(log.id), payload_json=f"attempt={log.attempts}"))
    body = log.body_html
    db.commit()
    deliver_email_log(log.id, body, db=db)
    db.expire_all()
    log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
    return log.to_dict()
