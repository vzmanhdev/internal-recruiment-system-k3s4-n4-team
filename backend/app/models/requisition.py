from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    job_title_id = Column(Integer, ForeignKey("job_titles.id"), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    reason = Column(String(100), nullable=False)  # new_headcount, replacement, expansion
    replacement_for = Column(String(255), nullable=True)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)
    work_location = Column(String(255), default="Trụ sở chính", nullable=False)
    employment_type = Column(String(50), default="full_time", nullable=False)  # full_time, part_time, contract
    experience_years = Column(String(50), default="1-3 năm", nullable=False)
    deadline = Column(DateTime, nullable=True)
    job_description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    status = Column(String(50), default="draft", nullable=False)  # draft, pending_dept, pending_hr, approved, rejected, closed
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id])
    job_title = relationship("JobTitle", foreign_keys=[job_title_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    approval_logs = relationship("RequisitionApprovalLog", back_populates="requisition", cascade="all, delete-orphan", order_by="RequisitionApprovalLog.created_at.desc()")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "title": self.title,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "job_title_id": self.job_title_id,
            "job_title_name": self.job_title.name if self.job_title else None,
            "quantity": self.quantity,
            "reason": self.reason,
            "replacement_for": self.replacement_for,
            "min_salary": self.min_salary,
            "max_salary": self.max_salary,
            "work_location": self.work_location,
            "employment_type": self.employment_type,
            "experience_years": self.experience_years,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "job_description": self.job_description,
            "requirements": self.requirements,
            "benefits": self.benefits,
            "status": self.status,
            "created_by_id": self.created_by_id,
            "creator_name": self.creator.full_name if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "approval_logs": [log.to_dict() for log in self.approval_logs] if self.approval_logs else []
        }

class RequisitionApprovalLog(Base):
    __tablename__ = "requisition_approval_logs"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # submit, approve_dept, approve_hr, reject, request_change
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    requisition = relationship("JobRequisition", back_populates="approval_logs")
    approver = relationship("User", foreign_keys=[approver_id])

    def to_dict(self):
        return {
            "id": self.id,
            "requisition_id": self.requisition_id,
            "approver_id": self.approver_id,
            "approver_name": self.approver.full_name if self.approver else None,
            "approver_role": self.approver.role if self.approver else None,
            "action": self.action,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
