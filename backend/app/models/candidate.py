from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from app.db.session import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(100), primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    cv_url = Column(String(500), nullable=True)
    source = Column(String(100), default="Internal Referral")
    status = Column(String(50), default="Applied")
    talent_pool = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "avatarUrl": self.avatar_url,
            "cvUrl": self.cv_url,
            "source": self.source,
            "status": self.status,
            "talentPool": self.talent_pool,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(100), primary_key=True, index=True)
    job_id = Column(String(100), ForeignKey("job_postings.id"), nullable=False)
    candidate_id = Column(String(100), ForeignKey("candidates.id"), nullable=False)
    stage = Column(String(50), default="Applied")  # Applied, Screening, Interview1, Interview2, Offer, Onboarded, Rejected
    applied_at = Column(DateTime, default=datetime.utcnow)
    referrer_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "jobId": self.job_id,
            "candidateId": self.candidate_id,
            "stage": self.stage,
            "appliedAt": self.applied_at.isoformat() if self.applied_at else None,
            "referrerName": self.referrer_name,
            "notes": self.notes
        }
