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

    # Portal & pipeline extensions (S4-03, S4-05, S4-06, S5-01, S5-04, S5-09, S5-10)
    tracking_code = Column(String(20), nullable=True, index=True)
    source = Column(String(100), nullable=True)
    client_ip = Column(String(64), nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    tags_json = Column(Text, nullable=True)
    person_key = Column(String(255), nullable=True, index=True)  # normalized identity used for duplicate merge
    merged_from_key = Column(String(255), nullable=True)
    merged_at = Column(DateTime, nullable=True)
    match_score = Column(Integer, nullable=True)
    meets_requirements = Column(Boolean, nullable=True)
    parsed_cv_json = Column(Text, nullable=True)
    withdraw_token_hash = Column(String(128), nullable=True)
    is_overdue = Column(Boolean, default=False, nullable=False)
    stage_entered_at = Column(DateTime, nullable=True)
    
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
            "tracking_code": self.tracking_code,
            "source": self.source,
            "rating": self.rating,
            "tags": self.tags(),
            "person_key": self.person_key,
            "match_score": self.match_score,
            "meets_requirements": self.meets_requirements,
            "parsed_cv": self.parsed_cv(),
            "is_overdue": bool(self.is_overdue),
            "stage_entered_at": self.stage_entered_at.isoformat() if self.stage_entered_at else None,
        }

    def tags(self):
        import json
        try:
            return json.loads(self.tags_json) if self.tags_json else []
        except ValueError:
            return []

    def parsed_cv(self):
        import json
        try:
            return json.loads(self.parsed_cv_json) if self.parsed_cv_json else None
        except ValueError:
            return None

    PUBLIC_STATUS = {
        "submitted": "Đã nhận", "screening": "Đang xem xét", "interviewing": "Mời phỏng vấn",
        "offered": "Đang xem xét", "hired": "Kết thúc", "onboarded": "Kết thúc", "rejected": "Kết thúc", "withdrawn": "Kết thúc",
    }

    def candidate_view(self):
        """What the applicant may see about their own application (S5-04: internal notes never shown; S4-05 general status)."""
        return {
            "id": self.id,
            "job_posting_id": self.job_posting_id,
            "job_title": self.job_posting.title if self.job_posting else None,
            "department": self.job_posting.department_name if self.job_posting else None,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "cv_url": self.cv_url,
            "status": self.status,
            "public_status": self.PUBLIC_STATUS.get(self.status, "Đang xem xét"),
            "tracking_code": self.tracking_code,
            "applied_date": self.created_at.strftime("%Y-%m-%d") if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
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
