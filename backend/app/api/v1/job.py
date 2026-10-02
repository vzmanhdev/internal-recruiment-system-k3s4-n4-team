from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.user import User
from app.schemas.job import (
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
    PaginatedJobPostingsResponse,
)

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}

def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)

def generate_job_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(JobPosting).count() + 1
    return f"JOB-{year}-{count:04d}"

# ----------------------------------------------------------------------
# Public APIs (Accessible by Candidates / Unauthenticated Users)
# ----------------------------------------------------------------------
@router.get("", response_model=PaginatedJobPostingsResponse)
def list_public_jobs(
    search: str = "",
    department_id: Optional[int] = None,
    employment_type: Optional[str] = None,
    work_location: Optional[str] = None,
    is_featured: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(JobPosting).filter(JobPosting.status == "published")

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(JobPosting.title.ilike(term), JobPosting.code.ilike(term), JobPosting.job_description.ilike(term)))

    if department_id:
        query = query.filter(JobPosting.department_id == department_id)

    if employment_type:
        query = query.filter(JobPosting.employment_type == employment_type)

    if work_location:
        query = query.filter(JobPosting.work_location.ilike(f"%{work_location.strip()}%"))

    if is_featured is not None:
        query = query.filter(JobPosting.is_featured == is_featured)

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(JobPosting.is_featured.desc(), JobPosting.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [job.to_dict() for job in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.get("/{job_id}", response_model=JobPostingResponse)
def get_public_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job or job.status != "published":
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng hoặc tin đã hết hạn")

    # Increment view count
    job.views_count += 1
    db.commit()
    db.refresh(job)

    return job.to_dict()


# ----------------------------------------------------------------------
# Management APIs (For HR Managers & Administrators)
# ----------------------------------------------------------------------
@router.get("/manage/all", response_model=PaginatedJobPostingsResponse)
def list_manage_jobs(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    department_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    query = db.query(JobPosting)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(JobPosting.title.ilike(term), JobPosting.code.ilike(term)))

    if status_filter != "all":
        query = query.filter(JobPosting.status == status_filter)

    if department_id:
        query = query.filter(JobPosting.department_id == department_id)

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(JobPosting.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [job.to_dict() for job in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.post("", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def create_job_posting(
    payload: JobPostingCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_hr_user(authorization, db)
    
    # If created from an approved Requisition, pre-fill missing data
    if payload.requisition_id:
        req = db.query(JobRequisition).filter(JobRequisition.id == payload.requisition_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình được chỉ định")
        if req.status != "approved":
            raise HTTPException(status_code=400, detail="Chỉ có thể tạo tin tuyển dụng từ Tờ trình đã được phê duyệt (approved)")

    code = generate_job_code(db)

    job = JobPosting(
        code=code,
        requisition_id=payload.requisition_id,
        title=payload.title.strip(),
        department_id=payload.department_id,
        job_title_id=payload.job_title_id,
        quantity=payload.quantity,
        min_salary=payload.min_salary,
        max_salary=payload.max_salary,
        is_salary_negotiable=payload.is_salary_negotiable,
        work_location=payload.work_location,
        employment_type=payload.employment_type,
        experience_years=payload.experience_years,
        deadline=payload.deadline,
        is_featured=payload.is_featured,
        job_description=payload.job_description,
        requirements=payload.requirements,
        benefits=payload.benefits,
        status=payload.status,
        created_by_id=current_user.id,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job.to_dict()

@router.put("/{job_id}", response_model=JobPostingResponse)
def update_job_posting(
    job_id: int,
    payload: JobPostingUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)

    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)

    return job.to_dict()

@router.post("/{job_id}/publish", response_model=JobPostingResponse)
def publish_job_posting(
    job_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    job.status = "published"
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)

    return job.to_dict()

@router.post("/{job_id}/pause", response_model=JobPostingResponse)
def pause_job_posting(
    job_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    job.status = "paused"
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)

    return job.to_dict()

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_posting(
    job_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    db.delete(job)
    db.commit()
