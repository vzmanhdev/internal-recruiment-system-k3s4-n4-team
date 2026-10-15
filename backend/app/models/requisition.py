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

    @property
    def salary_range(self):
        if self.min_salary and self.max_salary:
            return f"{int(self.min_salary):,} - {int(self.max_salary):,} VNĐ"
        elif self.min_salary:
            return f"Từ {int(self.min_salary):,} VNĐ"
        return "Thỏa thuận"

    @property
    def openings(self):
        return self.quantity or 1

    @property
    def experience_level(self):
        return self.experience_years or "1-3 năm"

    @property
    def description(self):
        return self.job_description or ""

    @property
    def is_converted(self):
        return getattr(self, "_is_converted_val", False)

    @is_converted.setter
    def is_converted(self, val):
        self._is_converted_val = bool(val)
    department = relationship('Department', foreign_keys=[department_id])
    job_title = relationship('JobTitle', foreign_keys=[job_title_id])
    creator = relationship('User', foreign_keys=[created_by_id])
    recruiter = relationship('User', foreign_keys=[recruiter_id])
    support_recruiter = relationship('User', foreign_keys=[support_recruiter_id])
    approval_logs = relationship('RequisitionApprovalLog', back_populates='requisition', cascade='all, delete-orphan', order_by='RequisitionApprovalLog.created_at.desc()')

    def to_dict(self):
        now = datetime.utcnow()
        days_open = (now - self.created_at).days if self.created_at else 0
        if self.deadline:
            delta_days = (self.deadline.date() - now.date()).days
            days_remaining = delta_days
            is_overdue = delta_days < 0 and self.status not in ["closed", "rejected"]
        else:
            days_remaining = None
            is_overdue = False

        if self.min_salary and self.max_salary:
            salary_range = f"{int(self.min_salary):,} - {int(self.max_salary):,} VNĐ"
        elif self.min_salary:
            salary_range = f"Từ {int(self.min_salary):,} VNĐ"
        elif self.is_salary_negotiable:
            salary_range = "Thỏa thuận"
        else:
            salary_range = "Thỏa thuận"

        dept_name = self.department.name if self.department else None

        return {
            'id': self.id,
            'code': self.code,
            'title': self.title,
            'department_id': self.department_id,
            'department_name': dept_name,
            'department': dept_name or "Phòng ban",
            'job_title_id': self.job_title_id,
            'job_title_name': self.job_title.name if self.job_title else None,
            'quantity': self.quantity,
            'openings': self.quantity,
            'reason': self.reason,
            'replacement_for': self.replacement_for,
            'min_salary': self.min_salary,
            'max_salary': self.max_salary,
            'salary_range': salary_range,
            'work_location': self.work_location,
            'location': self.work_location,
            'employment_type': self.employment_type,
            'experience_years': self.experience_years,
            'experience_level': self.experience_years,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'job_description': self.job_description,
            'description': self.job_description or "",
            'requirements': self.requirements.split('\n') if self.requirements else [],
            'benefits': self.benefits.split('\n') if self.benefits else [],
            'status': self.status,
            'created_by_id': self.created_by_id,
            'created_by': self.creator.full_name if self.creator else None,
            'creator_name': self.creator.full_name if self.creator else None,
            'recruiter_id': self.recruiter_id,
            'recruiter_name': self.recruiter.full_name if self.recruiter else None,
            'support_recruiter_id': self.support_recruiter_id,
            'support_recruiter_name': self.support_recruiter.full_name if self.support_recruiter else None,
            'headcount_budget_id': self.headcount_budget_id,
            'reserved_monthly_salary': float(self.reserved_monthly_salary) if self.reserved_monthly_salary is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'approval_logs': [log.to_dict() for log in self.approval_logs] if self.approval_logs else [],
            'approval_chain': [
                {
                    "step": idx,
                    "role": log.approver_role or "Người duyệt",
                    "approver": log.approver_name or "Người duyệt",
                    "status": "approved" if log.action in ["approve", "approve_dept", "approve_hr"] else "pending",
                    "comment": log.comment,
                    "created_at": log.created_at.isoformat() if log.created_at else None,
                }
                for idx, log in enumerate(self.approval_logs, 1)
            ] if self.approval_logs else [
                {"step": 1, "role": "Trưởng bộ phận", "approver": "Trưởng bộ phận", "status": "approved"},
                {"step": 2, "role": "Trưởng phòng Nhân sự", "approver": "Trưởng phòng Nhân sự", "status": "approved" if self.status == "approved" else "pending"}
            ],
            'reason_detail': self.reason_detail,
            'priority': self.priority,
            'is_salary_negotiable': self.is_salary_negotiable,
            'target_onboard_date': self.target_onboard_date,
            'current_approval_step': self.current_approval_step,
            'reject_reason': self.reject_reason,
            'days_open': max(0, days_open),
            'days_remaining': days_remaining,
            'is_overdue': is_overdue,
            'is_converted': bool(getattr(self, 'status', None) == 'approved'),
        }

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
