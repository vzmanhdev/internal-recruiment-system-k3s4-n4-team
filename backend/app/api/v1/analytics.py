from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule
from app.models.offer_onboarding import JobOffer
from app.models.referral_eval import InternalReferral

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
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
    pending_requisitions = db.query(JobRequisition).filter(JobRequisition.status.in_(["pending_manager", "pending_hr"])).count()

    total_interviews = db.query(InterviewSchedule).count()
    completed_interviews = db.query(InterviewSchedule).filter(InterviewSchedule.status == "completed").count()

    total_referrals = db.query(InternalReferral).count()
    hired_referrals = db.query(InternalReferral).filter(InternalReferral.status == "hired").count()

    conversion_rate = round((hired_applications / total_applications * 100), 1) if total_applications > 0 else 0.0

    return {
        "kpis": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "new_applications": new_applications,
            "hired_count": hired_applications,
            "conversion_rate": conversion_rate,
            "pending_requisitions": pending_requisitions,
            "approved_requisitions": approved_requisitions,
            "total_interviews": total_interviews,
            "completed_interviews": completed_interviews,
            "total_referrals": total_referrals,
            "hired_referrals": hired_referrals,
        },
        "application_pipeline": {
            "submitted": new_applications,
            "screening": screening_applications,
            "interviewing": interviewing_applications,
            "offered": offered_applications,
            "hired": hired_applications,
            "rejected": rejected_applications,
        }
    }
