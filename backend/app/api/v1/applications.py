import io
import json
import secrets
import string
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.hr import RecruiterAssignment, SharedCategory
from app.models.email_automation import EmailLog
from app.models.master_data import ApplicationNote, SavedFilter, StoredFile, TalentPoolEntry
from app.models.referral_eval import CandidateEvaluation
from app.api.deps import get_current_user_obj, authenticate_bearer
from app.services.notification_service import notify
from app.services.email_dispatch import already_sent, frontend_link, new_link_token, queue_template_email, render
from app.services.cv_parser import parse_cv
from app.services import file_storage
from app.services.access_scope import (
    visible_applications, ensure_application_visible, ensure_can_manage_application, require_any_permission,
    role_codes, can_manage_application, scoped_posting_ids, FULL_ACCESS_ROLES,
)

router = APIRouter()

ALLOWED_STATUSES = {"submitted", "screening", "interviewing", "offered", "hired", "rejected"}
TERMINAL_STATUSES = {"hired", "rejected", "withdrawn", "onboarded"}
CLOSED_FOR_DUPLICATE = {"rejected", "withdrawn"}
STAFF_ROLES = FULL_ACCESS_ROLES | {"recruiter", "hiring_manager", "manager", "interviewer", "approver"}
REJECTION_CATEGORY_TYPES = ("rejection_reason", "Lý do loại hồ sơ")
APPLICATIONS_PER_IP_PER_HOUR = 5


# ------------------------------------------------------------------ schemas
class ApplicationCreate(BaseModel):
    job_posting_id: int
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=1)
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    years_of_experience: int = Field(default=0, ge=0)
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None
    referral_code: Optional[str] = None
    source: Optional[str] = None
    website: Optional[str] = Field(default=None, description="honeypot — must stay empty (S4-03 anti-spam)")


class ApplicationStatusUpdate(BaseModel):
    status: str
    score: Optional[int] = Field(default=None, ge=0, le=100)
    hr_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    skip_interview_confirmed: bool = False
    add_to_talent_pool: bool = False
    talent_pool_reason: Optional[str] = None


class WithdrawRequest(BaseModel):
    reason: Optional[str] = None


class TagsUpdate(BaseModel):
    tags: List[str] = Field(default_factory=list)
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1)


class DirectEmail(BaseModel):
    subject: str = Field(..., min_length=3, max_length=255)
    body: str = Field(..., min_length=1, max_length=10_000)


class SavedFilterIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    filters: dict


class BulkEmailRequest(BaseModel):
    application_ids: List[int] = Field(..., min_length=1)
    template_code: str = "REJECT_CANDIDATE"
    reason: Optional[str] = None
    preview_only: bool = False


class HiringDecision(BaseModel):
    decision: str  # offer, reject
    reason: Optional[str] = None


# ------------------------------------------------------------------ helpers
def _optional_user(authorization: Optional[str], db: Session) -> Optional[User]:
    if not authorization:
        return None
    try:
        user, _ = authenticate_bearer(authorization, db)
        return user
    except FastAPIHTTPException:
        return None


def _is_staff(db: Session, user: User) -> bool:
    return bool(role_codes(db, user) & STAFF_ROLES)


def _new_tracking_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "APP-" + "".join(secrets.choice(alphabet) for _ in range(8))
        if not db.query(JobApplication.id).filter(JobApplication.tracking_code == code).first():
            return code


def _validate_cv_url(db: Session, cv_url: Optional[str]) -> Optional[StoredFile]:
    if not cv_url:
        return None
    file_id = cv_url.rstrip("/").split("/")[-1]
    item = db.query(StoredFile).filter(StoredFile.id == file_id, StoredFile.kind == "cv").first()
    if not cv_url.startswith("/api/v1/files/") or not item:
        raise HTTPException(status_code=422, detail="CV phải được tải lên hệ thống (PDF hoặc DOCX, tối đa 10MB).")
    return item


def _match(job: JobPosting, app: JobApplication) -> tuple:
    """S5-09: score against mandatory criteria; only for sorting, never auto-rejects."""
    checks, passed = 0, 0
    if job.min_years_experience is not None:
        checks += 1
        passed += int((app.years_of_experience or 0) >= job.min_years_experience)
    try:
        skills = json.loads(job.required_skills_json) if job.required_skills_json else []
    except ValueError:
        skills = []
    text = " ".join(filter(None, [app.cover_letter, app.current_position, app.current_company])).lower()
    for skill in skills:
        checks += 1
        passed += int(skill.lower() in text)
    if not checks:
        return None, None
    return round(100 * passed / checks), passed == checks


