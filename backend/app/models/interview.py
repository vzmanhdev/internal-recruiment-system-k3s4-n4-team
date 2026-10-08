from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    round_number = Column(Integer, default=1, nullable=False) # Round 1: HR, Round 2: Technical/Manager
    round_name = Column(String(100), default="Vòng 1: HR Screening", nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=45, nullable=False)
    location = Column(String(255), default="Phòng Họp 302 / Google Meet", nullable=False)
    meeting_link = Column(String(1000), nullable=True)
    
    # Status: scheduled, completed, cancelled, rescheduled
    status = Column(String(50), default="scheduled", nullable=False)
    feedback_notes = Column(Text, nullable=True)
    score = Column(Integer, nullable=True) # 1-10 rating
    passed = Column(Boolean, nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("JobApplication", back_populates="interviews")
    creator = relationship("User", foreign_keys=[created_by_id])
    interviewers = relationship("InterviewInterviewer", back_populates="interview", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "candidate_name": self.application.full_name if self.application else None,
            "candidate_email": self.application.email if self.application else None,
            "job_title": self.application.job_posting.title if self.application and self.application.job_posting else None,
            "round_number": self.round_number,
            "round_name": self.round_name,
            "scheduled_time": self.scheduled_time.isoformat() if self.scheduled_time else None,
            "duration_minutes": self.duration_minutes,
            "location": self.location,
            "meeting_link": self.meeting_link,
            "status": self.status,
            "feedback_notes": self.feedback_notes,
            "score": self.score,
            "passed": self.passed,
            "interviewers": [i.to_dict() for i in self.interviewers] if self.interviewers else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class InterviewInterviewer(Base):
    __tablename__ = "interview_interviewers"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interview_schedules.id"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_in_interview = Column(String(100), default="Người phỏng vấn chính", nullable=False)

    interview = relationship("InterviewSchedule", back_populates="interviewers")
    interviewer = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "interviewer_id": self.interviewer_id,
            "interviewer_name": self.interviewer.full_name if self.interviewer else None,
            "interviewer_email": self.interviewer.email if self.interviewer else None,
            "role_in_interview": self.role_in_interview,
        }
