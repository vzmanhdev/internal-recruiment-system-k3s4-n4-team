from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    position_title = Column(String(255), nullable=False)
    offered_salary = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    probation_period_months = Column(Integer, default=2, nullable=False)
    work_location = Column(String(255), nullable=False)
    expiration_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="sent", nullable=False)  # draft, sent, accepted, declined, expired
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("JobApplication", foreign_keys=[application_id])

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "application_id": self.application_id,
            "candidate_name": self.application.full_name if self.application else None,
            "candidate_email": self.application.email if self.application else None,
            "position_title": self.position_title,
            "offered_salary": self.offered_salary,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "probation_period_months": self.probation_period_months,
            "work_location": self.work_location,
            "expiration_date": self.expiration_date.isoformat() if self.expiration_date else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    welcome_email_sent = Column(Boolean, default=False, nullable=False)
    equipment_prepared = Column(Boolean, default=False, nullable=False)
    account_created = Column(Boolean, default=False, nullable=False)
    documents_submitted = Column(Boolean, default=False, nullable=False)
    orientation_scheduled = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("JobApplication", foreign_keys=[application_id])

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "candidate_name": self.application.full_name if self.application else None,
            "job_title": self.application.job.title if self.application and self.application.job else None,
            "department_name": self.application.job.department.name if self.application and self.application.job and self.application.job.department else None,
            "welcome_email_sent": self.welcome_email_sent,
            "equipment_prepared": self.equipment_prepared,
            "account_created": self.account_created,
            "documents_submitted": self.documents_submitted,
            "orientation_scheduled": self.orientation_scheduled,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
