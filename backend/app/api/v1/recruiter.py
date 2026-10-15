from typing import Optional, List
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.db.session import get_db
from app.models.user import User
from app.models.recruitment import JobRequisition, JobPosting, Application, InterviewSchedule, ReferralRecord
from app.schemas.recruitment import (
    JobCreateRequest,
    JobUpdateRequest,
    CandidateStageUpdateRequest,
    InterviewCreateRequest,
    ReferralStatusUpdateRequest,
    JobDraftFromRequisitionRequest,
)
from app.core.security import decode_access_token

router = APIRouter()

def require_recruiter_or_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Xác thực và phân quyền RBAC:
    Chỉ tài khoản có vai trò 'hr_manager' (Nhân sự) hoặc 'admin' mới được phép thao tác.
    Nếu không có token -> 401 Unauthorized
    Nếu vai trò không hợp lệ (ví dụ: employee, candidate) -> 403 Forbidden
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập bằng tài khoản Nhân sự hoặc Quản trị viên (Thiếu Bearer Token)."
        )
    token = authorization.split(" ")[1]
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc đã bị khóa."
        )
    
    user_roles = [r.strip() for r in user.role.split(",") if r.strip()]
    allowed = {"hr_manager", "admin", "recruiter"}
    if not any(r in allowed for r in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: Nhân sự hoặc Quản trị viên."
        )
    return user

