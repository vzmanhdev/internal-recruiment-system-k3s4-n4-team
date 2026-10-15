import json
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, synonym
from app.db.session import Base

class JobOffer(Base):
    salary_exception_reason = Column(Text, nullable=True)
    response_notes = Column(Text, nullable=True)
    approval_history = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    decline_reason = Column(Text, nullable=True)
    probation_salary_percentage = Column(Integer, default=85, nullable=True)
    currency = Column(String(10), default='VND', nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, default=lambda: 'REC-' + uuid4().hex)
    application_id = Column(Integer, ForeignKey('job_applications.id'), nullable=False)
    position_title = Column(String(255), nullable=True)
    offered_salary = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    probation_period_months = Column(Integer, default=2, nullable=False)
    work_location = Column(String(255), nullable=False)
    expiration_date = Column(DateTime, nullable=True)
    status = Column(String(50), default='sent', nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __tablename__ = 'job_offers'
    onboarding_items = relationship('OnboardingChecklist', back_populates='offer', cascade='all, delete-orphan')
    creator = relationship('User', foreign_keys=[created_by_id])
    probation_duration_months = synonym('probation_period_months')
    application = relationship('JobApplication', foreign_keys=[application_id])

    def to_dict(self):
        job = self.application.job if self.application else None
        return dict(
            id=self.id, code=self.code, application_id=self.application_id,
            candidate_name=self.application.full_name if self.application else None,
            candidate_email=self.application.email if self.application else None,
            position_title=self.position_title or (job.title if job else 'Nhân viên'), offered_salary=self.offered_salary,
            start_date=self.start_date.isoformat() + 'Z' if self.start_date else None,
            probation_period_months=self.probation_period_months, work_location=self.work_location,
            expiration_date=self.expiration_date.isoformat() + 'Z' if self.expiration_date else None,
            status=self.status, notes=self.notes, response_notes=self.response_notes,
            salary_exception_reason=self.salary_exception_reason,
            min_salary=job.min_salary if job else None, max_salary=job.max_salary if job else None,
            approvals=json.loads(self.approval_history or '[]'),
            created_at=self.created_at.isoformat(), updated_at=self.updated_at.isoformat(),
            job_title=job.title if job else None, currency=self.currency,
            probation_salary_percentage=self.probation_salary_percentage,
            probation_duration_months=self.probation_duration_months, decline_reason=self.decline_reason,
            onboarding=[item.to_dict() for item in self.onboarding_items],
        )

class OnboardingChecklist(Base):
    completed_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=True)
    assigned_role = Column(String(50), default='HR', nullable=True)
    task_name = Column(String(255), nullable=True)
    offer_id = Column(Integer, ForeignKey('job_offers.id'), nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('job_applications.id'), nullable=True)
    welcome_email_sent = Column(Boolean, default=False, nullable=False)
    equipment_prepared = Column(Boolean, default=False, nullable=False)
    account_created = Column(Boolean, default=False, nullable=False)
    documents_submitted = Column(Boolean, default=False, nullable=False)
    orientation_scheduled = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default='pending', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __tablename__ = 'onboarding_checklists'
    offer = relationship('JobOffer', back_populates='onboarding_items')
    application = relationship('JobApplication', foreign_keys=[application_id])

    def to_dict(self):
        return {'id': self.id, 'application_id': self.application_id, 'candidate_name': self.application.full_name if self.application else None, 'job_title': self.application.job.title if self.application and self.application.job else None, 'department_name': self.application.job.department.name if self.application and self.application.job and self.application.job.department else None, 'welcome_email_sent': self.welcome_email_sent, 'equipment_prepared': self.equipment_prepared, 'account_created': self.account_created, 'documents_submitted': self.documents_submitted, 'orientation_scheduled': self.orientation_scheduled, 'status': self.status, 'created_at': self.created_at.isoformat() if self.created_at else None, 'updated_at': self.updated_at.isoformat() if self.updated_at else None, 'offer_id': self.offer_id, 'task_name': self.task_name, 'assigned_role': self.assigned_role, 'is_completed': self.is_completed, 'completed_at': self.completed_at.isoformat() if self.completed_at else None}