def _log(db: Session, app: JobApplication, actor_id: int, to_status: str, comment: str):
    db.add(ApplicationLog(application_id=app.id, changed_by_id=actor_id, from_status=app.status, to_status=to_status, comment=comment))


def _assigned_recruiters(db: Session, app: JobApplication) -> list:
    req_id = app.job_posting.requisition_id if app.job_posting else None
    return [r[0] for r in db.query(RecruiterAssignment.recruiter_id).filter(RecruiterAssignment.requisition_id == req_id).all()] if req_id else []


def _create_application(db: Session, payload: ApplicationCreate, job: JobPosting, applicant: Optional[User],
                        client_ip: Optional[str], default_source: Optional[str]) -> tuple:
    email = payload.email.strip().lower()
    duplicate = db.query(JobApplication).filter(
        JobApplication.job_posting_id == job.id, JobApplication.email == email,
        JobApplication.status.notin_(CLOSED_FOR_DUPLICATE),
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail={"code": "DUPLICATE_APPLICATION",
                                                     "message": "Bạn đã nộp hồ sơ cho vị trí này và hồ sơ vẫn đang được xử lý."})
    cv_file = _validate_cv_url(db, payload.cv_url)
    parsed = None
    if cv_file:
        try:
            parsed = parse_cv(file_storage.read_bytes(cv_file.storage_name), cv_file.content_type)
        except OSError:
            parsed = {"status": "failed"}
    raw_token, token_hash = new_link_token()
    app = JobApplication(
        job_posting_id=job.id, candidate_id=applicant.id if applicant else None,
        full_name=payload.full_name.strip(), email=email, phone=payload.phone.strip(),
        current_company=payload.current_company, current_position=payload.current_position,
        years_of_experience=payload.years_of_experience, cv_url=payload.cv_url, cover_letter=payload.cover_letter,
        referral_code=payload.referral_code, source=payload.source or default_source, client_ip=client_ip,
        status="submitted", tracking_code=_new_tracking_code(db), person_key=email,
        parsed_cv_json=json.dumps(parsed, ensure_ascii=False) if parsed else None,
        withdraw_token_hash=token_hash, stage_entered_at=datetime.utcnow(),
    )
    app.job_posting = job
    app.match_score, app.meets_requirements = _match(job, app)
    db.add(app)
    db.query(JobPosting).filter(JobPosting.id == job.id).update(
        {JobPosting.applications_count: JobPosting.applications_count + 1}, synchronize_session=False)
    db.flush()
    footer = (f'<p style="font-size:12px;color:#64748b">Mã tra cứu hồ sơ: <strong>{app.tracking_code}</strong>. '
              f'Nếu muốn rút hồ sơ: <a href="{frontend_link("/candidate/withdraw", raw_token)}">rút hồ sơ</a>.</p>')
    queue_template_email(db, "CONFIRM_APPLICATION", app.email, app.full_name,
                         {"candidate_name": app.full_name, "job_title": job.title, "tracking_code": app.tracking_code},
                         related_entity="APPLICATION", related_id=app.id, footer_html=footer)
    return app, raw_token


def _possible_duplicates(db: Session, app: JobApplication) -> list:
    rows = db.query(JobApplication).filter(
        JobApplication.id != app.id,
        or_(JobApplication.email == app.email, JobApplication.phone == app.phone),
        or_(JobApplication.person_key.is_(None), JobApplication.person_key != app.person_key),
    ).all()
    return [{"id": r.id, "full_name": r.full_name, "email": r.email, "phone": r.phone, "job_title": r.job_posting.title if r.job_posting else None,
             "status": r.status, "created_at": r.created_at.isoformat() if r.created_at else None} for r in rows]