def require_admin_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Bắt buộc quyền Quản trị viên (Admin) cho các thao tác phê duyệt cấp cao.
    """
    user = require_recruiter_or_admin(authorization, db)
    user_roles = [r.strip() for r in user.role.split(",") if r.strip()]
    if "admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Quản trị viên (Admin) mới có quyền phê duyệt hoặc từ chối bài đăng tuyển dụng."
        )
    return user

# ----------------- REQUISITIONS (YÊU CẦU TUYỂN DỤNG & CHUỖI CẤP DUYỆT) -----------------
@router.get("/requisitions")
def list_requisitions(
    status_filter: str = Query("all", alias="status"),
    department: str = "all",
    search: str = "",
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    from app.models.hr import Department

    query = db.query(JobRequisition)

    user_roles = [r.strip() for r in current_user.role.split(",") if r.strip()]
    # Story S3-06: Recruiter chỉ nhìn thấy các yêu cầu tuyển dụng được phân công
    if "recruiter" in user_roles and not any(r in {"admin", "hr_manager"} for r in user_roles):
        query = query.filter(
            or_(
                JobRequisition.recruiter_id == current_user.id,
                JobRequisition.support_recruiter_id == current_user.id,
                JobRequisition.created_by_id == current_user.id,
            )
        )

    if status_filter != "all":
        query = query.filter(JobRequisition.status == status_filter)
    if department != "all":
        query = query.join(Department, JobRequisition.department_id == Department.id, isouter=True)
        query = query.filter(Department.name == department)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.join(Department, JobRequisition.department_id == Department.id, isouter=True)
        query = query.filter(
            or_(
                JobRequisition.title.ilike(term),
                JobRequisition.code.ilike(term),
                Department.name.ilike(term),
            )
        )
    
    requisitions = query.order_by(desc(JobRequisition.created_at)).all()
    return {"items": [r.to_dict() for r in requisitions], "total": len(requisitions)}

@router.get("/requisitions/{requisition_id}")
def get_requisition(
    requisition_id: int,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    req = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tuyển dụng")
    return req.to_dict()

@router.post("/jobs/from-requisition/{requisition_id}", status_code=status.HTTP_201_CREATED)
def draft_job_from_requisition(
    requisition_id: int,
    payload: JobDraftFromRequisitionRequest,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    """
    Story S3-09: Soạn tin tuyển dụng từ một yêu cầu đã được duyệt.
    AC1: Nội dung mô tả công việc được kế thừa từ yêu cầu, sửa lại được cho phù hợp ngôn ngữ tuyển dụng.
    AC2: Khai báo địa điểm, hình thức làm việc, hạn nhận hồ sơ, có hiển thị mức lương hay không.
    AC3: Chỉ yêu cầu ở trạng thái Đã duyệt mới tạo được tin.
    """
    from datetime import datetime, timedelta
    from uuid import uuid4

    req = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tuyển dụng")
    
    # Ràng buộc cứng: AC3
    if req.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Thao tác ngoài phạm vi cho phép: Yêu cầu tuyển dụng đang ở trạng thái '{req.status}'. Chỉ yêu cầu ở trạng thái 'Đã duyệt' (approved) mới được phép soạn tin tuyển dụng."
        )

    # Kế thừa dữ liệu và cho phép tinh chỉnh (AC1, AC2)
    final_title = payload.title.strip() if payload.title and payload.title.strip() else req.title
    
    if payload.show_salary:
        if req.min_salary and req.max_salary:
            final_salary = f"{int(req.min_salary):,} - {int(req.max_salary):,} VNĐ"
        elif req.min_salary:
            final_salary = f"Từ {int(req.min_salary):,} VNĐ"
        else:
            final_salary = "Thỏa thuận"
    else:
        final_salary = "Thỏa thuận"

    final_desc = payload.description.strip() if payload.description and payload.description.strip() else (req.job_description or "")
    
    if isinstance(payload.requirements, list):
        final_reqs = "\n".join(payload.requirements)
    else:
        final_reqs = payload.requirements.strip() if payload.requirements and payload.requirements.strip() else (req.requirements or "")

    if isinstance(payload.benefits, list):
        final_benefits = "\n".join(payload.benefits)
    else:
        final_benefits = payload.benefits.strip() if payload.benefits and payload.benefits.strip() else (req.benefits or "")

    dep_id = req.department_id if req.department_id else 1
    dep_name = req.department.name if req.department else "Phòng ban"

    deadline_dt = None
    if payload.deadline:
        try:
            deadline_dt = datetime.fromisoformat(payload.deadline)
        except Exception:
            try:
                deadline_dt = datetime.strptime(payload.deadline, "%d/%m/%Y")
            except Exception:
                deadline_dt = datetime.utcnow() + timedelta(days=30)

    new_job = JobPosting(
        code=f"JOB-{datetime.utcnow().year}-{uuid4().hex[:6].upper()}",
        title=final_title,
        department_id=dep_id,
        department_name=dep_name,
        quantity=req.quantity,
        min_salary=req.min_salary,
        max_salary=req.max_salary,
        is_salary_negotiable=not payload.show_salary,
        salary_range=final_salary,
        work_location=payload.location,
        location=payload.location,
        employment_type=payload.employment_type,
        type=payload.employment_type,
        experience_years=req.experience_years,
        experience_level=req.experience_years,
        deadline=deadline_dt,
        status=payload.status,
        job_description=final_desc,
        description=final_desc,
        requirements=final_reqs,
        benefits=final_benefits,
        created_by_id=current_user.id,
        requisition_id=req.id,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    data = new_job.to_dict()
    data["applicant_count"] = 0
    return data

# ----------------- OVERVIEW & METRICS -----------------
@router.get("/overview")
def get_recruiter_overview(
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    total_jobs = db.query(JobPosting).count()
    active_jobs = db.query(JobPosting).filter(JobPosting.status != "closed").count()
    
    total_candidates = db.query(Application).count()
    new_candidates = db.query(Application).filter(Application.stage == "new").count()
    interviewing_candidates = db.query(Application).filter(Application.stage == "interview").count()
    hired_candidates = db.query(Application).filter(Application.stage == "hired").count()

    # Pipeline stages count
    stages = {
        "new": db.query(Application).filter(Application.stage == "new").count(),
        "screening": db.query(Application).filter(Application.stage == "screening").count(),
        "interview": db.query(Application).filter(Application.stage == "interview").count(),
        "offer": db.query(Application).filter(Application.stage == "offer").count(),
        "hired": db.query(Application).filter(Application.stage == "hired").count(),
        "rejected": db.query(Application).filter(Application.stage == "rejected").count(),
    }

    # Upcoming interviews
    upcoming_interviews = (
        db.query(InterviewSchedule)
        .filter(InterviewSchedule.status == "scheduled")
        .limit(5)
        .all()
    )

    # Recent candidates
    recent_candidates = (
        db.query(Application)
        .order_by(desc(Application.created_at))
        .limit(5)
        .all()
    )

    # Referral summary
    total_referrals = db.query(ReferralRecord).count()
    successful_referrals = db.query(ReferralRecord).filter(ReferralRecord.status == "hired").count()

    return {
        "metrics": {
            "active_jobs": active_jobs,
            "total_jobs": total_jobs,
            "new_applications": new_candidates,
            "interviewing": interviewing_candidates,
            "hired_count": hired_candidates,
            "total_referrals": total_referrals,
            "successful_referrals": successful_referrals,
        },
        "stages": stages,
        "upcoming_interviews": [i.to_dict() for i in upcoming_interviews],
        "recent_candidates": [c.to_dict() for c in recent_candidates],
    }

# ----------------- JOBS MANAGEMENT -----------------
@router.get("/jobs")
def list_recruiter_jobs(
    search: str = "",
    department: str = "all",
    status_filter: str = Query("all", alias="status"),
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(JobPosting)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(JobPosting.title.ilike(term), JobPosting.department.ilike(term)))
    if department != "all":
        query = query.filter(JobPosting.department == department)
    if status_filter == "approved":
        query = query.filter(JobPosting.approval_status == "approved")
    elif status_filter in ["pending", "pending_approval"]:
        query = query.filter(JobPosting.approval_status == "pending")
    elif status_filter == "rejected":
        query = query.filter(JobPosting.approval_status == "rejected")
    elif status_filter != "all":
        query = query.filter(JobPosting.status == status_filter)

    jobs = query.order_by(desc(JobPosting.created_at)).all()
    
    # Enrich with applicant counts
    results = []
    for job in jobs:
        app_count = db.query(Application).filter(Application.job_id == job.id).count()
        job_data = job.to_dict()
        job_data["applicant_count"] = app_count
        results.append(job_data)

    return {"items": results, "total": len(results)}

@router.post("/jobs", status_code=status.HTTP_201_CREATED)
def create_job_posting(
    payload: JobCreateRequest,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    user_roles = [r.strip() for r in current_user.role.split(",") if r.strip()]
    is_admin = "admin" in user_roles

    # Vấn đề 1: Kiểm tra nếu bài đăng gắn REQ (requisition_id)
    if payload.requisition_id:
        req = db.query(JobRequisition).filter(JobRequisition.id == payload.requisition_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy yêu cầu tuyển dụng #{payload.requisition_id} liên kết."
            )
        if req.status != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Thao tác bị từ chối: Yêu cầu tuyển dụng #{req.id} đang ở trạng thái '{req.status}'. Chỉ yêu cầu ở trạng thái 'Đã duyệt' (approved) mới được phép tạo tin tuyển dụng."
            )
        req.is_converted = True

    # Vấn đề 2: Người tuyển dụng không được tự ý duyệt bài đăng (chỉ admin mới có quyền duyệt)
    if is_admin:
        approval_status = payload.approval_status or "approved"
    else:
        # Nếu là Nhân sự (HR), bài đăng mới luôn ở trạng thái pending
        approval_status = "pending"
        # Nhân sự không được phép đăng bài ngay lập tức khi chưa có admin duyệt
        if payload.status in ["open", "closingSoon"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bài đăng tuyển dụng cần được Quản trị viên (Admin) phê duyệt trước khi công khai lên hệ thống."
            )

    # Bổ sung yêu cầu: bài đăng ở trạng thái duyệt thì mới đăng tin
    if payload.status in ["open", "closingSoon"] and approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bài đăng phải ở trạng thái duyệt thì mới được đăng tin tuyển dụng."
        )

    reqs = payload.requirements
    if isinstance(reqs, list):
        reqs = "\n".join(r.strip() for r in reqs if r.strip())
    bens = payload.benefits or ""
    if isinstance(bens, list):
        bens = "\n".join(b.strip() for b in bens if b.strip())

    new_job = JobPosting(
        title=payload.title,
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        openings=payload.openings,
        salary_range=payload.salary_range,
        experience_level=payload.experience_level,
        deadline=payload.deadline,
        status=payload.status,
        approval_status=approval_status,
        description=payload.description,
        requirements=reqs,
        benefits=bens,
        created_by=current_user.full_name,
        requisition_id=payload.requisition_id,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    data = new_job.to_dict()
    data["applicant_count"] = 0
    return data

@router.put("/jobs/{job_id}")
def update_job_posting(
    job_id: int,
    payload: JobUpdateRequest,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")

    user_roles = [r.strip() for r in current_user.role.split(",") if r.strip()]
    is_admin = "admin" in user_roles

    if payload.approval_status == "approved" and job.approval_status != "approved" and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Quản trị viên (Admin) mới có quyền duyệt bài đăng tuyển dụng."
        )

    target_approval = payload.approval_status if payload.approval_status is not None else job.approval_status
    target_status = payload.status if payload.status is not None else job.status

    # Tính năng đưa bài đăng về trạng thái bị từ chối hoặc chờ duyệt từ trạng thái đã duyệt:
    # Tự động gỡ đăng tin / đóng tin (status='closed') khi chuyển approval_status sang pending hoặc rejected
    if payload.approval_status in ["pending", "rejected"]:
        target_status = "closed"

    # Bổ sung yêu cầu: bài đăng ở trạng thái duyệt thì mới đăng tin
    if target_status in ["open", "closingSoon"] and target_approval != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bài đăng phải ở trạng thái duyệt thì mới được đăng tin tuyển dụng."
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "requirements" in update_data and isinstance(update_data["requirements"], list):
        update_data["requirements"] = "\n".join(r.strip() for r in update_data["requirements"] if r.strip())
    if "benefits" in update_data and isinstance(update_data["benefits"], list):
        update_data["benefits"] = "\n".join(b.strip() for b in update_data["benefits"] if b.strip())
    if payload.approval_status in ["pending", "rejected"]:
        update_data["status"] = "closed"

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    data = job.to_dict()
    data["applicant_count"] = db.query(Application).filter(Application.job_id == job.id).count()
    return data

@router.patch("/jobs/{job_id}/approve")
def approve_job_posting(
    job_id: int,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")
    job.approval_status = "approved"
    db.commit()
    db.refresh(job)

    from app.models.audit import AuditLog
    try:
        log = AuditLog(
            actor_name=current_user.full_name,
            actor_email=current_user.email,
            action="Phê duyệt bài đăng",
            target=f"#{job.id}: {job.title}",
            details=f"Đã duyệt bài đăng tuyển dụng cho phòng ban {job.department}",
            ip_address="127.0.0.1",
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")

    data = job.to_dict()
    data["applicant_count"] = db.query(Application).filter(Application.job_id == job.id).count()
    return data

@router.patch("/jobs/{job_id}/publish")
def publish_job_posting(
    job_id: int,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")
    if job.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bài đăng phải ở trạng thái duyệt thì mới được đăng tin tuyển dụng."
        )
    job.status = "open"
    db.commit()
    db.refresh(job)
    data = job.to_dict()
    data["applicant_count"] = db.query(Application).filter(Application.job_id == job.id).count()
    return data

@router.patch("/jobs/{job_id}/reject")
def reject_job_posting(
    job_id: int,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")
    job.approval_status = "rejected"
    job.status = "closed"
    db.commit()
    db.refresh(job)

    from app.models.audit import AuditLog
    try:
        log = AuditLog(
            actor_name=current_user.full_name,
            actor_email=current_user.email,
            action="Từ chối bài đăng",
            target=f"#{job.id}: {job.title}",
            details=f"Đã từ chối bài đăng tuyển dụng cho phòng ban {job.department}",
            ip_address="127.0.0.1",
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")

    data = job.to_dict()
    data["applicant_count"] = db.query(Application).filter(Application.job_id == job.id).count()
    return data

@router.patch("/jobs/{job_id}/pending")
def set_job_pending(
    job_id: int,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")
    job.approval_status = "pending"
    job.status = "closed"
    db.commit()
    db.refresh(job)
    data = job.to_dict()
    data["applicant_count"] = db.query(Application).filter(Application.job_id == job.id).count()
    return data

# ----------------- PUBLIC JOB LISTINGS (NO AUTH REQUIRED) -----------------
@router.get("/public/jobs")
def list_public_jobs(
    search: str = "",
    department: str = "",
    location: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(JobPosting).filter(
        JobPosting.approval_status == "approved",
        JobPosting.status.in_(["open", "closingSoon"])
    )
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(JobPosting.title.ilike(term), JobPosting.description.ilike(term), JobPosting.requirements.ilike(term)))
    if department.strip():
        query = query.filter(JobPosting.department == department.strip())
    if location.strip():
        query = query.filter(JobPosting.location == location.strip())
    
    jobs = query.order_by(desc(JobPosting.created_at)).all()
    return {"items": [j.to_dict() for j in jobs], "total": len(jobs)}

@router.get("/public/jobs/{job_id}")
def get_public_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(
        JobPosting.id == job_id,
        JobPosting.approval_status == "approved"
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")
    return job.to_dict()

@router.delete("/jobs/{job_id}")
def delete_job_posting(
    job_id: int,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng")
    db.delete(job)
    db.commit()
    return {"message": "Đã xóa tin tuyển dụng thành công"}

# ----------------- CANDIDATES / ATS -----------------
@router.get("/candidates")
def list_candidates(
    job_id: Optional[int] = None,
    stage: str = "all",
    search: str = "",
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if job_id:
        query = query.filter(Application.job_id == job_id)
    if stage != "all":
        query = query.filter(Application.stage == stage)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Application.candidate_name.ilike(term),
                Application.candidate_email.ilike(term),
                Application.candidate_phone.ilike(term),
            )
        )

    candidates = query.order_by(desc(Application.created_at)).all()
    
    # Attach job info
    result = []
    job_map = {j.id: j.title for j in db.query(JobPosting).all()}
    for c in candidates:
        c_dict = c.to_dict()
        c_dict["job_title"] = job_map.get(c.job_id, f"Vị trí #{c.job_id}")
        result.append(c_dict)

    return {"items": result, "total": len(result)}

@router.patch("/candidates/{candidate_id}/stage")
def update_candidate_stage(
    candidate_id: int,
    payload: CandidateStageUpdateRequest,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    candidate = db.query(Application).filter(Application.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng viên")

    candidate.stage = payload.stage
    if payload.rating is not None:
        candidate.rating = payload.rating
    if payload.hr_notes is not None:
        candidate.hr_notes = payload.hr_notes

    db.commit()
    db.refresh(candidate)
    
    c_dict = candidate.to_dict()
    job = db.query(JobPosting).filter(JobPosting.id == candidate.job_id).first()
    c_dict["job_title"] = job.title if job else ""
    return c_dict

# ----------------- INTERVIEWS -----------------
@router.get("/interviews")
def list_interviews(
    status_filter: str = Query("all", alias="status"),
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(InterviewSchedule)
    if status_filter != "all":
        query = query.filter(InterviewSchedule.status == status_filter)
    
    interviews = query.order_by(desc(InterviewSchedule.id)).all()
    return {"items": [i.to_dict() for i in interviews], "total": len(interviews)}

@router.post("/interviews", status_code=status.HTTP_201_CREATED)
def schedule_interview(
    payload: InterviewCreateRequest,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    interview = InterviewSchedule(
        application_id=payload.application_id,
        candidate_name=payload.candidate_name,
        job_title=payload.job_title,
        interview_date=payload.interview_date,
        interview_time=payload.interview_time,
        format=payload.format,
        location_or_link=payload.location_or_link,
        interviewer_names=payload.interviewer_names,
        round_name=payload.round_name,
        status="scheduled",
    )
    db.add(interview)
    
    # Also update application stage to 'interview'
    app = db.query(Application).filter(Application.id == payload.application_id).first()
    if app and app.stage not in ["offer", "hired"]:
        app.stage = "interview"

    db.commit()
    db.refresh(interview)
    return interview.to_dict()

# ----------------- REFERRALS -----------------
@router.get("/referrals")
def list_referrals(
    status_filter: str = Query("all", alias="status"),
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ReferralRecord)
    if status_filter != "all":
        query = query.filter(ReferralRecord.status == status_filter)
    
    records = query.order_by(desc(ReferralRecord.created_at)).all()
    return {"items": [r.to_dict() for r in records], "total": len(records)}

@router.patch("/referrals/{referral_id}")
def update_referral(
    referral_id: int,
    payload: ReferralStatusUpdateRequest,
    current_user: User = Depends(require_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    record = db.query(ReferralRecord).filter(ReferralRecord.id == referral_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi giới thiệu")
    
    record.status = payload.status
    if payload.bonus_status:
        record.bonus_status = payload.bonus_status
    if payload.notes:
        record.notes = payload.notes

    db.commit()
    db.refresh(record)
    return record.to_dict()
