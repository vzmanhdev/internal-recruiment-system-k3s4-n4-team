from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, event, inspect as sa_inspect
from sqlalchemy.orm import relationship

from app.db.session import Base

class JobPosting(Base):
    __tablename__ = 'job_postings'

    applications_count = Column(Integer, default=0, nullable=True)
    salary_range = Column(String(100), default='Thỏa thuận', nullable=True)
    level = Column(String(50), default='Mid-Level', nullable=True)
    department_name = Column(String(255), default='Phòng ban', nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False, default=lambda: 'viec-lam-' + uuid4().hex)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, default=lambda: 'REC-' + uuid4().hex)
    requisition_id = Column(Integer, ForeignKey('job_requisitions.id'), nullable=True)
    title = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=False)
    job_title_id = Column(Integer, ForeignKey('job_titles.id'), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)
    is_salary_negotiable = Column(Boolean, default=False, nullable=False)
    work_location = Column(String(255), default='Trụ sở chính', nullable=False)
    employment_type = Column(String(50), default='full_time', nullable=False)
    experience_years = Column(String(50), default='1-3 năm', nullable=False)
    deadline = Column(DateTime, nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    job_description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    status = Column(String(50), default='published', nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    # Physical legacy columns keep older databases writable. Current endpoints
    # use the normalized fields above and fall back to these values when needed.
    description = Column(Text, default='', nullable=False)
    experience_level = Column(String(50), default='1-3 năm', nullable=False)
    type = Column(String(50), default='full_time', nullable=False)
    location = Column(String(255), default='Trụ sở chính', nullable=False)

    applications = relationship('JobApplication', foreign_keys='JobApplication.job_id', back_populates='job', cascade='all, delete-orphan')
    requisition = relationship('JobRequisition', foreign_keys=[requisition_id])
    department = relationship('Department', foreign_keys=[department_id])
    job_title = relationship('JobTitle', foreign_keys=[job_title_id])
    creator = relationship('User', foreign_keys=[created_by_id])

    def to_dict(self):
        description = self.job_description or self.description
        location = self.work_location or self.location
        employment_type = self.employment_type or self.type
        experience = self.experience_years or self.experience_level
        return {'id': self.id, 'code': self.code, 'requisition_id': self.requisition_id, 'requisition_code': self.requisition.code if self.requisition else None, 'title': self.title, 'department_id': self.department_id, 'department_name': self.department.name if self.department else self.department_name, 'job_title_id': self.job_title_id, 'job_title_name': self.job_title.name if self.job_title else None, 'quantity': self.quantity, 'min_salary': self.min_salary, 'max_salary': self.max_salary, 'is_salary_negotiable': self.is_salary_negotiable, 'work_location': location, 'employment_type': employment_type, 'experience_years': experience, 'deadline': self.deadline.isoformat() if self.deadline else None, 'is_featured': self.is_featured, 'job_description': description, 'requirements': self.requirements, 'benefits': self.benefits, 'status': self.status, 'views_count': self.views_count, 'created_by_id': self.created_by_id, 'creator_name': self.creator.full_name if self.creator else None, 'created_at': self.created_at.isoformat() if self.created_at else None, 'updated_at': self.updated_at.isoformat() if self.updated_at else None, 'slug': self.slug, 'department': self.department.name if self.department else self.department_name, 'location': location, 'type': employment_type, 'level': self.level, 'salary_range': self.salary_range, 'salaryRange': self.salary_range, 'experience_level': experience, 'description': description, 'applications_count': len(self.applications) if self.applications else self.applications_count}


@event.listens_for(JobPosting, 'before_insert')
@event.listens_for(JobPosting, 'before_update')
def sync_job_posting_compatibility(_mapper, _connection, target):
    state = sa_inspect(target)
    for current_name, legacy_name in (
        ('work_location', 'location'),
        ('employment_type', 'type'),
        ('experience_years', 'experience_level'),
        ('job_description', 'description'),
    ):
        current_value = getattr(target, current_name)
        legacy_value = getattr(target, legacy_name)
        if state.attrs[current_name].history.has_changes() and current_value is not None:
            value = current_value
        elif state.attrs[legacy_name].history.has_changes() and legacy_value is not None:
            value = legacy_value
        else:
            value = current_value if current_value is not None else legacy_value
        setattr(target, current_name, value)
        setattr(target, legacy_name, value)
