from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.db.session import get_db
from app.api.v1.auth import require_roles
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule
from app.models.offer_onboarding import JobOffer
from app.models.hr import HeadcountBudget, Department

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(authorization: str | None = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr"})
    total_jobs = db.query(JobPosting).count()
    active_jobs = db.query(JobPosting).filter(JobPosting.status == "published").count()
    
    total_applications = db.query(JobApplication).count()
    new_applications = db.query(JobApplication).filter(JobApplication.status == "submitted").count()
    screening_applications = db.query(JobApplication).filter(JobApplication.status == "screening").count()
    interviewing_applications = db.query(JobApplication).filter(JobApplication.status == "interviewing").count()
    offered_applications = db.query(JobApplication).filter(JobApplication.status == "offered").count()
    hired_applications = db.query(JobApplication).filter(JobApplication.status == "hired").count()
    rejected_applications = db.query(JobApplication).filter(JobApplication.status == "rejected").count()

    total_requisitions = db.query(JobRequisition).count()
    approved_requisitions = db.query(JobRequisition).filter(JobRequisition.status == "approved").count()
    pending_requisitions = db.query(JobRequisition).filter(JobRequisition.status.in_(["pending_manager", "pending_hr", "pending_approval"])).count()

    total_interviews = db.query(InterviewSchedule).count()
    completed_interviews = db.query(InterviewSchedule).filter(InterviewSchedule.status == "completed").count()

    # Headcount Summary
    total_headcount_approved = db.query(func.sum(HeadcountBudget.budget_quantity)).scalar() or 0
    total_headcount_occupied = db.query(func.sum(HeadcountBudget.used_quantity)).scalar() or 0
    remaining_headcount = max(0, total_headcount_approved - total_headcount_occupied)

    conversion_rate = round((hired_applications / total_applications * 100), 1) if total_applications > 0 else 0.0

    return {
        "kpis": {
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "active_requisitions": active_jobs,
            "pending_approvals": pending_requisitions,
            "new_candidates_this_week": new_applications,
            "interviews_this_week": interviewing_applications,
            "pending_offers": offered_applications,
            "hired_count": hired_applications,
            "remaining_headcount": remaining_headcount,
            "budget_usage_percent": round((total_headcount_occupied / total_headcount_approved * 100), 1) if total_headcount_approved else 0,
            "conversion_rate": conversion_rate,
        },
        "application_pipeline": {
            "submitted": new_applications,
            "screening": screening_applications,
            "interviewing": interviewing_applications,
            "offered": offered_applications,
            "hired": hired_applications,
            "rejected": rejected_applications,
        },
        "overdue_requisitions": [],
        "hr_action_items": [],
    }
