from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.db.session import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    head_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # S2-04: người phụ trách
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "code": self.code, "parent_id": self.parent_id, "head_user_id": self.head_user_id,
                "sort_order": self.sort_order, "is_active": self.is_active}

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
    name = Column(String(150), nullable=False)
    max_levels = Column(Integer, default=2, nullable=False) # max 3 levels according to EP-03
    min_salary_threshold = Column(Float, default=0.0, nullable=False)
    max_salary_threshold = Column(Float, default=100000000.0, nullable=False)
    status = Column(String(50), default="active", nullable=False)
    # Ordered approval steps, e.g. ["manager", "hr", "executive"] (S3-01)
    steps_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def steps(self):
        import json
        try:
            value = json.loads(self.steps_json) if self.steps_json else None
        except ValueError:
            value = None
        return value or ["manager", "hr"][: max(1, self.max_levels or 2)]

    def to_dict(self):
        return {
            "id": self.id,
            "department_id": self.department_id,
            "name": self.name,
            "steps": self.steps(),
            "max_levels": self.max_levels,
            "min_salary_threshold": self.min_salary_threshold,
            "max_salary_threshold": self.max_salary_threshold,
            "status": self.status,
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