def _filtered(db: Session, user: User, job_id=None, status_filter=None, search=None, source=None, tag=None,
              rating_min=None, date_from=None, date_to=None, overdue_only=False):
    query = visible_applications(db, user)
    if job_id:
        query = query.filter(JobApplication.job_posting_id == job_id)
    if status_filter:
        query = query.filter(JobApplication.status == status_filter)
    if source:
        query = query.filter(JobApplication.source == source)
    if rating_min:
        query = query.filter(JobApplication.rating >= rating_min)
    if date_from:
        query = query.filter(JobApplication.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(JobApplication.created_at <= datetime.combine(date_to, datetime.max.time()))
    if overdue_only:
        query = query.filter(JobApplication.is_overdue == True)  # noqa: E712
    if search:
        like = f"%{search}%"
        query = query.filter(JobApplication.full_name.ilike(like) | JobApplication.email.ilike(like)
                             | JobApplication.phone.ilike(like) | JobApplication.cover_letter.ilike(like))
    apps = query.order_by(JobApplication.created_at.desc()).all()
    if tag:
        apps = [a for a in apps if tag in a.tags()]
    return apps


# ------------------------------------------------------------------ list / static routes (declared before /{app_id})
@router.get("")
def list_applications(
    job_id: Optional[int] = None, status_filter: Optional[str] = None, search: Optional[str] = None,
    source: Optional[str] = None, tag: Optional[str] = None, rating_min: Optional[int] = None,
    date_from: Optional[date] = None, date_to: Optional[date] = None, overdue_only: bool = False,
    sort: Optional[str] = None,
    mine: Optional[bool] = False,
    current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db),
):
    if mine:
        user_email = (current_user.email or "").strip().lower()
        q = db.query(JobApplication).filter(
            or_(
                JobApplication.candidate_id == current_user.id,
                JobApplication.email.ilike(user_email)
            )
        )
        if job_id:
            q = q.filter(JobApplication.job_posting_id == job_id)
        if status_filter:
            q = q.filter(JobApplication.status == status_filter)
        apps = q.order_by(JobApplication.created_at.desc()).all()
        return [a.candidate_view() for a in apps]

    apps = _filtered(db, current_user, job_id, status_filter, search, source, tag, rating_min, date_from, date_to, overdue_only)
    if sort == "match":
        apps.sort(key=lambda a: (a.match_score is None, -(a.match_score or 0)))
    if not _is_staff(db, current_user):
        return [a.candidate_view() for a in apps]
    # Staff who applied internally still get only the candidate view of their own applications.
    return [a.candidate_view() if a.candidate_id == current_user.id else a.to_dict() for a in apps]


