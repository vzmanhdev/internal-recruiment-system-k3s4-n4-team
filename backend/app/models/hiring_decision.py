from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class HiringDecision(Base):
    __tablename__ = 'hiring_decisions'
    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey('job_applications.id'), unique=True, nullable=False)
    decision = Column(String(20), nullable=False)
    note = Column(Text, nullable=False)
    decided_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    reviewer = relationship('User')

    def to_dict(self):
        return dict(decision=self.decision, note=self.note, decided_by=self.reviewer.full_name,
                    updated_at=self.updated_at.isoformat() + 'Z')
