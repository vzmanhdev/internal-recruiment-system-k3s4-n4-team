from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    head_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # S2-04 AC2: người phụ trách
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    parent = relationship("Department", remote_side=[id], foreign_keys=[parent_id], backref="children")
    head_user = relationship("User", foreign_keys=[head_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "parent_id": self.parent_id,
            "head_user_id": self.head_user_id,
            "description": self.description or "",
            "sort_order": self.sort_order,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class JobTitle(Base):
    __tablename__ = "job_titles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    level = Column(String(60), nullable=False)
    min_salary = Column(Float, nullable=False)
    max_salary = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "department_id": self.department_id, "level": self.level, "min_salary": self.min_salary, "max_salary": self.max_salary, "description": self.description, "is_active": self.is_active}

class Competency(Base):
    __tablename__ = "competencies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(80), nullable=False)
    description = Column(Text, nullable=True)
    required_level = Column(Integer, default=3, nullable=False)
    weight = Column(Float, default=0, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "category": self.category, "description": self.description, "required_level": self.required_level, "weight": self.weight, "sort_order": self.sort_order, "is_active": self.is_active}

class SharedCategory(Base):
    __tablename__ = "shared_categories"
    id = Column(Integer, primary_key=True, index=True)
    category_type = Column(String(60), nullable=False)
    name = Column(String(120), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "category_type": self.category_type, "name": self.name, "sort_order": self.sort_order, "is_active": self.is_active}

class HeadcountBudget(Base):
    __tablename__ = "headcount_budgets"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    year = Column(Integer, default=2026, nullable=False)
    budget_quantity = Column(Integer, default=10, nullable=False)
    used_quantity = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, exceeded, closed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "department_id": self.department_id,
            "year": self.year,
            "budget_quantity": self.budget_quantity,
            "used_quantity": self.used_quantity,
            "remaining_quantity": max(0, self.budget_quantity - self.used_quantity),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ApprovalFlow(Base):
    __tablename__ = "approval_flows"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    approval_type = Column(String(50), default="job_requisition", nullable=False)
    name = Column(String(150), nullable=False)
    version = Column(String(20), default="v1.0", nullable=False)
    max_levels = Column(Integer, default=2, nullable=False) # max 3 levels according to EP-03
    min_salary_threshold = Column(Float, default=0.0, nullable=False)
    max_salary_threshold = Column(Float, default=100000000.0, nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, draft, inactive
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    # Ordered approval steps, e.g. [{"step_num": 1, "role": "hiring_manager", "description": "..."}] or ["manager", "hr"]
    steps_json = Column(Text, nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    department = relationship("Department", foreign_keys=[department_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])
    versions = relationship("ApprovalFlowVersion", back_populates="flow", cascade="all, delete-orphan", order_by="desc(ApprovalFlowVersion.created_at)")

    def steps_detail(self):
        import json
        try:
            val = json.loads(self.steps_json) if self.steps_json else None
        except Exception:
            val = None
        if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
            return val
        
        # Mapping legacy or simple string role codes to rich step details
        role_label_map = {
            "manager": ("HIRING_MANAGER", "Trưởng phòng chuyên môn đề xuất & phê duyệt"),
            "hr": ("HR_MANAGER", "Trưởng phòng Nhân sự thẩm định định biên, SLA và ngân sách"),
            "executive": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
            "hiring_manager": ("HIRING_MANAGER", "Trưởng phòng chuyên môn đề xuất & phê duyệt"),
            "hr_manager": ("HR_MANAGER", "Trưởng phòng Nhân sự thẩm định định biên, SLA và ngân sách"),
            "approver": ("EXECUTIVE", "Ban Giám Đốc phê duyệt cuối cùng"),
            "recruiter": ("RECRUITER", "Chuyên viên Tuyển dụng"),
        }
        steps_list = val or ["manager", "hr"][: max(1, self.max_levels or 2)]
        result = []
        for i, code in enumerate(steps_list):
            raw_key = str(code).lower()
            r_code, r_desc = role_label_map.get(raw_key, (str(code).upper(), f"Cấp phê duyệt số {i + 1}"))
            result.append({
                "step_num": i + 1,
                "role": r_code,
                "description": r_desc
            })
        return result

    def steps(self):
        """Returns string role codes for requisition engine workflow compatibility."""
        detail = self.steps_detail()
        code_map = {
            "hiring_manager": "manager",
            "hr_manager": "hr",
            "approver": "executive",
            "executive": "executive",
            "manager": "manager",
            "hr": "hr"
        }
        res = [code_map.get(st.get("role", "").lower(), st.get("role", "manager").lower()) for st in detail]
        return res or ["manager", "hr"][: max(1, self.max_levels or 2)]

    def to_dict(self):
        return {
            "id": self.id,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else "Toàn doanh nghiệp",
            "approval_type": self.approval_type or "job_requisition",
            "name": self.name,
            "version": self.version or "v1.0",
            "steps": self.steps(),
            "steps_detail": self.steps_detail(),
            "max_levels": self.max_levels,
            "min_salary_threshold": self.min_salary_threshold,
            "max_salary_threshold": self.max_salary_threshold,
            "status": self.status,
            "is_active": self.is_active,
            "is_deleted": self.is_deleted,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "description": self.description or "",
            "updated_by_id": self.updated_by_id,
            "updated_by_name": self.updated_by.full_name if self.updated_by else (self.updated_by.email if self.updated_by else None),
            "updated_at": self.updated_at.isoformat() if self.updated_at else (self.created_at.isoformat() if self.created_at else None),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ApprovalFlowVersion(Base):
    __tablename__ = "approval_flow_versions"
    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey("approval_flows.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(20), nullable=False)
    snapshot_json = Column(Text, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    change_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    flow = relationship("ApprovalFlow", back_populates="versions")
    created_by = relationship("User", foreign_keys=[created_by_id])

    def to_dict(self):
        import json
        try:
            snapshot = json.loads(self.snapshot_json) if self.snapshot_json else {}
        except Exception:
            snapshot = {}
        return {
            "id": self.id,
            "flow_id": self.flow_id,
            "version": self.version,
            "snapshot": snapshot,
            "created_by_id": self.created_by_id,
            "created_by_name": self.created_by.full_name if self.created_by else None,
            "change_reason": self.change_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class RecruiterAssignment(Base):
    __tablename__ = "recruiter_assignments"
    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=False)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignment_type = Column(String(50), default="primary", nullable=False) # primary (chính), secondary (hỗ trợ)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "requisition_id": self.requisition_id,
            "recruiter_id": self.recruiter_id,
            "assignment_type": self.assignment_type,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None
        }
