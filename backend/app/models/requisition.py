from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.db.session import Base

class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(String(100), primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    level = Column(String(50), default="Senior")
    target_count = Column(Integer, default=1)
    recruiter_name = Column(String(255), default="Trần Thị Mai")
    target_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    open_days = Column(Integer, default=0)
    priority = Column(String(50), default="High")  # Urgent, High, Medium, Low
    status = Column(String(50), default="open")  # open, pending, approved, closed, overdue
    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "title": self.title,
            "department": self.department,
            "level": self.level,
            "targetCount": self.target_count,
            "recruiterName": self.recruiter_name,
            "targetDate": self.target_date,
            "openDays": self.open_days,
            "priority": self.priority,
            "status": self.status,
            "minSalary": self.min_salary,
            "maxSalary": self.max_salary,
            "description": self.description,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
