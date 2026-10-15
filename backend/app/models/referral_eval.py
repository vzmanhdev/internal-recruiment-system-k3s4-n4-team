from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class InternalReferral(Base):
    __tablename__ = "internal_referrals"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False, index=True)
    candidate_phone = Column(String(50), nullable=False)
    cv_url = Column(Text, nullable=False)
    relationship_note = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, contacted, interviewed, hired, bonus_paid, rejected
    bonus_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    referrer = relationship("User", foreign_keys=[referrer_id])
    job = relationship("JobPosting", foreign_keys=[job_id])

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "referrer_id": self.referrer_id,
            "referrer_name": self.referrer.full_name if self.referrer else None,
            "job_id": self.job_id,
            "job_title": self.job.title if self.job else None,
            "department_name": self.job.department.name if self.job and self.job.department else None,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "candidate_phone": self.candidate_phone,
            "cv_url": self.cv_url,
            "relationship_note": self.relationship_note,
            "status": self.status,
            "bonus_amount": self.bonus_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class CandidateEvaluation(Base):
    __tablename__ = "candidate_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    evaluator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score = Column(Float, nullable=False)  # 1.0 to 5.0
    competency_score = Column(Float, nullable=False)  # 1.0 to 5.0
    culture_fit_score = Column(Float, nullable=False)  # 1.0 to 5.0
    recommendation = Column(String(50), nullable=False)  # strong_hire, hire, hold, reject
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("JobApplication", foreign_keys=[application_id])
    evaluator = relationship("User", foreign_keys=[evaluator_id])

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "evaluator_id": self.evaluator_id,
            "evaluator_name": self.evaluator.full_name if self.evaluator else None,
            "overall_score": self.overall_score,
            "competency_score": self.competency_score,
            "culture_fit_score": self.culture_fit_score,
            "recommendation": self.recommendation,
            "feedback": self.feedback,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
