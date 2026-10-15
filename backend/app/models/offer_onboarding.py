from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), unique=True, nullable=False)
    offered_salary = Column(Integer, nullable=False)
    currency = Column(String(10), default="VND", nullable=False)
    probation_salary_percentage = Column(Integer, default=85, nullable=False)
    start_date = Column(String(50), nullable=False)
    probation_duration_months = Column(Integer, default=2, nullable=False)
    work_location = Column(String(255), default="Hà Nội", nullable=False)
    notes = Column(Text, nullable=True)

    # Status: draft, pending_approval, approved, rejected, sent, accepted, declined, expired
    status = Column(String(50), default="draft", nullable=False)
    decline_reason = Column(Text, nullable=True)

    # Approval by salary band (S7-04 / S7-05)
    allowance = Column(Integer, default=0, nullable=False)
    response_token_hash = Column(String(128), nullable=True)
    salary_justification = Column(Text, nullable=True)
    requires_escalation = Column(Boolean, default=False, nullable=False)
    approval_level = Column(String(30), nullable=True)  # hr_manager -> approver (when over band)
    response_deadline = Column(String(50), nullable=True)
    revision = Column(Integer, default=1, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("JobApplication", back_populates="offer")
    creator = relationship("User", foreign_keys=[created_by_id])
    onboarding_items = relationship("OnboardingChecklist", back_populates="offer", cascade="all, delete-orphan")
    approval_logs = relationship("OfferApprovalLog", back_populates="offer", order_by="OfferApprovalLog.id")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "candidate_name": self.application.full_name if self.application else None,
            "candidate_email": self.application.email if self.application else None,
            "job_title": self.application.job_posting.title if self.application and self.application.job_posting else None,
            "offered_salary": self.offered_salary,
            "allowance": self.allowance,
            "currency": self.currency,
            "probation_salary_percentage": self.probation_salary_percentage,
            "start_date": self.start_date,
            "probation_duration_months": self.probation_duration_months,
            "work_location": self.work_location,
            "notes": self.notes,
            "status": self.status,
            "decline_reason": self.decline_reason,
            "salary_justification": self.salary_justification,
            "requires_escalation": bool(self.requires_escalation),
            "approval_level": self.approval_level,
            "response_deadline": self.response_deadline,
            "revision": self.revision,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "responded_at": self.responded_at.isoformat() if self.responded_at else None,
            "onboarding": [item.to_dict() for item in self.onboarding_items] if self.onboarding_items else [],
            "onboarding_progress": self.onboarding_progress(),
            "approval_logs": [log.to_dict() for log in self.approval_logs] if self.approval_logs else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


    def onboarding_progress(self) -> int:
        items = self.onboarding_items or []
        if not items:
            return 0
        return round(100 * sum(1 for i in items if i.is_completed) / len(items))


class OfferApprovalLog(Base):
    """Append-only offer decision history (S7-05: approval history cannot be edited or deleted)."""
    __tablename__ = "offer_approval_logs"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("job_offers.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # submitted, approved, rejected, changes_requested, sent, accepted, declined, revised, expired
    level = Column(String(30), nullable=True)
    comment = Column(Text, nullable=True)
    snapshot_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    offer = relationship("JobOffer", back_populates="approval_logs")
    actor = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "offer_id": self.offer_id,
            "actor_id": self.actor_id,
            "actor_name": self.actor.full_name if self.actor else None,
            "action": self.action,
            "level": self.level,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("job_offers.id"), nullable=False)
    task_name = Column(String(255), nullable=False)
    assigned_role = Column(String(50), default="HR", nullable=False) # HR, IT, Admin, Manager
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(String(50), nullable=True)

    offer = relationship("JobOffer", back_populates="onboarding_items")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "offer_id": self.offer_id,
            "task_name": self.task_name,
            "assigned_role": self.assigned_role,
            "responsible_user_id": self.responsible_user_id,
            "responsible_user_name": self.responsible_user.full_name if self.responsible_user else None,
            "due_date": self.due_date,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
