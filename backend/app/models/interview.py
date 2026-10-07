import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.db.session import Base

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(String(100), primary_key=True, index=True)
    application_id = Column(String(100), ForeignKey("applications.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    interviewers_json = Column(Text, default="[]")  # List of interviewer names/emails
    start_time = Column(String(100), nullable=False)  # ISO or readable string
    end_time = Column(String(100), nullable=True)
    location = Column(String(255), default="Google Meet / Phòng Hộp A")
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_interviewers(self, interviewers: list):
        self.interviewers_json = json.dumps(interviewers, ensure_ascii=False)

    def get_interviewers(self) -> list:
        try:
            return json.loads(self.interviewers_json or "[]")
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "applicationId": self.application_id,
            "candidateName": self.candidate_name,
            "jobTitle": self.job_title,
            "interviewers": self.get_interviewers(),
            "startTime": self.start_time,
            "endTime": self.end_time,
            "location": self.location,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class EvaluationScorecard(Base):
    __tablename__ = "evaluation_scorecards"

    id = Column(String(100), primary_key=True, index=True)
    application_id = Column(String(100), ForeignKey("applications.id"), nullable=False)
    interviewer_name = Column(String(255), nullable=False)
    overall_recommendation = Column(String(50), default="Strong Pass")  # Strong Pass, Pass, Borderline, Reject
    ratings_json = Column(Text, default="{}")  # Dict of criteria -> rating score
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_ratings(self, ratings: dict):
        self.ratings_json = json.dumps(ratings, ensure_ascii=False)

    def get_ratings(self) -> dict:
        try:
            return json.loads(self.ratings_json or "{}")
        except Exception:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "applicationId": self.application_id,
            "interviewerName": self.interviewer_name,
            "overallRecommendation": self.overall_recommendation,
            "ratings": self.get_ratings(),
            "comments": self.comments,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
