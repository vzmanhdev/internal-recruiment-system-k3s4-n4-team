import json
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.db.session import Base

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    location = Column(String(255), default="Hà Nội")
    employment_type = Column(String(100), default="Toàn thời gian")
    openings = Column(String(100), default="1-2 người")
    status = Column(String(50), default="open")  # open, closingSoon, closed
    description = Column(Text, nullable=True)
    skills_json = Column(Text, default="[]")  # JSON list
    deadline = Column(String(50), nullable=True)
    responsibilities_json = Column(Text, default="[]")  # JSON list
    requirements_json = Column(Text, default="[]")  # JSON list
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_skills(self, skills: list):
        self.skills_json = json.dumps(skills, ensure_ascii=False)

    def get_skills(self) -> list:
        try:
            return json.loads(self.skills_json or "[]")
        except Exception:
            return []

    def set_responsibilities(self, responsibilities: list):
        self.responsibilities_json = json.dumps(responsibilities, ensure_ascii=False)

    def get_responsibilities(self) -> list:
        try:
            return json.loads(self.responsibilities_json or "[]")
        except Exception:
            return []

    def set_requirements(self, requirements: list):
        self.requirements_json = json.dumps(requirements, ensure_ascii=False)

    def get_requirements(self) -> list:
        try:
            return json.loads(self.requirements_json or "[]")
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "department": self.department,
            "location": self.location,
            "employmentType": self.employment_type,
            "openings": self.openings,
            "status": self.status,
            "description": self.description,
            "skills": self.get_skills(),
            "deadline": self.deadline,
            "responsibilities": self.get_responsibilities(),
            "requirements": self.get_requirements()
        }
