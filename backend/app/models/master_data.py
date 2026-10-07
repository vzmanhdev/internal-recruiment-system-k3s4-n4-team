from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.db.session import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(100), primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    manager_name = Column(String(255), default="Chưa bổ nhiệm")
    manager_title = Column(String(255), default="Trưởng Đơn Vị")
    headcount_current = Column(Integer, default=0)
    headcount_budget = Column(Integer, default=5)
    active_jobs = Column(Integer, default=0)
    status = Column(String(50), default="active")
    parent_id = Column(String(100), ForeignKey("departments.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "managerName": self.manager_name,
            "managerTitle": self.manager_title,
            "headcountCurrent": self.headcount_current,
            "headcountBudget": self.headcount_budget,
            "active_jobs": self.active_jobs,
            "status": self.status,
            "parentId": self.parent_id
        }

class SalaryBand(Base):
    __tablename__ = "salary_bands"

    id = Column(String(100), primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)  # Junior, Middle, Senior, Lead, Manager, Director
    min_salary = Column(Integer, nullable=False)
    max_salary = Column(Integer, nullable=False)
    department = Column(String(255), nullable=False)
    status = Column(String(50), default="active")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "title": self.title,
            "level": self.level,
            "minSalary": self.min_salary,
            "maxSalary": self.max_salary,
            "department": self.department,
            "status": self.status
        }
