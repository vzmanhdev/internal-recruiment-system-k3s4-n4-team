from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base
from sqlalchemy.orm import synonym
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from app.db.session import Base

class JobRequisition(Base):
    reject_reason = Column(Text, nullable=True)
    current_approval_step = Column(String(50), default='manager', nullable=True)
    target_onboard_date = Column(String(50), nullable=True)
    is_salary_negotiable = Column(Boolean, default=False, nullable=True)
    priority = Column(String(20), default='medium', nullable=True)
    reason_detail = Column(Text, nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, default=lambda: 'REC-' + uuid4().hex)
    title = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=False)
    job_title_id = Column(Integer, ForeignKey('job_titles.id'), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    reason = Column(String(100), nullable=False)
    replacement_for = Column(String(255), nullable=True)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)
    work_location = Column(String(255), default='Trụ sở chính', nullable=False)
    employment_type = Column(String(50), default='full_time', nullable=False)
    experience_years = Column(String(50), default='1-3 năm', nullable=False)
    deadline = Column(DateTime, nullable=True)
    job_description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    status = Column(String(50), default='draft', nullable=False)
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    recruiter_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    support_recruiter_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    headcount_budget_id = Column(Integer, ForeignKey('headcount_budgets.id'), nullable=True)
    reserved_monthly_salary = Column(Numeric(18, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __tablename__ = 'job_requisitions'

    @property
    def job_title_name(self):
        return self.job_title.name if self.job_title else None
    department = relationship('Department', foreign_keys=[department_id])
    job_title = relationship('JobTitle', foreign_keys=[job_title_id])
    creator = relationship('User', foreign_keys=[created_by_id])
    recruiter = relationship('User', foreign_keys=[recruiter_id])
    support_recruiter = relationship('User', foreign_keys=[support_recruiter_id])
    approval_logs = relationship('RequisitionApprovalLog', back_populates='requisition', cascade='all, delete-orphan', order_by='RequisitionApprovalLog.created_at.desc()')

    def to_dict(self):
        return {'id': self.id, 'code': self.code, 'title': self.title, 'department_id': self.department_id, 'department_name': self.department.name if self.department else None, 'job_title_id': self.job_title_id, 'job_title_name': self.job_title.name if self.job_title else None, 'quantity': self.quantity, 'reason': self.reason, 'replacement_for': self.replacement_for, 'min_salary': self.min_salary, 'max_salary': self.max_salary, 'work_location': self.work_location, 'employment_type': self.employment_type, 'experience_years': self.experience_years, 'deadline': self.deadline.isoformat() if self.deadline else None, 'job_description': self.job_description, 'requirements': self.requirements, 'benefits': self.benefits, 'status': self.status, 'created_by_id': self.created_by_id, 'recruiter_id': self.recruiter_id, 'recruiter_name': self.recruiter.full_name if self.recruiter else None, 'support_recruiter_id': self.support_recruiter_id, 'support_recruiter_name': self.support_recruiter.full_name if self.support_recruiter else None, 'headcount_budget_id': self.headcount_budget_id, 'reserved_monthly_salary': float(self.reserved_monthly_salary) if self.reserved_monthly_salary is not None else None, 'creator_name': self.creator.full_name if self.creator else None, 'created_at': self.created_at.isoformat() if self.created_at else None, 'updated_at': self.updated_at.isoformat() if self.updated_at else None, 'approval_logs': [log.to_dict() for log in self.approval_logs] if self.approval_logs else [], 'reason_detail': self.reason_detail, 'priority': self.priority, 'is_salary_negotiable': self.is_salary_negotiable, 'target_onboard_date': self.target_onboard_date, 'current_approval_step': self.current_approval_step, 'reject_reason': self.reject_reason}

class RequisitionApprovalLog(Base):
    step_name = Column(String(100), nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey('job_requisitions.id'), nullable=False)
    approver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    action = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    __tablename__ = 'requisition_approval_logs'
    requisition = relationship('JobRequisition', back_populates='approval_logs')
    approver = relationship('User', foreign_keys=[approver_id])

    def to_dict(self):
        return {'id': self.id, 'requisition_id': self.requisition_id, 'approver_id': self.approver_id, 'approver_name': self.approver.full_name if self.approver else None, 'approver_role': self.approver.role if self.approver else None, 'action': self.action, 'comment': self.comment, 'created_at': self.created_at.isoformat() if self.created_at else None, 'step_name': self.step_name}
