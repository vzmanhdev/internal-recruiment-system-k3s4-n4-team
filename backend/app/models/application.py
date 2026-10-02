from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    cv_url = Column(Text, nullable=False)  # Data URL or File Link
    cover_letter = Column(Text, nullable=True)
    current_department = Column(String(255), nullable=True)  # If internal applicant
    referral_code = Column(String(50), nullable=True)
    status = Column(String(50), default="applied", nullable=False)  # applied, screening, interviewing, offered, hired, rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("JobPosting", foreign_keys=[job_id])
    candidate = relationship("User", foreign_keys=[candidate_id])
    logs = relationship("ApplicationLog", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationLog.created_at.asc()")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "job_id": self.job_id,
            "job_code": self.job.code if self.job else None,
            "job_title": self.job.title if self.job else None,
            "department_name": self.job.department.name if self.job and self.job.department else None,
            "candidate_id": self.candidate_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "cv_url": self.cv_url,
            "cover_letter": self.cover_letter,
            "current_department": self.current_department,
            "referral_code": self.referral_code,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "logs": [log.to_dict() for log in self.logs] if self.logs else [],
        }

class ApplicationLog(Base):
    __tablename__ = "application_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("JobApplication", back_populates="logs")
    user = relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "Hệ thống",
            "from_status": self.from_status,
            "to_status": self.to_status,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
