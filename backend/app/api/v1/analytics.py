from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule
from app.models.offer_onboarding import JobOffer
from app.models.hr import HeadcountBudget, Department, RecruiterAssignment
from app.api.deps import require_permission
from app.services import reporting

router = APIRouter()

PIPELINE_STATUSES = ["submitted", "screening", "interviewing", "offered", "hired", "rejected"]
PENDING_REQ_STATUSES = ["pending_manager", "pending_hr"]
OPEN_REQ_STATUSES = ["approved"]


def _parse_day(value):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


@router.get("/overview")
def get_analytics_overview(
    current_user: User = Depends(require_permission("report:view")),
    db: Session = Depends(get_db),
):
    """HR dashboard. Every figure is aggregated from database rows; nothing is synthesised."""
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    today = date.today()

    status_counts = dict(
        db.query(JobApplication.status, func.count(JobApplication.id)).group_by(JobApplication.status).all()
    )
    pipeline = {s: int(status_counts.get(s, 0)) for s in PIPELINE_STATUSES}
    total_applications = int(sum(status_counts.values()))

    active_jobs = db.query(JobPosting).filter(JobPosting.status == "published").count()
    active_requisitions = db.query(JobRequisition).filter(JobRequisition.status.in_(OPEN_REQ_STATUSES)).count()
    pending_requisitions = db.query(JobRequisition).filter(JobRequisition.status.in_(PENDING_REQ_STATUSES)).count()
    pending_offer_approvals = db.query(JobOffer).filter(JobOffer.status == "pending_approval").count()
    pending_offers = db.query(JobOffer).filter(JobOffer.status.in_(["pending_approval", "approved", "sent"])).count()
    new_candidates_this_week = db.query(JobApplication).filter(JobApplication.created_at >= week_start).count()
    interviews_this_week = db.query(InterviewSchedule).filter(
        InterviewSchedule.scheduled_time >= week_start, InterviewSchedule.scheduled_time <= now + timedelta(days=7)
    ).count()

    total_budget = int(db.query(func.sum(HeadcountBudget.budget_quantity)).scalar() or 0)
    total_used = int(db.query(func.sum(HeadcountBudget.used_quantity)).scalar() or 0)
    remaining_headcount = max(0, total_budget - total_used)
    budget_usage_percent = round(total_used / total_budget * 100, 1) if total_budget else None
    conversion_rate = round(pipeline["hired"] / total_applications * 100, 1) if total_applications else 0.0

    departments = {d.id: d.name for d in db.query(Department).all()}
    overdue = []
    open_reqs = db.query(JobRequisition).filter(JobRequisition.status.in_(OPEN_REQ_STATUSES + PENDING_REQ_STATUSES)).all()
    for req in open_reqs:
        target = _parse_day(req.target_onboard_date)
        if target and target < today:
            primary = db.query(RecruiterAssignment).filter(
                RecruiterAssignment.requisition_id == req.id, RecruiterAssignment.assignment_type == "primary"
            ).first()
            recruiter = db.query(User).filter(User.id == primary.recruiter_id).first() if primary else None
            delay = (today - target).days
            overdue.append({
                "id": req.code,
                "requisition_id": req.id,
                "title": req.title,
                "department": departments.get(req.department_id),
                "target_date": target.strftime("%d/%m/%Y"),
                "delay_days": delay,
                "recruiter": recruiter.full_name if recruiter else None,
                "status": f"Quá hạn {delay} ngày",
            })
    overdue.sort(key=lambda r: r["delay_days"], reverse=True)

    action_items = []
    for req in db.query(JobRequisition).filter(JobRequisition.status == "pending_hr").order_by(JobRequisition.created_at).limit(10):
        action_items.append({"id": f"req-{req.id}", "type": "requisition_approval", "title": f"Thẩm định tờ trình {req.code} — {req.title}",
                             "priority": req.priority, "time": req.created_at.isoformat() if req.created_at else None})
    for offer in db.query(JobOffer).filter(JobOffer.status == "pending_approval").order_by(JobOffer.created_at).limit(10):
        action_items.append({"id": f"offer-{offer.id}", "type": "offer_approval",
                             "title": f"Phê duyệt offer cho {offer.application.full_name if offer.application else '#' + str(offer.application_id)}"
                                      + (" (vượt dải lương)" if offer.requires_escalation else ""),
                             "priority": "Vượt dải lương" if offer.requires_escalation else "Bình thường",
                             "time": offer.created_at.isoformat() if offer.created_at else None})
    for job in db.query(JobPosting).filter(JobPosting.status == "pending_review").order_by(JobPosting.created_at).limit(10):
        action_items.append({"id": f"job-{job.id}", "type": "job_review", "title": f"Duyệt tin tuyển dụng {job.title}",
                             "priority": "Trung bình", "time": job.created_at.isoformat() if job.created_at else None})

    req_by_dept = dict(db.query(JobRequisition.department_id, func.count(JobRequisition.id)).group_by(JobRequisition.department_id).all())
    cand_by_dept = dict(
        db.query(JobPosting.department_id, func.count(JobApplication.id))
        .join(JobApplication, JobApplication.job_posting_id == JobPosting.id)
        .group_by(JobPosting.department_id).all()
    )
    hired_by_dept = dict(
        db.query(JobPosting.department_id, func.count(JobApplication.id))
        .join(JobApplication, JobApplication.job_posting_id == JobPosting.id)
        .filter(JobApplication.status.in_(["hired", "onboarded"]))
        .group_by(JobPosting.department_id).all()
    )
    department_metrics = [
        {"name": name, "requisitions": int(req_by_dept.get(dept_id, 0)),
         "candidates": int(cand_by_dept.get(dept_id, 0)), "hired": int(hired_by_dept.get(dept_id, 0))}
        for dept_id, name in departments.items()
        if req_by_dept.get(dept_id) or cand_by_dept.get(dept_id)
    ]

    return {
        "generated_at": now.isoformat(),
        "kpis": {
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "active_requisitions": active_requisitions,
            "pending_approvals": pending_requisitions + pending_offer_approvals,
            "new_candidates_this_week": new_candidates_this_week,
            "interviews_this_week": interviews_this_week,
            "pending_offers": pending_offers,
            "hired_count": pipeline["hired"] + int(status_counts.get("onboarded", 0)),
            "remaining_headcount": remaining_headcount,
            "budget_usage_percent": budget_usage_percent,
            "conversion_rate": conversion_rate,
        },
        "application_pipeline": pipeline,
        "overdue_requisitions": overdue,
        "hr_action_items": action_items,
        "department_metrics": department_metrics,
        "weekly_applications": reporting.weekly_applications(db),
        "monthly_closed_positions": reporting.monthly_closed_positions(db),
    }


