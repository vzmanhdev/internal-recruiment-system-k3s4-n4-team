from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    department_name = Column(String(255), nullable=False)
    location = Column(String(255), default="Hà Nội", nullable=False)
    type = Column(String(50), default="Full-time", nullable=False) # Full-time, Part-time, Contract, Remote
    level = Column(String(50), default="Mid-Level", nullable=False) # Junior, Mid-Level, Senior, Lead, Manager
    salary_range = Column(String(100), default="Thỏa thuận", nullable=False)
    experience_level = Column(String(100), nullable=True)
    deadline = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    
    # Status: draft, published, paused, closed, expired
    status = Column(String(50), default="published", nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    applications_count = Column(Integer, default=0, nullable=False)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User", foreign_keys=[created_by_id])
    requisition = relationship("JobRequisition")
    department = relationship("Department")
    applications = relationship("JobApplication", back_populates="job_posting", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "requisition_id": self.requisition_id,
            "department_id": self.department_id,
            "department": self.department_name,
            "department_name": self.department_name,
            "location": self.location,
            "type": self.type,
            "level": self.level,
            "salary_range": self.salary_range,
            "salaryRange": self.salary_range,
            "experience_level": self.experience_level,
            "deadline": self.deadline,
            "description": self.description,
            "requirements": self.requirements,
            "benefits": self.benefits,
            "status": self.status,
            "views_count": self.views_count,
            "applications_count": len(self.applications) if self.applications else self.applications_count,
            "created_by_id": self.created_by_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
