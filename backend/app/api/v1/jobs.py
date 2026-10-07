from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.job import JobPosting
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles
from app.schemas.job import JobCreate, JobResponse

router = APIRouter()

@router.get("", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobPosting).all()
    return [j.to_dict() for j in jobs]

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    return job.to_dict()

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager", "recruiter"))
):
    job_id = f"job-{int(db.query(JobPosting).count()) + 1}"
    new_job = JobPosting(
        id=job_id,
        title=job_in.title,
        department=job_in.department,
        location=job_in.location or "Hà Nội",
        employment_type=job_in.employmentType or "Toàn thời gian",
        openings=job_in.openings or "1-2 người",
        status=job_in.status or "open",
        description=job_in.description,
        deadline=job_in.deadline
    )
    new_job.set_skills(job_in.skills or [])
    new_job.set_responsibilities(job_in.responsibilities or [])
    new_job.set_requirements(job_in.requirements or [])

    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job.to_dict()
