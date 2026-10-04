from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
import re

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.hr import Department
from app.core.security import decode_access_token

router = APIRouter()

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
    title: str = Field(..., example="Chuyên Viên Tuyển Dụng Nội Bộ")
    requisition_id: Optional[int] = None
    department_id: int
    department_name: str
    location: str = "Hà Nội"
    type: str = "Full-time"
    level: str = "Mid-Level"
    salary_range: str = "20 - 30 Triệu"
    experience_level: Optional[str] = "2-3 năm kinh nghiệm"
    deadline: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: str = "published"

def get_current_user(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    token = authorization.split(" ")[1]
    user_id = decode_access_token(token)
    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    return user

@router.get("")
def list_jobs(
    department: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(JobPosting)
    if status_filter:
        query = query.filter(JobPosting.status == status_filter)
    else:
        # Default to published for public portal
        query = query.filter(JobPosting.status == "published")
    if department and department != "Tất cả":
        query = query.filter(JobPosting.department_name == department)
    if location and location != "Tất cả":
        query = query.filter(JobPosting.location == location)
    if type and type != "Tất cả":
        query = query.filter(JobPosting.type == type)
    if search:
        query = query.filter(JobPosting.title.ilike(f"%{search}%"))

    jobs = query.order_by(JobPosting.created_at.desc()).all()
    return [j.to_dict() for j in jobs]

@router.get("/admin-list")
def list_all_jobs_for_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    user_roles = set(user.role.split(","))
    if not user_roles.intersection({"admin", "hr_manager", "manager"}):
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập danh sách tin tuyển dụng admin.")
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    return [j.to_dict() for j in jobs]

@router.get("/{job_id_or_slug}")
def get_job(job_id_or_slug: str, db: Session = Depends(get_db)):
    if job_id_or_slug.isdigit():
        job = db.query(JobPosting).filter(JobPosting.id == int(job_id_or_slug)).first()
    else:
        job = db.query(JobPosting).filter(JobPosting.slug == job_id_or_slug).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")
    
    # Increment view count safely
    try:
        job.views_count += 1
        db.commit()
    except Exception:
        db.rollback()

    return job.to_dict()

@router.post("", status_code=201)
def create_job(
    payload: JobPostingCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    user_roles = set(user.role.split(","))
    if not user_roles.intersection({"admin", "hr_manager"}):
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc HR Manager mới được tạo tin tuyển dụng.")
    
    base_slug = slugify(payload.title)
    slug = base_slug
    idx = 1
    while db.query(JobPosting).filter(JobPosting.slug == slug).first():
        slug = f"{base_slug}-{idx}"
        idx += 1

    try:
        job = JobPosting(
            slug=slug,
            title=payload.title,
            requisition_id=payload.requisition_id,
            department_id=payload.department_id,
            department_name=payload.department_name,
            location=payload.location,
            type=payload.type,
            level=payload.level,
            salary_range=payload.salary_range,
            experience_level=payload.experience_level,
            deadline=payload.deadline,
            description=payload.description,
            requirements=payload.requirements,
            benefits=payload.benefits,
            status=payload.status,
            created_by_id=user.id
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi đăng tin tuyển dụng: {str(e)}")

@router.put("/{job_id}")
def update_job(
    job_id: int,
    payload: JobPostingCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    user_roles = set(user.role.split(","))
    if not user_roles.intersection({"admin", "hr_manager"}):
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc HR Manager mới được cập nhật tin tuyển dụng.")
    
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    try:
        job.title = payload.title
        job.department_id = payload.department_id
        job.department_name = payload.department_name
        job.location = payload.location
        job.type = payload.type
        job.level = payload.level
        job.salary_range = payload.salary_range
        job.experience_level = payload.experience_level
        job.deadline = payload.deadline
        job.description = payload.description
        job.requirements = payload.requirements
        job.benefits = payload.benefits
        job.status = payload.status

        db.commit()
        db.refresh(job)
        return job.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật tin tuyển dụng: {str(e)}")
