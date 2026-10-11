"""Event-driven business emails from templates (S8-01) with a transactional outbox (S8-02).

``queue_template_email`` only adds an ``email_logs`` row (status ``queued``) to the caller's session, so the
email is persisted atomically with the business change. ``process_email_outbox`` (run by the background worker,
or explicitly) performs delivery and records the real outcome.
"""
import html
import logging
import secrets
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_token
from app.models.email_automation import EmailLog, EmailTemplate
from app.services.email_service import deliver_email_log

logger = logging.getLogger("email_dispatch")


def new_link_token() -> tuple:
    """Returns (raw token for the email link, HMAC digest stored in the DB)."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def frontend_link(path: str, token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}{path}?token={token}"


def render(text: str, variables: Dict[str, object]) -> str:
    out = text
    for key, value in variables.items():
        placeholder = key if key.startswith("{") else "{" + key + "}"
        out = out.replace(placeholder, html.escape(str(value if value is not None else "")))
    return out


def queue_template_email(db: Session, code: str, to_email: str, to_name: str, variables: Dict[str, object],
                         related_entity: Optional[str] = None, related_id=None, footer_html: str = "",
                         force: bool = False) -> Optional[EmailLog]:
    """Queue an email from the template ``code``. Skipped (returns None) when the template is missing,
    inactive, or auto-send is switched off for it (S8-01 AC4) — unless ``force`` (explicit user action)."""
    template = db.query(EmailTemplate).filter(EmailTemplate.code == code).first()
    if not template:
        from app.services.email_templates import ensure_default_templates
        ensure_default_templates(db)
        template = db.query(EmailTemplate).filter(EmailTemplate.code == code).first()
    if not template or not template.is_active or (not template.is_auto_send and not force):
        return None
    variables = {"company_name": settings.SMTP_FROM_NAME, "portal_link": settings.FRONTEND_URL, **variables}
    log = EmailLog(
        template_code=code, recipient_name=to_name or to_email, recipient_email=to_email,
        subject=render(template.subject, variables), body_html=render(template.body_html, variables) + footer_html,
        status="queued", attempts=1, related_entity=related_entity,
        related_id=str(related_id) if related_id is not None else None,
    )
    db.add(log)
    return log


def already_sent(db: Session, code: str, related_entity: str, related_id) -> bool:
    """Duplicate guard (S7-09 AC3): an email of this template was already queued/sent for that record."""
    return db.query(EmailLog.id).filter(
        EmailLog.template_code == code, EmailLog.related_entity == related_entity,
        EmailLog.related_id == str(related_id), EmailLog.status.in_(["queued", "processing", "sent"]),
    ).first() is not None


def process_email_outbox(db: Session, limit: int = 20) -> int:
    rows = db.query(EmailLog).filter(EmailLog.status == "queued").order_by(EmailLog.id).limit(limit).all()
    for row in rows:
        deliver_email_log(row.id, row.body_html, db=db)
    return len(rows)
