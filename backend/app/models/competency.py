import json
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class CompetencyFramework(Base):
    __tablename__ = "competency_frameworks"

    id = Column(String(100), primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    applied_job_titles_json = Column(Text, default="[]")  # List of job titles
    status = Column(String(50), default="active")
    updated_at = Column(String(100), default="06/10/2026")

    criteria = relationship("CompetencyCriteria", back_populates="framework", cascade="all, delete-orphan")

    def set_applied_job_titles(self, titles: list):
        self.applied_job_titles_json = json.dumps(titles, ensure_ascii=False)

    def get_applied_job_titles(self) -> list:
        try:
            return json.loads(self.applied_job_titles_json or "[]")
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "department": self.department,
            "appliedJobTitles": self.get_applied_job_titles(),
            "status": self.status,
            "updatedAt": self.updated_at,
            "criteriaList": [c.to_dict() for c in self.criteria] if self.criteria else []
        }

class CompetencyCriteria(Base):
    __tablename__ = "competency_criteria"

    id = Column(String(100), primary_key=True, index=True)
    framework_id = Column(String(100), ForeignKey("competency_frameworks.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Integer, default=0)

    framework = relationship("CompetencyFramework", back_populates="criteria")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "description": self.description or "",
            "weight": self.weight
        }

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String(100), primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    criteria_id = Column(String(100), nullable=True)
    criteria_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="medium")  # easy, medium, hard
    suggested_answer = Column(Text, nullable=True)
    is_referenced = Column(Boolean, default=False)
    status = Column(String(50), default="active")
    times_used = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "content": self.content,
            "criteriaId": self.criteria_id or "",
            "criteriaName": self.criteria_name,
            "jobTitle": self.job_title,
            "difficulty": self.difficulty,
            "suggestedAnswer": self.suggested_answer or "",
            "is_referenced": self.is_referenced,
            "status": self.status,
            "timesUsed": self.times_used
        }
