from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base
from sqlalchemy.orm import synonym
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class JobPosting(Base):
    applications_count = Column(Integer, default=0, nullable=True)
    salary_range = Column(String(100), default='Thỏa thuận', nullable=True)
    level = Column(String(50), default='Mid-Level', nullable=True)
    department_name = Column(String(255), nullable=True)
    slug = Column(String(255), unique=True, index=True, nullable=True)
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
    __tablename__ = 'job_postings'
    applications = relationship('JobApplication', back_populates='job', cascade='all, delete-orphan')
    description = synonym('job_description')
    experience_level = synonym('experience_years')
    type = synonym('employment_type')
    location = synonym('work_location')
    requisition = relationship('JobRequisition', foreign_keys=[requisition_id])
    department = relationship('Department', foreign_keys=[department_id])
    job_title = relationship('JobTitle', foreign_keys=[job_title_id])
    creator = relationship('User', foreign_keys=[created_by_id])

    def to_dict(self):
        return {'id': self.id, 'code': self.code, 'requisition_id': self.requisition_id, 'requisition_code': self.requisition.code if self.requisition else None, 'title': self.title, 'department_id': self.department_id, 'department_name': self.department.name if self.department else None, 'job_title_id': self.job_title_id, 'job_title_name': self.job_title.name if self.job_title else None, 'quantity': self.quantity, 'min_salary': self.min_salary, 'max_salary': self.max_salary, 'is_salary_negotiable': self.is_salary_negotiable, 'work_location': self.work_location, 'employment_type': self.employment_type, 'experience_years': self.experience_years, 'deadline': self.deadline.isoformat() if self.deadline else None, 'is_featured': self.is_featured, 'job_description': self.job_description, 'requirements': self.requirements, 'benefits': self.benefits, 'status': self.status, 'views_count': self.views_count, 'created_by_id': self.created_by_id, 'creator_name': self.creator.full_name if self.creator else None, 'created_at': self.created_at.isoformat() if self.created_at else None, 'updated_at': self.updated_at.isoformat() if self.updated_at else None, 'slug': self.slug, 'department': self.department_name, 'location': self.location, 'type': self.type, 'level': self.level, 'salary_range': self.salary_range, 'salaryRange': self.salary_range, 'experience_level': self.experience_level, 'description': self.description, 'applications_count': len(self.applications) if self.applications else self.applications_count}
