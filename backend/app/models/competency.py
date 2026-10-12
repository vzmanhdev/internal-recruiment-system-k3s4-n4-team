import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class CompetencyFramework(Base):
    __tablename__ = 'competency_frameworks'

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), default='Chuyên môn kỹ thuật', nullable=False)
    description = Column(Text, nullable=True)
    job_titles = Column(Text, nullable=False, default='[]')
    status = Column(String(30), default='active', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    criteria = relationship('CompetencyCriteria', back_populates='framework', cascade='all, delete-orphan', order_by='CompetencyCriteria.sort_order')

    def to_dict(self):
        titles = []
        if self.job_titles:
            try:
                titles = json.loads(self.job_titles)
            except Exception:
                titles = [t.strip() for t in self.job_titles.split(',') if t.strip()]
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'description': self.description or '',
            'job_titles': titles,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'criteria': [c.to_dict() for c in self.criteria] if self.criteria else [],
            'total_weight': round(sum(c.weight for c in self.criteria), 2) if self.criteria else 0.0
        }

class CompetencyCriteria(Base):
    __tablename__ = 'competency_criteria'

    id = Column(Integer, primary_key=True, index=True)
    framework_id = Column(Integer, ForeignKey('competency_frameworks.id', ondelete='CASCADE'), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), default='Chuyên môn', nullable=False)
    weight = Column(Float, nullable=False, default=0.0)
    required_level = Column(Integer, default=3, nullable=False)
    description = Column(Text, nullable=True)
    rubric_scale = Column(Text, nullable=True)
    interview_questions = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    framework = relationship('CompetencyFramework', back_populates='criteria')

    def to_dict(self):
        rubric = {}
        if self.rubric_scale:
            try:
                rubric = json.loads(self.rubric_scale)
            except Exception:
                rubric = {}
        questions = []
        if self.interview_questions:
            try:
                questions = json.loads(self.interview_questions)
            except Exception:
                questions = [q.strip() for q in self.interview_questions.split(chr(10)) if q.strip()]
        return {
            'id': self.id,
            'framework_id': self.framework_id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'weight': self.weight,
            'required_level': self.required_level,
            'description': self.description or '',
            'rubric_scale': rubric,
            'interview_questions': questions,
            'sort_order': self.sort_order
        }
