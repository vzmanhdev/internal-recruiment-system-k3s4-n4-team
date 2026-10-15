from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base
from sqlalchemy.orm import synonym
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class InterviewSchedule(Base):
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    passed = Column(Boolean, nullable=True)
    score = Column(Integer, nullable=True)
    meeting_link = Column(String(1000), nullable=True)
    duration_minutes = Column(Integer, default=45, nullable=True)
    round_name = Column(String(100), default='Vòng 1: HR Screening', nullable=True)
    round_number = Column(Integer, default=1, nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, default=lambda: 'REC-' + uuid4().hex)
    application_id = Column(Integer, ForeignKey('job_applications.id'), nullable=False)
    title = Column(String(255), nullable=True)
    interview_type = Column(String(50), default='online', nullable=False)
    location_or_link = Column(Text, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default='scheduled', nullable=False)
    candidate_response = Column(String(30), default='pending', nullable=False)
    candidate_response_at = Column(DateTime, nullable=True)
    candidate_response_note = Column(Text, nullable=True)
    competency_category = Column(String(80), nullable=True)
    is_final_round = Column(Boolean, default=False, nullable=False)
    candidate_proposed_start_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __tablename__ = 'interview_schedules'
    creator = relationship('User', foreign_keys=[created_by_id])
    feedback_notes = synonym('notes')
    location = synonym('location_or_link')
    scheduled_time = synonym('start_time')
    application = relationship('JobApplication', foreign_keys=[application_id])
    interviewers = relationship('InterviewInterviewer', back_populates='interview', cascade='all, delete-orphan')

    def to_dict(self):
        return {'id': self.id, 'code': self.code, 'application_id': self.application_id, 'candidate_name': self.application.full_name if self.application else None, 'job_title': self.application.job.title if self.application and self.application.job else None, 'title': self.title, 'interview_type': self.interview_type, 'location_or_link': self.location_or_link, 'start_time': self.start_time.isoformat() if self.start_time else None, 'end_time': self.end_time.isoformat() if self.end_time else None, 'notes': self.notes, 'status': self.status, 'candidate_response': self.candidate_response, 'candidate_response_at': self.candidate_response_at.isoformat() if self.candidate_response_at else None, 'candidate_response_note': self.candidate_response_note, 'candidate_proposed_start_time': self.candidate_proposed_start_time.isoformat() if self.candidate_proposed_start_time else None, 'interviewers': [{'id': item.interviewer.id, 'full_name': item.interviewer.full_name, 'email': item.interviewer.email} for item in self.interviewers if item.interviewer], 'created_at': self.created_at.isoformat() if self.created_at else None, 'updated_at': self.updated_at.isoformat() if self.updated_at else None, 'candidate_email': self.application.email if self.application else None, 'round_number': self.round_number, 'round_name': self.round_name, 'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None, 'duration_minutes': self.duration_minutes, 'location': self.location, 'meeting_link': self.meeting_link, 'feedback_notes': self.feedback_notes, 'score': self.score, 'passed': self.passed}

class InterviewInterviewer(Base):
    asked_questions = Column(Text, nullable=True)
    role_in_interview = Column(String(100), default='Người phỏng vấn chính', nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey('interview_schedules.id'), nullable=False)
    interviewer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    __tablename__ = 'interview_interviewers'
    interview = relationship('InterviewSchedule', back_populates='interviewers')
    interviewer = relationship('User', foreign_keys=[interviewer_id])
