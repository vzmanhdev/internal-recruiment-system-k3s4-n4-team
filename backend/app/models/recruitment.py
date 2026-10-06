import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from app.db.session import Base

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    salary_range = Column(String(100), default="Thỏa thuận", nullable=False)
    openings = Column(Integer, default=1, nullable=False)
    experience_level = Column(String(50), default="Chuyên viên / Mid-level", nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(30), default="pending_approval", nullable=False) # draft, pending_approval, approved, rejected
    approval_chain = Column(Text, nullable=True) # JSON serialized steps
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    benefits = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=True)
    is_converted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        chain = []
        if self.approval_chain:
            try:
                chain = json.loads(self.approval_chain)
            except Exception:
                chain = []
        return {
            "id": self.id,
            "title": self.title,
            "department": self.department,
            "salary_range": self.salary_range,
            "openings": self.openings,
            "experience_level": self.experience_level,
            "reason": self.reason or "",
            "status": self.status,
            "approval_chain": chain,
            "description": self.description,
            "requirements": self.requirements.split("\n") if self.requirements else [],
            "benefits": self.benefits.split("\n") if self.benefits else [],
            "created_by": self.created_by,
            "is_converted": self.is_converted,
            "created_at": self.created_at.strftime("%d/%m/%Y") if self.created_at else None,
        }

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    location = Column(String(100), default="Hà Nội", nullable=False)
    employment_type = Column(String(50), default="Toàn thời gian", nullable=False)
    openings = Column(Integer, default=1, nullable=False)
    salary_range = Column(String(100), default="Thỏa thuận", nullable=False)
    experience_level = Column(String(50), default="Chuyên viên / Mid-level", nullable=False)
    deadline = Column(String(50), nullable=False)
    status = Column(String(30), default="open", nullable=False) # open, closingSoon, closed
    approval_status = Column(String(30), default="approved", nullable=False) # pending, approved, rejected
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    benefits = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(255), nullable=True)
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "department": self.department,
            "location": self.location,
            "employment_type": self.employment_type,
            "openings": self.openings,
            "salary_range": self.salary_range,
            "experience_level": self.experience_level,
            "deadline": self.deadline,
            "status": self.status,
            "approval_status": getattr(self, "approval_status", "approved") or "approved",
            "description": self.description,
            "requirements": self.requirements.split("\n") if self.requirements else [],
            "benefits": self.benefits.split("\n") if self.benefits else [],
            "created_at": self.created_at.strftime("%d/%m/%Y") if self.created_at else None,
            "created_by": self.created_by,
            "requisition_id": self.requisition_id,
        }

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False, index=True)
    candidate_name = Column(String(255), nullable=False, index=True)
    candidate_email = Column(String(255), nullable=False)
    candidate_phone = Column(String(50), nullable=False)
    current_department = Column(String(100), nullable=True) # If internal employee
    is_internal = Column(Boolean, default=True, nullable=False)
    referral_by = Column(String(255), nullable=True) # Employee name who referred
    resume_filename = Column(String(255), default="CV_UngVien.pdf", nullable=False)
    stage = Column(String(50), default="new", nullable=False) # new, screening, interview, offer, hired, rejected
    rating = Column(Integer, default=4, nullable=False) # 1 - 5 stars
    hr_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "candidate_phone": self.candidate_phone,
            "current_department": self.current_department,
            "is_internal": self.is_internal,
            "referral_by": self.referral_by,
            "resume_filename": self.resume_filename,
            "stage": self.stage,
            "rating": self.rating,
            "hr_notes": self.hr_notes or "",
            "created_at": self.created_at.strftime("%d/%m/%Y") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%d/%m/%Y") if self.updated_at else None,
        }

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    interview_date = Column(String(50), nullable=False) # e.g. "05/10/2026"
    interview_time = Column(String(50), nullable=False) # e.g. "09:30 - 10:30"
    format = Column(String(50), default="Online", nullable=False) # Online, Trực tiếp
    location_or_link = Column(String(500), nullable=False) # MS Teams link or Room 302
    interviewer_names = Column(String(500), nullable=False) # e.g. "Nguyễn Văn A (HR), Trần Văn B (Tech Lead)"
    round_name = Column(String(100), default="Vòng 1 - Chuyên môn", nullable=False)
    status = Column(String(50), default="scheduled", nullable=False) # scheduled, completed, cancelled
    feedback = Column(Text, nullable=True)
    result = Column(String(50), default="pending", nullable=False) # pending, passed, failed

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "candidate_name": self.candidate_name,
            "job_title": self.job_title,
            "interview_date": self.interview_date,
            "interview_time": self.interview_time,
            "format": self.format,
            "location_or_link": self.location_or_link,
            "interviewer_names": self.interviewer_names,
            "round_name": self.round_name,
            "status": self.status,
            "feedback": self.feedback or "",
            "result": self.result,
        }

class ReferralRecord(Base):
    __tablename__ = "referral_records"

    id = Column(Integer, primary_key=True, index=True)
    referrer_name = Column(String(255), nullable=False)
    referrer_email = Column(String(255), nullable=False)
    referrer_department = Column(String(100), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    candidate_phone = Column(String(50), nullable=False)
    job_title = Column(String(255), nullable=False)
    relationship = Column(String(100), default="Đồng nghiệp cũ", nullable=False)
    status = Column(String(50), default="processing", nullable=False) # processing, interviewed, hired, rejected
    bonus_amount = Column(String(50), default="10.000.000 VNĐ", nullable=False)
    bonus_status = Column(String(50), default="pending", nullable=False) # pending, eligible, paid
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "referrer_name": self.referrer_name,
            "referrer_email": self.referrer_email,
            "referrer_department": self.referrer_department,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "candidate_phone": self.candidate_phone,
            "job_title": self.job_title,
            "relationship": self.relationship,
            "status": self.status,
            "bonus_amount": self.bonus_amount,
            "bonus_status": self.bonus_status,
            "notes": self.notes or "",
            "created_at": self.created_at.strftime("%d/%m/%Y") if self.created_at else None,
        }
