from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.hr import Department
from app.models.job import JobPosting
from app.models.referral_eval import InternalReferral
from app.models.requisition import JobRequisition
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverview,
    DepartmentStat,
    FunnelStageCount,
    ReferralAnalytics,
    TopReferrer,
)

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}

STAGE_LABELS: Dict[str, str] = {
    "applied": "Mới nộp (Applied)",
    "screening": "Sơ tuyển (Screening)",
    "interviewing": "Phỏng vấn (Interviewing)",
    "offered": "Mời làm việc (Offered)",
    "hired": "Đã tuyển dụng (Hired)",
    "rejected": "Từ chối (Rejected)",
}


def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)

@router.get("/analytics/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    total_requisitions = db.query(JobRequisition).count()
    total_jobs = db.query(JobPosting).count()
    active_jobs = db.query(JobPosting).filter(JobPosting.status == "published").count()
    total_applications = db.query(JobApplication).count()
    hired_applications = db.query(JobApplication).filter(JobApplication.status == "hired").count()

    conversion_rate = round((hired_applications / total_applications * 100), 2) if total_applications > 0 else 0.0

    total_referrals = db.query(InternalReferral).count()
    bonus_sum = db.query(func.sum(InternalReferral.bonus_amount)).filter(InternalReferral.status == "bonus_paid").scalar() or 0.0

    return {
        "total_requisitions": total_requisitions,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "hired_applications": hired_applications,
        "conversion_rate_pct": conversion_rate,
        "total_referrals": total_referrals,
        "total_bonus_paid_vnd": float(bonus_sum),
    }

@router.get("/analytics/funnel", response_model=List[FunnelStageCount])
def get_funnel_analytics(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    total_applications = db.query(JobApplication).count()
    stage_counts = (
        db.query(JobApplication.status, func.count(JobApplication.id))
        .group_by(JobApplication.status)
        .all()
    )

    stage_map = {stage: count for stage, count in stage_counts}

    result = []
    for stage_key, label in STAGE_LABELS.items():
        cnt = stage_map.get(stage_key, 0)
        pct = round((cnt / total_applications * 100), 2) if total_applications > 0 else 0.0
        result.append({
            "stage": stage_key,
            "stage_label": label,
            "count": cnt,
            "percentage": pct,
        })

    return result

@router.get("/analytics/by-department", response_model=List[DepartmentStat])
def get_department_analytics(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    departments = db.query(Department).all()
    result = []

    for dept in departments:
        job_count = db.query(JobPosting).filter(JobPosting.department_id == dept.id).count()

        app_count = (
            db.query(JobApplication)
            .join(JobPosting, JobApplication.job_id == JobPosting.id)
            .filter(JobPosting.department_id == dept.id)
            .count()
        )

        hired_count = (
            db.query(JobApplication)
            .join(JobPosting, JobApplication.job_id == JobPosting.id)
            .filter(JobPosting.department_id == dept.id, JobApplication.status == "hired")
            .count()
        )

        result.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "job_count": job_count,
            "application_count": app_count,
            "hired_count": hired_count,
        })

    return result


@router.get("/analytics/referrals", response_model=ReferralAnalytics)
def get_referral_analytics(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    total_referrals = db.query(InternalReferral).count()
    pending_referrals = db.query(InternalReferral).filter(InternalReferral.status == "pending").count()
    hired_referrals = db.query(InternalReferral).filter(InternalReferral.status.in_(["hired", "bonus_paid"])).count()
    bonus_sum = db.query(func.sum(InternalReferral.bonus_amount)).filter(InternalReferral.status == "bonus_paid").scalar() or 0.0

    # Top referrers
    hired_case = case((InternalReferral.status.in_(["hired", "bonus_paid"]), 1), else_=0)
    top_records = (
        db.query(
            User.id,
            User.full_name,
            User.email,
            func.count(InternalReferral.id).label("total_refs"),
            func.sum(hired_case).label("hired_refs"),
            func.sum(InternalReferral.bonus_amount).label("bonus_sum")
        )
        .join(InternalReferral, User.id == InternalReferral.referrer_id)
        .group_by(User.id, User.full_name, User.email)
        .order_by(func.count(InternalReferral.id).desc())
        .limit(10)
        .all()
    )

    top_referrers = [
        {
            "user_id": r.id,
            "full_name": r.full_name,
            "email": r.email,
            "total_referrals": r.total_refs,
            "hired_referrals": int(r.hired_refs or 0),
            "total_bonus_vnd": float(r.bonus_sum or 0.0),
        }
        for r in top_records
    ]

    return {
        "total_referrals": total_referrals,
        "pending_referrals": pending_referrals,
        "hired_referrals": hired_referrals,
        "total_bonus_paid_vnd": float(bonus_sum),
        "top_referrers": top_referrers,
    }

