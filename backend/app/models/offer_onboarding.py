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

    # Status: draft, sent, accepted, declined, expired
    status = Column(String(50), default="sent", nullable=False)
    decline_reason = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("JobApplication", back_populates="offer")
    creator = relationship("User", foreign_keys=[created_by_id])
    onboarding_items = relationship("OnboardingChecklist", back_populates="offer", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "candidate_name": self.application.full_name if self.application else None,
            "candidate_email": self.application.email if self.application else None,
            "job_title": self.application.job_posting.title if self.application and self.application.job_posting else None,
            "offered_salary": self.offered_salary,
            "currency": self.currency,
            "probation_salary_percentage": self.probation_salary_percentage,
            "start_date": self.start_date,
            "probation_duration_months": self.probation_duration_months,
            "work_location": self.work_location,
            "notes": self.notes,
            "status": self.status,
            "decline_reason": self.decline_reason,
            "onboarding": [item.to_dict() for item in self.onboarding_items] if self.onboarding_items else [],
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

    offer = relationship("JobOffer", back_populates="onboarding_items")

    def to_dict(self):
        return {
            "id": self.id,
            "offer_id": self.offer_id,
            "task_name": self.task_name,
            "assigned_role": self.assigned_role,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
