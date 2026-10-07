from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from app.db.session import Base

class Offer(Base):
    __tablename__ = "offers"

    id = Column(String(100), primary_key=True, index=True)
    application_id = Column(String(100), ForeignKey("applications.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    position_title = Column(String(255), nullable=False)
    salary = Column(Integer, nullable=False)
    start_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    status = Column(String(50), default="draft")  # draft, pending_approval, approved, sent, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "applicationId": self.application_id,
            "candidateName": self.candidate_name,
            "positionTitle": self.position_title,
            "salary": self.salary,
            "startDate": self.start_date,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class OnboardingTask(Base):
    __tablename__ = "onboarding_tasks"

    id = Column(String(100), primary_key=True, index=True)
    candidate_id = Column(String(100), ForeignKey("candidates.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    task_name = Column(String(255), nullable=False)
    due_date = Column(String(50), nullable=False)
    completed = Column(Boolean, default=False)
    assigned_to = Column(String(255), default="HR Specialist")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "candidateId": self.candidate_id,
            "candidateName": self.candidate_name,
            "taskName": self.task_name,
            "dueDate": self.due_date,
            "completed": self.completed,
            "assignedTo": self.assigned_to,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
