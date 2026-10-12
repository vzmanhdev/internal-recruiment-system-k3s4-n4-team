from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, event
from sqlalchemy.orm import relationship, validates
from datetime import datetime, timedelta
from app.db.session import Base
from sqlalchemy.orm import synonym
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class JobApplication(Base):
    rejection_reason = Column(Text, nullable=True)
    hr_notes = Column(Text, nullable=True)
    score = Column(Integer, default=0, nullable=True)
    years_of_experience = Column(Integer, default=0, nullable=True)
    current_position = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    rating = Column(Integer, default=0, nullable=False)
    fit_score = Column(Integer, default=0, nullable=False)
    screening_result = Column(String(30), default='pending', nullable=False)
    sla_due_at = Column(DateTime, nullable=True)
    is_talent_pool = Column(Boolean, default=False, nullable=False)
    merged_into_id = Column(Integer, ForeignKey('job_applications.id'), nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, default=lambda: 'REC-' + uuid4().hex)
    job_id = Column(Integer, ForeignKey('job_postings.id'), nullable=False)
    job_posting_id = Column(Integer, ForeignKey('job_postings.id'), nullable=False)
    candidate_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    cv_url = Column(Text, nullable=False)
    cv_filename = Column(String(255), nullable=True)
    cv_content_type = Column(String(120), nullable=True)
    cv_extracted_data = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    recruiter_notes = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    current_department = Column(String(255), nullable=True)
    referral_code = Column(String(50), nullable=True)
    status = Column(String(50), default='applied', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __tablename__ = 'job_applications'
    offer = relationship('JobOffer', uselist=False, back_populates='application', cascade='all, delete-orphan')
    interviews = relationship('InterviewSchedule', back_populates='application', cascade='all, delete-orphan')
    job_posting = synonym('job')
    job = relationship('JobPosting', foreign_keys=[job_id], back_populates='applications')
    candidate = relationship('User', foreign_keys=[candidate_id])
    logs = relationship('ApplicationLog', back_populates='application', cascade='all, delete-orphan', order_by='ApplicationLog.created_at.asc()')

    @validates('job_id')
    def sync_legacy_job_id(self, _key, value):
        self.job_posting_id = value
        return value

    def to_dict(self):
        import json
        def load_json(value, fallback):
            try:
                return json.loads(value) if value else fallback
            except (TypeError, ValueError):
                return fallback
        due_at = self.sla_due_at or (self.created_at + timedelta(days=3) if self.created_at else None)
        return {'id': self.id, 'code': self.code, 'job_id': self.job_id, 'job_code': self.job.code if self.job else None, 'job_title': self.job.title if self.job else None, 'department_name': self.job.department.name if self.job and self.job.department else None, 'candidate_id': self.candidate_id, 'full_name': self.full_name, 'email': self.email, 'phone': self.phone, 'cv_url': self.cv_url, 'cv_filename': self.cv_filename, 'cv_content_type': self.cv_content_type, 'cv_extracted_data': load_json(self.cv_extracted_data, {}), 'tags': load_json(self.tags, []), 'recruiter_notes': self.recruiter_notes, 'cover_letter': self.cover_letter, 'current_department': self.current_department, 'referral_code': self.referral_code, 'status': self.status, 'created_at': self.created_at.isoformat() if self.created_at else None, 'updated_at': self.updated_at.isoformat() if self.updated_at else None, 'logs': [log.to_dict() for log in self.logs] if self.logs else [], 'job_posting_id': self.job_posting_id, 'department': self.job_posting.department_name if self.job_posting else None, 'name': self.full_name, 'current_company': self.current_company, 'current_position': self.current_position, 'years_of_experience': self.years_of_experience, 'score': self.score, 'hr_notes': self.hr_notes, 'rejection_reason': self.rejection_reason, 'rating': self.rating or 0, 'fit_score': self.fit_score or 0, 'screening_result': self.screening_result or 'pending', 'sla_due_at': due_at.isoformat() if due_at else None, 'sla_overdue': bool(due_at and due_at < datetime.utcnow() and self.status not in {'hired','rejected','withdrawn','merged'}), 'is_talent_pool': bool(self.is_talent_pool), 'merged_into_id': self.merged_into_id, 'applied_date': self.created_at.strftime('%Y-%m-%d') if self.created_at else None}


@event.listens_for(JobApplication, 'before_insert')
@event.listens_for(JobApplication, 'before_update')
def sync_application_job_compatibility(_mapper, _connection, target):
    job_id = target.job_id or target.job_posting_id
    target.job_id = job_id
    target.job_posting_id = job_id

class ApplicationLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('job_applications.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    changed_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    __tablename__ = 'application_logs'
    application = relationship('JobApplication', back_populates='logs')
    user = relationship('User', foreign_keys=[user_id])
    changed_by = relationship('User', foreign_keys=[changed_by_id])

    def to_dict(self):
        actor = self.user or self.changed_by
        note = self.note or self.comment
        return {'id': self.id, 'application_id': self.application_id, 'user_id': self.user_id or self.changed_by_id, 'user_name': actor.full_name if actor else 'Hệ thống', 'from_status': self.from_status, 'to_status': self.to_status, 'note': note, 'created_at': self.created_at.isoformat() if self.created_at else None, 'changed_by_id': self.changed_by_id or self.user_id, 'changed_by_name': actor.full_name if actor else None, 'comment': note}


@event.listens_for(ApplicationLog, 'before_insert')
@event.listens_for(ApplicationLog, 'before_update')
def sync_application_log_compatibility(_mapper, _connection, target):
    actor_id = target.user_id or target.changed_by_id
    message = target.note or target.comment
    target.user_id = actor_id
    target.changed_by_id = actor_id
    target.note = message
    target.comment = message


class SavedCandidateFilter(Base):
    __tablename__ = 'saved_candidate_filters'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    criteria = Column(Text, nullable=False, default='{}')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        import json
        try:
            criteria = json.loads(self.criteria or '{}')
        except (TypeError, ValueError):
            criteria = {}
        return {'id': self.id, 'name': self.name, 'criteria': criteria, 'created_at': self.created_at.isoformat()}
