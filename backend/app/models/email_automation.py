from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from app.db.session import Base

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. CONFIRM_APPLICATION, INVITE_INTERVIEW, REJECT_CANDIDATE, OFFER_LETTER, REQ_APPROVED
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="Tuyển dụng", nullable=False) # Tuyển dụng, Phỏng vấn, Offer, Hệ thống
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    is_auto_send = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "category": self.category,
            "subject": self.subject,
            "body_html": self.body_html,
            "is_auto_send": self.is_auto_send,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    template_code = Column(String(50), nullable=True)
    recipient_name = Column(String(150), nullable=False)
    recipient_email = Column(String(150), index=True, nullable=False)
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    status = Column(String(30), default="queued", nullable=False)  # queued, processing, sent, failed, skipped
    error_message = Column(Text, nullable=True)
    # Timestamp of creation (queued) and, once delivered, of the successful send.
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    retried_at = Column(DateTime, nullable=True)
    attempts = Column(Integer, default=1, nullable=False)
    related_entity = Column(String(50), nullable=True)
    related_id = Column(String(50), nullable=True, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "template_code": self.template_code,
            "recipient_name": self.recipient_name,
            "recipient_email": self.recipient_email,
            "subject": self.subject,
            "body_html": self.body_html,
            "status": self.status,
            "error_message": self.error_message,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "retried_at": self.retried_at.isoformat() if self.retried_at else None,
            "attempts": self.attempts,
        }
