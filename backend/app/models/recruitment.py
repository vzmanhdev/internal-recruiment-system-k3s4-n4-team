"""
Unified re-exports of canonical database models.
This prevents duplicate SQLAlchemy declarative class registrations across modules.
"""
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication as Application
from app.models.interview import InterviewSchedule
from app.models.referral_eval import InternalReferral as ReferralRecord

__all__ = [
    "JobRequisition",
    "JobPosting",
    "Application",
    "InterviewSchedule",
    "ReferralRecord",
]
