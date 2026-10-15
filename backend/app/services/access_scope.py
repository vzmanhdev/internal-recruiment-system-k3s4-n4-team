"""Object-level authorization helpers shared by the recruitment routers.

Scope rules follow the module permission matrix in the Product Backlog ("2. User Roles"):
- Admin and HR Manager: full access.
- Recruiter: candidates of requisitions they are assigned to (S3-06) or postings they created.
- Hiring Manager: candidates of requisitions they created (positions they own).
- Interviewer: candidates of interviews they are assigned to.
- Everyone: their own applications (candidate_id == user.id).
"""
from typing import Set

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, Query

from app.models.user import User
from app.models.application import JobApplication
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.hr import RecruiterAssignment
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.services.rbac_service import get_user_roles, get_effective_permissions

FULL_ACCESS_ROLES = {"admin", "hr_manager"}


def role_codes(db: Session, user: User) -> Set[str]:
    return {r["code"] for r in get_user_roles(db, user)}


def has_permission(db: Session, user: User, permission_code: str) -> bool:
    if "admin" in role_codes(db, user):
        return True
    return permission_code in set(get_effective_permissions(db, user))


def forbidden(message: str = "Bạn không có quyền thực hiện thao tác này.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "PERMISSION_DENIED", "message": message})


def require_any_permission(db: Session, user: User, *codes: str) -> None:
    if not any(has_permission(db, user, c) for c in codes):
        raise forbidden()


def scoped_posting_ids(db: Session, user: User) -> Set[int]:
    """Job postings whose candidates this (non full-access) user may see as staff."""
    roles = role_codes(db, user)
    ids: Set[int] = set()
    if "recruiter" in roles:
        assigned = [r[0] for r in db.query(RecruiterAssignment.requisition_id).filter(RecruiterAssignment.recruiter_id == user.id).all()]
        q = db.query(JobPosting.id).filter(JobPosting.created_by_id == user.id)
        ids |= {r[0] for r in q.all()}
        if assigned:
            ids |= {r[0] for r in db.query(JobPosting.id).filter(JobPosting.requisition_id.in_(assigned)).all()}
    if roles & {"hiring_manager", "manager"}:
        own_reqs = [r[0] for r in db.query(JobRequisition.id).filter(JobRequisition.created_by_id == user.id).all()]
        if own_reqs:
            ids |= {r[0] for r in db.query(JobPosting.id).filter(JobPosting.requisition_id.in_(own_reqs)).all()}
    return ids


def interviewer_application_ids(db: Session, user: User) -> Set[int]:
    rows = (
        db.query(InterviewSchedule.application_id)
        .join(InterviewInterviewer, InterviewInterviewer.interview_id == InterviewSchedule.id)
        .filter(InterviewInterviewer.interviewer_id == user.id)
        .all()
    )
    return {r[0] for r in rows}


def visible_applications(db: Session, user: User) -> Query:
    query = db.query(JobApplication)
    if role_codes(db, user) & FULL_ACCESS_ROLES:
        return query
    posting_ids = scoped_posting_ids(db, user)
    app_ids = interviewer_application_ids(db, user)
    cond = JobApplication.candidate_id == user.id
    if posting_ids:
        cond = cond | JobApplication.job_posting_id.in_(posting_ids)
    if app_ids:
        cond = cond | JobApplication.id.in_(app_ids)
    return query.filter(cond)


def can_manage_application(db: Session, user: User, app: JobApplication) -> bool:
    """Staff write access (stage moves, scheduling, offers): full-access roles or recruiter/HM in scope."""
    if app.candidate_id is not None and app.candidate_id == user.id:
        return False  # conflict of interest: nobody manages their own application
    if role_codes(db, user) & FULL_ACCESS_ROLES:
        return True
    return app.job_posting_id in scoped_posting_ids(db, user)


def ensure_application_visible(db: Session, user: User, app: JobApplication) -> None:
    if visible_applications(db, user).filter(JobApplication.id == app.id).first() is None:
        raise forbidden("Bạn không có quyền truy cập hồ sơ ứng viên này.")


def ensure_can_manage_application(db: Session, user: User, app: JobApplication) -> None:
    if not can_manage_application(db, user, app):
        raise forbidden("Hồ sơ ứng viên này không thuộc vị trí bạn phụ trách.")
