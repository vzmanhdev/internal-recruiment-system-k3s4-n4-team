from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=True) # if internal employee user
    
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    current_company = Column(String(255), nullable=True)
    current_position = Column(String(255), nullable=True)
    years_of_experience = Column(Integer, default=0, nullable=False)
    cv_url = Column(String(4000000), nullable=True)
    cover_letter = Column(Text, nullable=True)
    referral_code = Column(String(50), nullable=True)

    # Workflow Status: submitted, screening, interviewing, offered, hired, rejected
    status = Column(String(50), default="submitted", nullable=False)
    score = Column(Integer, default=0, nullable=False) # 0-100 rating
    hr_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    job_posting = relationship("JobPosting", back_populates="applications")
    candidate = relationship("User", foreign_keys=[candidate_id])
    logs = relationship("ApplicationLog", back_populates="application", cascade="all, delete-orphan")
    interviews = relationship("InterviewSchedule", back_populates="application", cascade="all, delete-orphan")
    offer = relationship("JobOffer", uselist=False, back_populates="application", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "job_posting_id": self.job_posting_id,
            "job_title": self.job_posting.title if self.job_posting else None,
            "department": self.job_posting.department_name if self.job_posting else None,
            "candidate_id": self.candidate_id,
            "full_name": self.full_name,
            "name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "current_company": self.current_company,
            "current_position": self.current_position,
            "years_of_experience": self.years_of_experience,
            "cv_url": self.cv_url,
            "cover_letter": self.cover_letter,
            "referral_code": self.referral_code,
            "status": self.status,
            "score": self.score,
            "hr_notes": self.hr_notes,
            "rejection_reason": self.rejection_reason,
            "applied_date": self.created_at.strftime("%Y-%m-%d") if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ApplicationLog(Base):
    __tablename__ = "application_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("JobApplication", back_populates="logs")
    changed_by = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "changed_by_id": self.changed_by_id,
            "changed_by_name": self.changed_by.full_name if self.changed_by else None,
            "from_status": self.from_status,
            "to_status": self.to_status,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
