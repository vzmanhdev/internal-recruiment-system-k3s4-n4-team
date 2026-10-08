from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    job_title_id = Column(Integer, nullable=True)
    job_title_name = Column(String(255), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    reason = Column(String(50), default="replacement", nullable=False) # expansion, replacement, seasonal
    reason_detail = Column(Text, nullable=True)
    priority = Column(String(20), default="medium", nullable=False) # low, medium, high, urgent
    employment_type = Column(String(50), default="Full-time", nullable=False)
    work_location = Column(String(255), default="Hà Nội", nullable=False)
    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    is_salary_negotiable = Column(Boolean, default=False, nullable=False)
    target_onboard_date = Column(String(50), nullable=True)
    job_description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    
    # Workflow status: draft, pending_manager, pending_hr, approved, rejected, cancelled
    status = Column(String(50), default="draft", nullable=False)
    current_approval_step = Column(String(50), default="manager", nullable=False)
    reject_reason = Column(Text, nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User", foreign_keys=[created_by_id])
    department = relationship("Department")
    approval_logs = relationship("RequisitionApprovalLog", back_populates="requisition", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "title": self.title,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "job_title_id": self.job_title_id,
            "job_title_name": self.job_title_name,
            "quantity": self.quantity,
            "reason": self.reason,
            "reason_detail": self.reason_detail,
            "priority": self.priority,
            "employment_type": self.employment_type,
            "work_location": self.work_location,
            "min_salary": self.min_salary,
            "max_salary": self.max_salary,
            "is_salary_negotiable": self.is_salary_negotiable,
            "target_onboard_date": self.target_onboard_date,
            "job_description": self.job_description,
            "requirements": self.requirements,
            "benefits": self.benefits,
            "status": self.status,
            "current_approval_step": self.current_approval_step,
            "reject_reason": self.reject_reason,
            "created_by_id": self.created_by_id,
            "creator_name": self.creator.full_name if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RequisitionApprovalLog(Base):
    __tablename__ = "requisition_approval_logs"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    step_name = Column(String(100), nullable=False) # Trưởng bộ phận, Giám đốc, HR Manager
    action = Column(String(50), nullable=False) # approved, rejected, commented
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    requisition = relationship("JobRequisition", back_populates="approval_logs")
    approver = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "requisition_id": self.requisition_id,
            "approver_id": self.approver_id,
            "approver_name": self.approver.full_name if self.approver else None,
            "step_name": self.step_name,
            "action": self.action,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