@router.get("/pipeline-summary")
def pipeline_summary(job_id: Optional[int] = None, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S5-02: count per kanban column."""
    stages = ["submitted", "screening", "interviewing", "offered", "hired", "rejected"]
    apps = _filtered(db, current_user, job_id=job_id)
    return {s: sum(1 for a in apps if a.status == s or (s == "hired" and a.status == "onboarded")) for s in stages}


@router.get("/export")
def export_applications(
    job_id: Optional[int] = None, status_filter: Optional[str] = None, search: Optional[str] = None,
    source: Optional[str] = None, tag: Optional[str] = None, rating_min: Optional[int] = None,
    date_from: Optional[date] = None, date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db),
):
    """S6-01: export the current filter; never includes internal notes."""
    require_any_permission(db, current_user, "candidate:view")
    import openpyxl
    apps = _filtered(db, current_user, job_id, status_filter, search, source, tag, rating_min, date_from, date_to)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ung vien"
    ws.append(["Mã hồ sơ", "Họ tên", "Email", "Điện thoại", "Vị trí", "Giai đoạn", "Nguồn", "Kinh nghiệm (năm)", "Đánh giá", "Ngày nộp"])
    for a in apps:
        row = [a.tracking_code, a.full_name, a.email, a.phone, a.job_posting.title if a.job_posting else "", a.status,
               a.source, a.years_of_experience, a.rating, a.created_at.strftime("%Y-%m-%d") if a.created_at else ""]
        ws.append([("'" + v) if isinstance(v, str) and v[:1] in ("=", "+", "-", "@") else v for v in row])  # formula injection guard
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    job_code = "ALL"
    if job_id:
        job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
        job_code = f"JOB{job.id}-{job.slug[:30]}" if job else f"JOB{job_id}"
    filename = f"ung-vien_{job_code}_{date.today().isoformat()}.xlsx"
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/saved-filters")
def list_saved_filters(current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    return [f.to_dict() for f in db.query(SavedFilter).filter(SavedFilter.user_id == current_user.id).order_by(SavedFilter.id).all()]


@router.post("/saved-filters", status_code=201)
def create_saved_filter(payload: SavedFilterIn, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    item = SavedFilter(user_id=current_user.id, name=payload.name, filters_json=json.dumps(payload.filters, ensure_ascii=False))
    db.add(item); db.commit(); db.refresh(item)
    return item.to_dict()


@router.delete("/saved-filters/{filter_id}")
def delete_saved_filter(filter_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    item = db.query(SavedFilter).filter(SavedFilter.id == filter_id, SavedFilter.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy bộ lọc")
    db.delete(item); db.commit()
    return {"success": True}


@router.post("/manual", status_code=201)
def add_candidate_manually(payload: ApplicationCreate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S5-08: recruiter enters a sourced candidate; goes through the same duplicate checks."""
    require_any_permission(db, current_user, "candidate:create")
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    if not (role_codes(db, current_user) & FULL_ACCESS_ROLES) and job.id not in scoped_posting_ids(db, current_user):
        raise HTTPException(status_code=403, detail="Vị trí này không thuộc phạm vi bạn phụ trách.")
    app, _ = _create_application(db, payload, job, None, None, "Recruiter nhập tay")
    _log(db, app, current_user.id, "submitted", "Recruiter thêm ứng viên thủ công")
    db.commit(); db.refresh(app)
    out = app.to_dict()
    out["possible_duplicates"] = _possible_duplicates(db, app)
    return out


@router.post("/bulk-email")
def bulk_email(payload: BulkEmailRequest, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S7-09: thank-you / rejection emails for several candidates in the same stage; preview with real data;
    duplicate rejection letters are blocked."""
    require_any_permission(db, current_user, "candidate:evaluate")
    if payload.template_code not in ("REJECT_CANDIDATE", "THANK_INTERVIEW"):
        raise HTTPException(status_code=422, detail="Chỉ hỗ trợ thư cảm ơn (THANK_INTERVIEW) hoặc thư từ chối (REJECT_CANDIDATE).")
    apps = db.query(JobApplication).filter(JobApplication.id.in_(payload.application_ids)).all()
    if len(apps) != len(set(payload.application_ids)):
        raise HTTPException(status_code=404, detail="Có hồ sơ không tồn tại")
    for app in apps:
        ensure_can_manage_application(db, current_user, app)
    if len({a.status for a in apps}) > 1:
        raise HTTPException(status_code=422, detail="Chỉ gửi hàng loạt cho các ứng viên cùng trạng thái.")
    from app.models.email_automation import EmailTemplate
    template = db.query(EmailTemplate).filter(EmailTemplate.code == payload.template_code).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email")
    results = []
    for app in apps:
        variables = {"candidate_name": app.full_name, "job_title": app.job_posting.title if app.job_posting else "",
                     "rejection_reason": payload.reason or ""}
        duplicate = payload.template_code == "REJECT_CANDIDATE" and already_sent(db, "REJECT_CANDIDATE", "APPLICATION", app.id)
        item = {"application_id": app.id, "email": app.email, "subject": render(template.subject, variables),
                "body_html": render(template.body_html, variables), "skipped_duplicate": duplicate}
        if not payload.preview_only and not duplicate:
            queue_template_email(db, payload.template_code, app.email, app.full_name, variables,
                                 related_entity="APPLICATION", related_id=app.id, force=True)
            item["queued"] = True
        results.append(item)
    if not payload.preview_only:
        db.commit()
    return {"preview_only": payload.preview_only, "items": results,
            "queued": sum(1 for r in results if r.get("queued")), "skipped_duplicates": sum(1 for r in results if r["skipped_duplicate"])}


# ------------------------------------------------------------------ single application
@router.get("/{app_id}")
def get_application(app_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_application_visible(db, current_user, app)
    if app.candidate_id == current_user.id:
        return app.candidate_view()  # S5-04: internal notes / scores never shown to the candidate
    res = app.to_dict()
    res["logs"] = [log.to_dict() for log in app.logs]
    res["interviews"] = [i.to_dict() for i in app.interviews]
    res["offer"] = app.offer.to_dict() if app.offer else None
    return res


@router.get("/{app_id}/profile")
def candidate_profile(app_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S4-09 / S5-07: unified candidate page — all applications of the same person, notes, tags, timeline."""
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    key = app.person_key or app.email
    history = db.query(JobApplication).filter(or_(JobApplication.person_key == key, JobApplication.email == app.email)).all()
    timeline = []
    for h in history:
        timeline.append({"at": h.created_at, "type": "applied", "text": f"Nộp hồ sơ vị trí {h.job_posting.title if h.job_posting else ''}", "application_id": h.id})
        for log in h.logs:
            timeline.append({"at": log.created_at, "type": "stage", "text": f"{log.from_status} → {log.to_status}: {log.comment or ''}", "application_id": h.id})
        for i in h.interviews:
            timeline.append({"at": i.scheduled_time, "type": "interview", "text": f"{i.round_name} ({i.status})", "application_id": h.id})
        for e in db.query(CandidateEvaluation).filter(CandidateEvaluation.application_id == h.id).all():
            timeline.append({"at": e.created_at, "type": "evaluation", "text": f"Phiếu đánh giá: {e.recommendation}", "application_id": h.id})
        for m in db.query(EmailLog).filter(EmailLog.related_entity == "APPLICATION", EmailLog.related_id == str(h.id)).all():
            timeline.append({"at": m.sent_at, "type": "email", "text": f"Email {m.template_code}: {m.status}", "application_id": h.id})
    timeline.sort(key=lambda t: t["at"] or datetime.min, reverse=True)
    notes = db.query(ApplicationNote).filter(ApplicationNote.application_id.in_([h.id for h in history])).order_by(ApplicationNote.id.desc()).all()
    authors = {u.id: u.full_name for u in db.query(User).filter(User.id.in_({n.author_id for n in notes} or {-1})).all()}
    return {
        "application": app.to_dict(),
        "previous_applications": [h.to_dict() for h in history if h.id != app.id],
        "notes": [n.to_dict(authors.get(n.author_id)) for n in notes],
        "timeline": [{**t, "at": t["at"].isoformat() if t["at"] else None} for t in timeline],
        "possible_duplicates": _possible_duplicates(db, app),
    }


@router.put("/{app_id}/tags")
def update_tags(app_id: int, payload: TagsUpdate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    allowed = {c.name for c in db.query(SharedCategory).filter(SharedCategory.category_type.in_(["tag", "Nhãn ứng viên"]), SharedCategory.is_active == True).all()}  # noqa: E712
    unknown = [t for t in payload.tags if allowed and t not in allowed]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Nhãn chưa được khai báo trong danh mục: {', '.join(unknown)}")
    app.tags_json = json.dumps(sorted(set(payload.tags)), ensure_ascii=False)
    if payload.rating is not None:
        app.rating = payload.rating
    db.commit(); db.refresh(app)
    return app.to_dict()


@router.get("/{app_id}/notes")
def list_notes(app_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    notes = db.query(ApplicationNote).filter(ApplicationNote.application_id == app.id).order_by(ApplicationNote.id.desc()).all()
    authors = {u.id: u.full_name for u in db.query(User).filter(User.id.in_({n.author_id for n in notes} or {-1})).all()}
    return [n.to_dict(authors.get(n.author_id)) for n in notes]


@router.post("/{app_id}/notes", status_code=201)
def add_note(app_id: int, payload: NoteCreate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    note = ApplicationNote(application_id=app.id, author_id=current_user.id, content=payload.content.strip())
    db.add(note); db.commit(); db.refresh(note)
    return note.to_dict(current_user.full_name)


@router.post("/{app_id}/email", status_code=201)
def send_direct_email(app_id: int, payload: DirectEmail, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Recruiter → candidate message, queued in the e-mail outbox (real delivery status in the e-mail log).
    The text is HTML-escaped; only staff who manage this application may send it."""
    import html as _html
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    require_any_permission(db, current_user, "candidate:evaluate")
    body_html = "<p>" + _html.escape(payload.body.strip()).replace(chr(10), "<br>") + "</p>"
    log = EmailLog(template_code="DIRECT_MESSAGE", recipient_name=app.full_name, recipient_email=app.email,
                   subject=payload.subject.strip(), body_html=body_html, status="queued", attempts=1,
                   related_entity="APPLICATION", related_id=str(app.id))
    db.add(log)
    from app.models.audit import AuditLog
    db.add(AuditLog(actor_id=current_user.id, actor_email=current_user.email, action="CANDIDATE_EMAIL",
                    target_entity="APPLICATION", target_id=str(app.id), payload_json=payload.subject.strip()[:200]))
    db.commit()
    db.refresh(log)
    return log.to_dict()


@router.get("/{app_id}/duplicates")
def list_duplicates(app_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S5-01 AC1/AC2: duplicates by email or phone, returned side by side for comparison."""
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    return {"application": app.to_dict(), "duplicates": _possible_duplicates(db, app)}


@router.post("/{app_id}/merge/{other_id}")
def merge_candidate(app_id: int, other_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S5-01 AC3: merging keeps every application (and its history); it only links them to one person."""
    require_any_permission(db, current_user, "candidate:evaluate")
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    other = db.query(JobApplication).filter(JobApplication.id == other_id).first()
    if not app or not other or app.id == other.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ để gộp")
    ensure_can_manage_application(db, current_user, app)
    ensure_can_manage_application(db, current_user, other)
    target_key = app.person_key or app.email
    old_key = other.person_key or other.email
    for row in db.query(JobApplication).filter(or_(JobApplication.person_key == old_key, JobApplication.id == other.id)).all():
        row.merged_from_key, row.merged_at, row.person_key = row.person_key or row.email, datetime.utcnow(), target_key
    db.commit()
    return {"success": True, "person_key": target_key}


@router.post("/{app_id}/unmerge")
def unmerge_candidate(app_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S5-01 AC4: a wrong merge can be undone within 24 hours."""
    require_any_permission(db, current_user, "candidate:evaluate")
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app or not app.merged_at:
        raise HTTPException(status_code=404, detail="Hồ sơ này không được gộp")
    ensure_can_manage_application(db, current_user, app)
    if datetime.utcnow() - app.merged_at > timedelta(hours=24):
        raise HTTPException(status_code=409, detail="Đã quá 24 giờ, không thể hoàn tác thao tác gộp.")
    app.person_key, app.merged_from_key, app.merged_at = app.merged_from_key, None, None
    db.commit()
    return app.to_dict()


@router.post("", status_code=201)
def submit_application(payload: ApplicationCreate, request: Request, authorization: Optional[str] = Header(None),
                       db: Session = Depends(get_db)):
    if payload.website:  # honeypot filled by bots
        raise HTTPException(status_code=422, detail="Biểu mẫu không hợp lệ.")
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_posting_id).first()
    if not job or job.status != "published":
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng đang mở")
    if job.deadline:
        try:
            if date.fromisoformat(job.deadline[:10]) < date.today():
                raise HTTPException(status_code=409, detail="Tin tuyển dụng đã hết hạn nhận hồ sơ.")
        except ValueError:
            pass
    client_ip = request.client.host if request.client else None
    applicant = _optional_user(authorization, db)
    if client_ip and not applicant:
        recent = db.query(JobApplication).filter(JobApplication.client_ip == client_ip,
                                                 JobApplication.created_at >= datetime.utcnow() - timedelta(hours=1)).count()
        if recent >= APPLICATIONS_PER_IP_PER_HOUR:
            raise HTTPException(status_code=429, detail="Bạn đã nộp quá nhiều hồ sơ trong 1 giờ. Vui lòng thử lại sau.",
                                headers={"Retry-After": "3600"})
    app, _ = _create_application(db, payload, job, applicant, client_ip, "Cổng tuyển dụng")
    db.commit()
    db.refresh(app)
    out = app.candidate_view()
    out["id"] = app.id
    return out


@router.put("/{app_id}/status")
def update_application_status(app_id: int, payload: ApplicationStatusUpdate,
                              current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "candidate:evaluate")
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Trạng thái '{payload.status}' không hợp lệ.")
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    if app.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=409, detail=f"Hồ sơ đã ở trạng thái kết thúc '{app.status}', không thể chuyển tiếp.")

    if payload.status == "rejected":
        reason = (payload.rejection_reason or "").strip()
        if not reason:
            raise HTTPException(status_code=422, detail="Loại hồ sơ bắt buộc phải nhập lý do.")
        catalog = {c.name for c in db.query(SharedCategory).filter(SharedCategory.category_type.in_(REJECTION_CATEGORY_TYPES), SharedCategory.is_active == True).all()}  # noqa: E712
        if catalog and reason not in catalog:
            raise HTTPException(status_code=422, detail="Lý do loại phải chọn từ danh mục lý do loại hồ sơ (S5-03).")
    if payload.status == "offered" and app.status != "interviewing":
        # S5-03 AC3: no skipping the interview stage unless the HR Manager confirms
        if not (payload.skip_interview_confirmed and role_codes(db, current_user) & FULL_ACCESS_ROLES):
            raise HTTPException(status_code=409, detail="Không được bỏ qua giai đoạn Phỏng vấn khi chuyển thẳng sang Đề xuất offer, trừ khi Trưởng phòng Nhân sự xác nhận.")

    old_status = app.status
    updated = db.query(JobApplication).filter(JobApplication.id == app.id, JobApplication.status == old_status).update(
        {JobApplication.status: payload.status, JobApplication.stage_entered_at: datetime.utcnow(), JobApplication.is_overdue: False},
        synchronize_session=False)
    if updated != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="Hồ sơ vừa được người khác cập nhật. Vui lòng tải lại.")
    if payload.score is not None:
        app.score = payload.score
    if payload.hr_notes is not None:
        app.hr_notes = payload.hr_notes
    if payload.rejection_reason is not None:
        app.rejection_reason = payload.rejection_reason
    db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=old_status, to_status=payload.status,
                          comment=payload.hr_notes or payload.rejection_reason or f"Chuyển trạng thái từ {old_status} sang {payload.status}"))
    if payload.status == "rejected" and payload.add_to_talent_pool:
        db.add(TalentPoolEntry(person_key=app.person_key or app.email, application_id=app.id, full_name=app.full_name,
                               email=app.email, phone=app.phone, interested_title=app.job_posting.title if app.job_posting else None,
                               skills=app.current_position, reason=payload.talent_pool_reason or payload.rejection_reason or "",
                               added_by_id=current_user.id))
    db.commit()
    db.refresh(app)
    return app.to_dict()


@router.post("/{app_id}/hiring-decision")
def hiring_decision(app_id: int, payload: HiringDecision, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S7-03 AC3/AC4: hiring manager (or HR) decides 'offer' or 'reject' (with reason); the decision is logged."""
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    if app.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=409, detail="Hồ sơ đã kết thúc.")
    if payload.decision == "offer":
        if app.status != "interviewing":
            raise HTTPException(status_code=409, detail="Chỉ quyết định đề xuất offer sau giai đoạn phỏng vấn.")
        db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status, to_status="offered",
                              comment=f"Quyết định tuyển: chuyển sang đề xuất offer. {payload.reason or ''}".strip()))
        app.status, app.stage_entered_at = "offered", datetime.utcnow()
    elif payload.decision == "reject":
        if not (payload.reason or "").strip():
            raise HTTPException(status_code=422, detail="Quyết định loại bắt buộc nhập lý do.")
        db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status, to_status="rejected",
                              comment=f"Quyết định tuyển: loại. {payload.reason}"))
        app.status, app.rejection_reason, app.stage_entered_at = "rejected", payload.reason, datetime.utcnow()
    else:
        raise HTTPException(status_code=422, detail="Quyết định chỉ nhận 'offer' hoặc 'reject'.")
    db.commit(); db.refresh(app)
    return app.to_dict()


@router.post("/{app_id}/withdraw")
def withdraw_application(app_id: int, payload: WithdrawRequest, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    if app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn chỉ có thể rút hồ sơ của chính mình.")
    withdraw(db, app, current_user.id, payload.reason)
    db.commit(); db.refresh(app)
    return app.candidate_view()


def withdraw(db: Session, app: JobApplication, actor_id: Optional[int], reason: Optional[str]) -> None:
    """Shared by the authenticated endpoint and the email-link flow (S4-06)."""
    if app.status in TERMINAL_STATUSES or app.status == "offered":
        raise HTTPException(status_code=409, detail=f"Không thể rút hồ sơ ở trạng thái '{app.status}'.")
    actor = actor_id or app.candidate_id
    if actor:
        db.add(ApplicationLog(application_id=app.id, changed_by_id=actor, from_status=app.status,
                              to_status="withdrawn", comment=reason or "Ứng viên rút hồ sơ"))
    else:  # anonymous applicant via the e-mail link: no user account to attribute the stage log to
        from app.models.audit import AuditLog
        db.add(AuditLog(actor_id=None, actor_email=app.email, action="APPLICATION_WITHDRAWN_VIA_LINK",
                        target_entity="APPLICATION", target_id=str(app.id), payload_json=f"from={app.status}"))
    app.status, app.stage_entered_at, app.withdraw_token_hash = "withdrawn", datetime.utcnow(), None
    notify(db, _assigned_recruiters(db, app), "application_withdrawn", f"{app.full_name} đã rút hồ sơ",
           app.job_posting.title if app.job_posting else "", link=f"/hr/candidates?application={app.id}",
           entity_type="APPLICATION", entity_id=app.id)