# ---------------------------------------------------------------------------- EP-09 reports
from typing import Optional as _Optional  # noqa: E402

from fastapi import HTTPException  # noqa: E402
from fastapi.responses import StreamingResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from app.api.deps import get_current_user_obj  # noqa: E402
from app.models.interview import InterviewInterviewer  # noqa: E402
from app.models.master_data import RecruitmentCost  # noqa: E402
from app.models.referral_eval import CandidateEvaluation  # noqa: E402
from app.services import reporting  # noqa: E402



@router.get("/trends")
def get_trends(current_user: User = Depends(require_permission("report:view")), db: Session = Depends(get_db)):
    """S8-05 AC2: applications per week and positions closed per month."""
    return {"weekly_applications": reporting.weekly_applications(db), "monthly_closed_positions": reporting.monthly_closed_positions(db)}


@router.get("/funnel")
def get_funnel(job_id: _Optional[int] = None, department_id: _Optional[int] = None, date_from: _Optional[date] = None,
               date_to: _Optional[date] = None, current_user: User = Depends(require_permission("report:view")),
               db: Session = Depends(get_db)):
    return reporting.funnel(db, job_id=job_id, department_id=department_id, date_from=date_from, date_to=date_to)


@router.get("/hiring-metrics")
def get_hiring_metrics(date_from: _Optional[date] = None, date_to: _Optional[date] = None, export: bool = False,
                       current_user: User = Depends(require_permission("report:view")), db: Session = Depends(get_db)):
    data = reporting.hiring_metrics(db, date_from, date_to)
    if export:
        buf = reporting.to_xlsx({"Theo phong ban": data["by_department"], "Theo chuc danh": data["by_job_title"]})
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": f'attachment; filename="time-to-hire_cost-per-hire_{date.today().isoformat()}.xlsx"'})
    return data


