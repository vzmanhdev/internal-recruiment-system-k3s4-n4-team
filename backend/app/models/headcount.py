from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship, synonym
from app.db.session import Base


class HeadcountBudget(Base):
    __tablename__ = "headcount_budgets"
    id = Column(Integer, primary_key=True)
    department_id = Column(Integer, ForeignKey("departments.id"), unique=True, nullable=False)
    headcount_limit = Column(Integer, nullable=False, default=10)
    monthly_salary_limit = Column(Numeric(18, 2), nullable=False, default=10**12)
    year = Column(Integer, nullable=False, default=lambda: datetime.now().year)
    status = Column(String(50), nullable=False, default="active")
    budget_quantity = synonym("headcount_limit")
    used_quantity = synonym("reserved_headcount")
    created_at = synonym("updated_at")
    reserved_headcount = Column(Integer, nullable=False, default=0)
    reserved_monthly_salary = Column(Numeric(18, 2), nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    department = relationship("Department")

    def to_dict(self):
        return {"id": self.id, "department_id": self.department_id,
                "department_name": self.department.name if self.department else None,
                "headcount_limit": self.headcount_limit, "monthly_salary_limit": float(self.monthly_salary_limit),
                "reserved_headcount": self.reserved_headcount, "reserved_monthly_salary": float(self.reserved_monthly_salary),
                "year": self.year, "status": self.status,
                "budget_quantity": self.headcount_limit, "used_quantity": self.reserved_headcount,
                "remaining_quantity": self.headcount_limit - self.reserved_headcount,
                "remaining_headcount": self.headcount_limit - self.reserved_headcount,
                "remaining_monthly_salary": float(self.monthly_salary_limit - self.reserved_monthly_salary)}


class RequisitionPublication(Base):
    __tablename__ = "requisition_publications"
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), primary_key=True)
    job_id = Column(Integer, ForeignKey("job_postings.id", ondelete="SET NULL"), unique=True, nullable=True)
