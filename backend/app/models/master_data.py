"""Master data mapped onto the existing legacy tables (string ids) so data already present in the
development databases (competency frameworks, criteria, interview questions) is usable as-is.
"""
import json
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.session import Base


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


class CompetencyFramework(Base):
    """S2-06: competency framework reused by several job titles."""
    __tablename__ = "competency_frameworks"

    id = Column(String(100), primary_key=True, default=lambda: new_id("cf"))
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    applied_job_titles_json = Column(Text, nullable=True)  # list of job title names
    status = Column(String(50), default="active", nullable=False)
    updated_at = Column(String(100), nullable=True)

    def job_titles(self):
        try:
            return json.loads(self.applied_job_titles_json) if self.applied_job_titles_json else []
        except ValueError:
            return []

    def to_dict(self, criteria=None):
        out = {
            "id": self.id, "code": self.code, "name": self.name, "department": self.department,
            "applied_job_titles": self.job_titles(), "status": self.status, "updated_at": self.updated_at,
        }
        if criteria is not None:
            out["criteria"] = [c.to_dict() for c in criteria]
            out["total_weight"] = sum(c.weight or 0 for c in criteria)
        return out


class CompetencyCriterion(Base):
    __tablename__ = "competency_criteria"

    id = Column(String(100), primary_key=True, default=lambda: new_id("c"))
    framework_id = Column(String(100), ForeignKey("competency_frameworks.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Integer, nullable=False, default=0)  # percent; a framework's weights sum to 100
    # optional rating guide shown to interviewers (group + what a 1 / 3 / 5 looks like)
    category = Column(String(60), nullable=True)
    benchmark_low = Column(Text, nullable=True)
    benchmark_mid = Column(Text, nullable=True)
    benchmark_high = Column(Text, nullable=True)

    def to_dict(self):
        return {"id": self.id, "framework_id": self.framework_id, "code": self.code, "name": self.name,
                "description": self.description, "weight": self.weight, "category": self.category,
                "benchmark_low": self.benchmark_low, "benchmark_mid": self.benchmark_mid, "benchmark_high": self.benchmark_high}


class InterviewQuestion(Base):
    """S2-07 question bank."""
    __tablename__ = "interview_questions"

    id = Column(String(100), primary_key=True, default=lambda: new_id("q"))
    code = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    criteria_id = Column(String(100), ForeignKey("competency_criteria.id"), nullable=True, index=True)
    criteria_name = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    difficulty = Column(String(50), nullable=True)  # easy, medium, hard
    suggested_answer = Column(Text, nullable=True)
    is_referenced = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="active", nullable=False)
    times_used = Column(Integer, default=0, nullable=False)

    def to_dict(self):
        return {"id": self.id, "code": self.code, "content": self.content, "criteria_id": self.criteria_id,
                "criteria_name": self.criteria_name, "job_title": self.job_title, "difficulty": self.difficulty,
                "suggested_answer": self.suggested_answer, "status": self.status, "times_used": self.times_used}


class OnboardingTemplate(Base):
    """S7-08: onboarding checklist template per department (department_id NULL = company default)."""
    __tablename__ = "onboarding_templates"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    items_json = Column(Text, nullable=False)  # [{"task_name","assigned_role","days_before_start"}]
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def items(self):
        try:
            return json.loads(self.items_json)
        except ValueError:
            return []

    def to_dict(self):
        return {"id": self.id, "department_id": self.department_id, "name": self.name, "items": self.items(),
                "is_active": self.is_active}


class StoredFile(Base):
    """Uploaded file metadata (S2-03 avatar, S4-03 CV). Bytes live on disk under FILE_STORAGE_DIR."""
    __tablename__ = "stored_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kind = Column(String(20), nullable=False)  # cv, avatar
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    original_name = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False)
    storage_name = Column(String(100), nullable=False)
    uploader_ip = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    @property
    def url(self) -> str:
        return f"/api/v1/files/{self.id}"

    def to_dict(self):
        return {"id": self.id, "kind": self.kind, "original_name": self.original_name, "content_type": self.content_type,
                "size_bytes": self.size_bytes, "url": self.url, "created_at": self.created_at.isoformat() if self.created_at else None}


class ApplicationNote(Base):
    """S5-04: internal note with author; never visible to the candidate."""
    __tablename__ = "application_notes"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self, author_name=None):
        return {"id": self.id, "application_id": self.application_id, "author_id": self.author_id,
                "author_name": author_name, "content": self.content,
                "created_at": self.created_at.isoformat() if self.created_at else None}


class TalentPoolEntry(Base):
    """S5-06 talent pool."""
    __tablename__ = "talent_pool_entries"

    id = Column(Integer, primary_key=True, index=True)
    person_key = Column(String(255), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    interested_title = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True)
    reason = Column(Text, nullable=False)
    added_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {"id": self.id, "person_key": self.person_key, "application_id": self.application_id, "full_name": self.full_name,
                "email": self.email, "phone": self.phone, "interested_title": self.interested_title, "skills": self.skills,
                "reason": self.reason, "added_by_id": self.added_by_id, "is_active": self.is_active,
                "created_at": self.created_at.isoformat() if self.created_at else None}


class SavedFilter(Base):
    """S5-05: per-user saved candidate filters."""
    __tablename__ = "saved_filters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    filters_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        try:
            filters = json.loads(self.filters_json)
        except ValueError:
            filters = {}
        return {"id": self.id, "name": self.name, "filters": filters,
                "created_at": self.created_at.isoformat() if self.created_at else None}


class SlaRule(Base):
    """S5-10: maximum days an application may stay in a stage."""
    __tablename__ = "sla_rules"

    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String(50), nullable=False, unique=True)
    max_days = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "stage": self.stage, "max_days": self.max_days, "is_active": self.is_active}


class RecruitmentCost(Base):
    """S8-08: manually entered recruitment costs (job board fees, agency, events…)."""
    __tablename__ = "recruitment_costs"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # posting, referral_bonus, agency, other
    amount = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {"id": self.id, "requisition_id": self.requisition_id, "category": self.category, "amount": self.amount,
                "note": self.note, "created_at": self.created_at.isoformat() if self.created_at else None}


class AskedQuestion(Base):
    """S7-02: questions already asked to a candidate (avoid repeating in later rounds)."""
    __tablename__ = "asked_questions"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False, index=True)
    question_id = Column(String(100), ForeignKey("interview_questions.id"), nullable=False)
    interview_id = Column(Integer, ForeignKey("interview_schedules.id"), nullable=True)
    asked_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class CareerPageSettings(Base):
    """Public career page content edited by HR (single row, id = 1)."""
    __tablename__ = "career_page_settings"

    id = Column(Integer, primary_key=True)
    data_json = Column(Text, nullable=False, default="{}")
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def data(self) -> dict:
        try:
            return json.loads(self.data_json or "{}")
        except ValueError:
            return {}