@router.get("/sources")
def get_source_effectiveness(date_from: _Optional[date] = None, date_to: _Optional[date] = None, export: bool = False,
                             current_user: User = Depends(require_permission("report:view")), db: Session = Depends(get_db)):
    rows = reporting.source_effectiveness(db, date_from, date_to)
    if export:
        buf = reporting.to_xlsx({"Nguon ung vien": rows})
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": f'attachment; filename="hieu-qua-nguon_{date.today().isoformat()}.xlsx"'})
    return rows


class CostIn(BaseModel):
    requisition_id: int
    category: str = Field(..., pattern="^(posting|agency|event|referral_bonus|other)$")
    amount: int = Field(..., gt=0)
    note: _Optional[str] = None


@router.get("/costs")
def list_costs(requisition_id: _Optional[int] = None, current_user: User = Depends(require_permission("report:manage")),
               db: Session = Depends(get_db)):
    q = db.query(RecruitmentCost)
    if requisition_id:
        q = q.filter(RecruitmentCost.requisition_id == requisition_id)
    return [c.to_dict() for c in q.order_by(RecruitmentCost.id.desc()).all()]


@router.post("/costs", status_code=201)
def add_cost(payload: CostIn, current_user: User = Depends(require_permission("report:manage")), db: Session = Depends(get_db)):
    """S8-08 AC2: manually entered recruitment costs."""
    if not db.query(JobRequisition.id).filter(JobRequisition.id == payload.requisition_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")
    item = RecruitmentCost(**payload.model_dump(), created_by_id=current_user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


@router.get("/hiring-manager")
def hiring_manager_dashboard(current_user: User = Depends(require_permission("workspace:manager:access")),
                             db: Session = Depends(get_db)):
    """S8-06: per position owned by this hiring manager — stage counts, upcoming interviews,
    candidates waiting for my feedback, days left until the needed-by date."""
    today = date.today()
    out = []
    for req in db.query(JobRequisition).filter(JobRequisition.created_by_id == current_user.id).order_by(JobRequisition.created_at.desc()).all():
        apps = db.query(JobApplication).join(JobPosting, JobPosting.id == JobApplication.job_posting_id).filter(JobPosting.requisition_id == req.id).all()
        counts = {s: sum(1 for a in apps if a.status == s) for s in ["submitted", "screening", "interviewing", "offered", "hired", "rejected"]}
        upcoming, waiting = [], []
        for a in apps:
            for i in a.interviews:
                if i.status == "scheduled" and i.scheduled_time >= datetime.now():
                    upcoming.append({"interview_id": i.id, "candidate": a.full_name, "at": i.scheduled_time.isoformat(), "round": i.round_name})
                mine = db.query(InterviewInterviewer.id).filter(InterviewInterviewer.interview_id == i.id,
                                                                InterviewInterviewer.interviewer_id == current_user.id).first()
                done = db.query(CandidateEvaluation.id).filter(CandidateEvaluation.application_id == a.id,
                                                               CandidateEvaluation.evaluator_id == current_user.id).first()
                if mine and not done and i.scheduled_time < datetime.now():
                    waiting.append({"application_id": a.id, "candidate": a.full_name, "interview_id": i.id})
        days_left = None
        if req.target_onboard_date:
            try:
                days_left = (date.fromisoformat(req.target_onboard_date[:10]) - today).days
            except ValueError:
                pass
        out.append({"requisition_id": req.id, "code": req.code, "title": req.title, "status": req.status,
                    "stage_counts": counts, "upcoming_interviews": sorted(upcoming, key=lambda x: x["at"]),
                    "waiting_for_my_feedback": waiting, "days_until_needed": days_left})
    return out
