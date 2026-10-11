from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class InternalReferral(Base):
    __tablename__ = "internal_referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    candidate_phone = Column(String(50), nullable=False)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    cv_url = Column(String(4000000), nullable=True)
    relationship_note = Column(Text, nullable=True)
    bonus_amount = Column(Integer, default=5000000, nullable=False)

    # Status: pending, contacted, interviewing, hired, rejected
    status = Column(String(50), default="pending", nullable=False)
    payout_status = Column(String(50), default="unpaid", nullable=False) # unpaid, processing, paid

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    referrer = relationship("User", foreign_keys=[referrer_id])
    job_posting = relationship("JobPosting")

    def to_dict(self):
        return {
            "id": self.id,
            "referrer_id": self.referrer_id,
            "referrer_name": self.referrer.full_name if self.referrer else None,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "candidate_phone": self.candidate_phone,
            "job_posting_id": self.job_posting_id,
            "job_title": self.job_posting.title if self.job_posting else None,
            "cv_url": self.cv_url,
            "relationship_note": self.relationship_note,
            "bonus_amount": self.bonus_amount,
            "status": self.status,
            "payout_status": self.payout_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CandidateEvaluation(Base):
    __tablename__ = "candidate_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    evaluator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    technical_score = Column(Integer, default=0, nullable=False) # 1-10
    culture_fit_score = Column(Integer, default=0, nullable=False) # 1-10
    communication_score = Column(Integer, default=0, nullable=False) # 1-10
    overall_score = Column(Integer, default=0, nullable=False) # 1-10
    
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    recommendation = Column(String(50), default="hire", nullable=False) # hire, hold, reject
    # S6-07 competency scorecard snapshot / S6-08 reopen
    interview_id = Column(Integer, ForeignKey("interview_schedules.id"), nullable=True)
    framework_id = Column(String(100), nullable=True)
    criteria_json = Column(Text, nullable=True)
    weighted_score = Column(Float, nullable=True)
    reopened_at = Column(DateTime, nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    evaluator = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "evaluator_id": self.evaluator_id,
            "evaluator_name": self.evaluator.full_name if self.evaluator else None,
            "technical_score": self.technical_score,
            "culture_fit_score": self.culture_fit_score,
            "communication_score": self.communication_score,
            "overall_score": self.overall_score,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "recommendation": self.recommendation,
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
