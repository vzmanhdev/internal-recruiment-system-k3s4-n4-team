from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    title = Column(String(255), nullable=False)
    interview_type = Column(String(50), default="online", nullable=False)  # online, offline
    location_or_link = Column(Text, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="scheduled", nullable=False)  # scheduled, completed, cancelled, rescheduled
    candidate_response = Column(String(30), default="pending", nullable=False)  # pending, confirmed, declined
    candidate_response_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("JobApplication", foreign_keys=[application_id])
    interviewers = relationship("InterviewInterviewer", back_populates="interview", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "application_id": self.application_id,
            "candidate_name": self.application.full_name if self.application else None,
            "job_title": self.application.job.title if self.application and self.application.job else None,
            "title": self.title,
            "interview_type": self.interview_type,
            "location_or_link": self.location_or_link,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "notes": self.notes,
            "status": self.status,
            "candidate_response": self.candidate_response,
            "candidate_response_at": self.candidate_response_at.isoformat() if self.candidate_response_at else None,
            "interviewers": [
                {
                    "id": item.interviewer.id,
                    "full_name": item.interviewer.full_name,
                    "email": item.interviewer.email,
                }
                for item in self.interviewers
                if item.interviewer
            ],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class InterviewInterviewer(Base):
    __tablename__ = "interview_interviewers"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interview_schedules.id"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    interview = relationship("InterviewSchedule", back_populates="interviewers")
    interviewer = relationship("User", foreign_keys=[interviewer_id])
