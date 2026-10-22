import json
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
import re

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.hr import Department
from app.models.audit import AuditLog
from app.api.deps import get_current_user_obj, authenticate_bearer
from app.services.access_scope import has_permission
from app.services.notification_service import notify
from app.core.search import build_search_filter, build_search_score

router = APIRouter()

JOB_STATES = {"draft", "pending_review", "published", "closed"}


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[àáảãạâầấẩẫậăằắẳẵặ]', 'a', text)
    text = re.sub(r'[èéẻẽẹêềếểễệ]', 'e', text)
    text = re.sub(r'[ìíỉĩị]', 'i', text)
    text = re.sub(r'[òóỏõọôồốổỗộơờớởỡợ]', 'o', text)
    text = re.sub(r'[ùúủũụưừứửữự]', 'u', text)
    text = re.sub(r'[ỳýỷỹỵ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text


class JobPostingCreate(BaseModel):
    title: str = Field(..., min_length=1, example="Chuyên Viên Tuyển Dụng Nội Bộ")
    requisition_id: int
    department_id: int
    department_name: str
    location: str = "Hà Nội"
    type: str = "Full-time"
    level: str = "Mid-Level"
    salary_range: str = "20 - 30 Triệu"
    experience_level: Optional[str] = "2-3 năm kinh nghiệm"
    deadline: Optional[str] = None
    description: str = Field(..., min_length=1)
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: str = "pending_review"
    min_years_experience: Optional[int] = Field(default=None, ge=0, le=50)
    required_skills: List[str] = Field(default_factory=list)


def _require_staff(db: Session, user: User) -> bool:
    """Managing postings needs job:manage (database permission); returns whether the user may also publish."""
    if not has_permission(db, user, "job:manage"):
        raise HTTPException(status_code=403, detail="Bạn không có quyền quản lý tin tuyển dụng.")
    return has_permission(db, user, "job:publish")


def _optional_staff(authorization: Optional[str], db: Session) -> bool:
    if not authorization:
        return False
    try:
        user, _ = authenticate_bearer(authorization, db)
    except FastAPIHTTPException:
        return False
    return has_permission(db, user, "job:manage")


def _is_expired(job: JobPosting) -> bool:
    if not job.deadline:
        return False
    try:
        return date.fromisoformat(job.deadline[:10]) < date.today()
    except ValueError:
        return False


def _out(job: JobPosting) -> dict:
    data = job.to_dict()
    try:
        skills = json.loads(job.required_skills_json) if job.required_skills_json else []
    except ValueError:
        skills = []
    data.update({"is_expired": _is_expired(job), "min_years_experience": job.min_years_experience, "required_skills": skills,
                 "openings": job.requisition.quantity if job.requisition else None})
    return data


def _requested_status(can_publish: bool, requested: str) -> str:
    if requested not in JOB_STATES:
        raise HTTPException(status_code=422, detail=f"Trạng thái tin '{requested}' không hợp lệ.")
    # S3-10: postings must be reviewed by the HR Manager before going public.
    if requested == "published" and not can_publish:
        return "pending_review"
    return requested


@router.get("")
def list_jobs(
    department: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Public job portal: only published postings are ever listed here."""
    query = db.query(JobPosting).filter(JobPosting.status == "published")
    if department and department != "Tất cả":
        query = query.filter(JobPosting.department_name == department)
    if location and location != "Tất cả":
        query = query.filter(JobPosting.location == location)
    if type and type != "Tất cả":
        query = query.filter(JobPosting.type == type)
    search_score = None
    if search and search.strip():
        search_cols = [JobPosting.title, JobPosting.description]
        query = query.filter(build_search_filter(search_cols, search.strip()))
        search_score = build_search_score(search_cols, search.strip())

    if search_score is not None:
        jobs = query.order_by(search_score.desc(), JobPosting.created_at.desc()).all()
    else:
        jobs = query.order_by(JobPosting.created_at.desc()).all()
    return [_out(j) for j in jobs if not _is_expired(j)]  # S4-01 AC4: published AND not expired


@router.get("/admin-list")
def list_all_jobs_for_admin(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    _require_staff(db, current_user)
    query = db.query(JobPosting)
    if status_filter:
        query = query.filter(JobPosting.status == status_filter)
    search_score = None
    if search and search.strip():
        search_cols = [JobPosting.title, JobPosting.description]
        query = query.filter(build_search_filter(search_cols, search.strip()))
        search_score = build_search_score(search_cols, search.strip())
    if search_score is not None:
        jobs = query.order_by(search_score.desc(), JobPosting.created_at.desc()).all()
    else:
        jobs = query.order_by(JobPosting.created_at.desc()).all()
    return [_out(j) for j in jobs]


@router.get("/{job_id_or_slug}")
def get_job(job_id_or_slug: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if job_id_or_slug.isdigit():
        job = db.query(JobPosting).filter(JobPosting.id == int(job_id_or_slug)).first()
    else:
        job = db.query(JobPosting).filter(JobPosting.slug == job_id_or_slug).first()

    # Unpublished postings are only visible to recruitment staff.
    if not job or (job.status != "published" and not _optional_staff(authorization, db)):
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    if job.status == "published":
        db.query(JobPosting).filter(JobPosting.id == job.id).update(
            {JobPosting.views_count: JobPosting.views_count + 1}, synchronize_session=False
        )
        db.commit()
        db.refresh(job)
    return _out(job)  # is_expired → the page shows a notice instead of the form (S4-02 AC3)


@router.post("", status_code=201)
def create_job(
    payload: JobPostingCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    can_publish = _require_staff(db, current_user)

    # Business Guard (S3-09): a posting can only be created from an approved requisition
    req = db.query(JobRequisition).filter(JobRequisition.id == payload.requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng được chỉ định.")
    if req.status != "approved":
        raise HTTPException(
            status_code=400,
            detail=f"Tờ trình #{req.code} đang ở trạng thái '{req.status}', chưa được phê duyệt chính thức (approved) nên không thể đăng tin tuyển dụng."
        )
    if not db.query(Department.id).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")

    if payload.deadline:
        try:
            deadline_date = date.fromisoformat(payload.deadline[:10])
            if deadline_date < date.today():
                raise HTTPException(status_code=422, detail="Hạn nộp hồ sơ không được ở quá khứ.")
        except ValueError:
            raise HTTPException(status_code=422, detail="Hạn nộp hồ sơ không đúng định dạng YYYY-MM-DD.")

    base_slug = slugify(payload.title)
    slug = base_slug
    idx = 1
    while db.query(JobPosting).filter(JobPosting.slug == slug).first():
        slug = f"{base_slug}-{idx}"
        idx += 1

    job_status = _requested_status(can_publish, payload.status)
    job = JobPosting(
        slug=slug,
        **payload.model_dump(exclude={"status", "required_skills"}),
        required_skills_json=json.dumps(payload.required_skills, ensure_ascii=False),
        status=job_status,
        created_by_id=current_user.id,
        published_by_id=current_user.id if job_status == "published" else None,
        published_at=datetime.utcnow() if job_status == "published" else None,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _out(job)


@router.put("/{job_id}")
def update_job(
    job_id: int,
    payload: JobPostingCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    can_publish = _require_staff(db, current_user)
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    if job.status == "closed":
        raise HTTPException(status_code=409, detail="Tin tuyển dụng đã đóng, không thể chỉnh sửa.")

    if payload.deadline:
        try:
            deadline_date = date.fromisoformat(payload.deadline[:10])
            if deadline_date < date.today():
                raise HTTPException(status_code=422, detail="Hạn nộp hồ sơ không được ở quá khứ.")
        except ValueError:
            raise HTTPException(status_code=422, detail="Hạn nộp hồ sơ không đúng định dạng YYYY-MM-DD.")

    for field in ("title", "department_id", "department_name", "location", "type", "level", "salary_range",
                  "experience_level", "deadline", "description", "requirements", "benefits", "min_years_experience"):
        setattr(job, field, getattr(payload, field))
    job.required_skills_json = json.dumps(payload.required_skills, ensure_ascii=False)

    new_status = _requested_status(can_publish, payload.status)
    if job.status == "published" and not can_publish:
        new_status = "pending_review"  # content changed by a recruiter must be re-reviewed
    if new_status == "published" and job.status != "published":
        job.published_by_id = current_user.id
        job.published_at = datetime.utcnow()
    job.status = new_status
    db.commit()
    db.refresh(job)
    return _out(job)


@router.post("/{job_id}/publish")
def publish_job(
    job_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    """S3-10: HR Manager reviews and publishes; publisher and timestamp are recorded."""
    if not has_permission(db, current_user, "job:publish"):
        raise HTTPException(status_code=403, detail="Chỉ Trưởng phòng Nhân sự mới được duyệt và xuất bản tin tuyển dụng.")
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    if job.status not in {"draft", "pending_review"}:
        raise HTTPException(status_code=409, detail=f"Không thể xuất bản tin ở trạng thái '{job.status}'.")
    if _is_expired(job):
        raise HTTPException(status_code=422, detail="Không thể xuất bản tin tuyển dụng đã quá hạn nộp hồ sơ.")
    req = db.query(JobRequisition).filter(JobRequisition.id == job.requisition_id).first()
    if not req or req.status != "approved":
        raise HTTPException(status_code=409, detail="Tờ trình gốc không còn ở trạng thái Đã duyệt.")
    job.status = "published"
    job.published_by_id = current_user.id
    job.published_at = datetime.utcnow()
    job.review_note = None

    # Audit log (S3-10 AC3)
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="job_posting:publish",
        target_entity="job_posting",
        target_id=str(job.id),
        payload_json=json.dumps({"title": job.title, "published_at": job.published_at.isoformat() if job.published_at else None}, ensure_ascii=False)
    ))

    # Notify author (S3-10)
    if job.created_by_id:
        notify(
            db, [job.created_by_id], "job_published",
            f"Tin tuyển dụng đã xuất bản: {job.title}",
            f"Trưởng phòng HR ({current_user.full_name}) đã phê duyệt và xuất bản tin lên Career Portal.",
            link="/recruiter/jobs", entity_type="JOB", entity_id=job.id
        )

    db.commit()
    db.refresh(job)
    return _out(job)


class ReviewRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=1000)


@router.post("/{job_id}/request-changes")
def request_job_changes(job_id: int, payload: ReviewRequest, current_user: User = Depends(get_current_user_obj),
                        db: Session = Depends(get_db)):
    """S3-10: the HR Manager sends a posting back to its author with the reason (instead of publishing)."""
    if not has_permission(db, current_user, "job:publish"):
        raise HTTPException(status_code=403, detail="Chỉ Trưởng phòng Nhân sự mới được duyệt tin tuyển dụng.")
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    if job.status != "pending_review":
        raise HTTPException(status_code=409, detail=f"Chỉ trả lại được tin đang chờ duyệt (hiện tại '{job.status}').")
    job.status, job.review_note = "draft", payload.reason.strip()

    # Audit log (S3-10)
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="job_posting:request_changes",
        target_entity="job_posting",
        target_id=str(job.id),
        payload_json=json.dumps({"title": job.title, "reason": job.review_note}, ensure_ascii=False)
    ))

    if job.created_by_id:
        notify(db, [job.created_by_id], "job_review", f"Tin tuyển dụng cần chỉnh sửa: {job.title}", job.review_note,
               link="/recruiter/jobs", entity_type="JOB", entity_id=job.id)
    db.commit()
    db.refresh(job)
    return _out(job)


@router.post("/{job_id}/close")
def close_job(
    job_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    _require_staff(db, current_user)
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    job.status = "closed"

    # Audit log (S3-10)
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="job_posting:close",
        target_entity="job_posting",
        target_id=str(job.id),
        payload_json=json.dumps({"title": job.title}, ensure_ascii=False)
    ))

    db.commit()
    db.refresh(job)
    return _out(job)
