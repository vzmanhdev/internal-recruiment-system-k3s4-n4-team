from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import uuid4

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.user import User
from app.models.headcount import RequisitionPublication
from app.models.job import JobPosting
from app.services.headcount import budget_check, reserve_budget, validate_recruiter
from app.schemas.requisition import (
    PaginatedRequisitionsResponse,
    RequisitionApprovalAction,
    RequisitionAssignment,
    RequisitionCreate,
    RequisitionResponse,
    RequisitionUpdate,
)

router = APIRouter()

ALLOWED_ROLES = {"admin", "hr_manager", "manager", "employee"}
HR_ADMIN_ROLES = {"admin", "hr_manager"}
DEPARTMENT_APPROVER_ROLES = {"admin", "manager"}

def get_current_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, ALLOWED_ROLES)

def generate_requisition_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(JobRequisition).count() + 1
    return f"REQ-{year}-{count:04d}"

@router.get("", response_model=PaginatedRequisitionsResponse)
def list_requisitions(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    department_id: Optional[int] = None,
    overdue: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    user_roles = set(current_user.role.split(","))

    query = db.query(JobRequisition)

    # Filtering based on search, status, and department
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(JobRequisition.title.ilike(term), JobRequisition.code.ilike(term)))
    
    if status_filter != "all":
        query = query.filter(JobRequisition.status == status_filter)

    if department_id:
        query = query.filter(JobRequisition.department_id == department_id)
    if overdue:
        from datetime import time, timezone, timedelta
        today = datetime.now(timezone(timedelta(hours=7))).date()
        query = query.filter(JobRequisition.deadline < datetime.combine(today, time.min), JobRequisition.status.notin_(["closed", "rejected"]))

    # Trưởng bộ phận xem các tờ trình đang chờ duyệt vòng phòng ban và các
    # tờ trình do chính họ tạo. Nhân viên chỉ xem tờ trình của mình.
    if "manager" in user_roles and not user_roles.intersection(HR_ADMIN_ROLES):
        query = query.filter(
            or_(
                JobRequisition.created_by_id == current_user.id,
                JobRequisition.status == "pending_dept",
            )
        )
    elif not user_roles.intersection(HR_ADMIN_ROLES):
        query = query.filter(JobRequisition.created_by_id == current_user.id)

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(JobRequisition.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [req.to_dict() for req in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.post("", response_model=RequisitionResponse, status_code=status.HTTP_201_CREATED)
def create_requisition(
    payload: RequisitionCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    
    initial_status = "pending_dept" if payload.submit_immediately else "draft"
    code = f"REQ-{datetime.utcnow().year}-{uuid4().hex[:10].upper()}"

    requisition = JobRequisition(
        code=code,
        title=payload.title.strip(),
        department_id=payload.department_id,
        job_title_id=payload.job_title_id,
        quantity=payload.quantity,
        reason=payload.reason,
        replacement_for=payload.replacement_for,
        min_salary=payload.min_salary,
        max_salary=payload.max_salary,
        work_location=payload.work_location,
        employment_type=payload.employment_type,
        experience_years=payload.experience_years,
        deadline=payload.deadline,
        job_description=payload.job_description,
        requirements=payload.requirements,
        benefits=payload.benefits,
        status=initial_status,
        created_by_id=current_user.id,
    )

    db.add(requisition)
    db.commit()
    db.refresh(requisition)

    # Create initial approval log
    action_type = "submit" if payload.submit_immediately else "create_draft"
    comment_text = "Tờ trình được gửi duyệt ngay khi khởi tạo" if payload.submit_immediately else "Khởi tạo bản nháp tờ trình"
    
    log = RequisitionApprovalLog(
        requisition_id=requisition.id,
        approver_id=current_user.id,
        action=action_type,
        comment=comment_text,
    )
    db.add(log)
    db.commit()
    db.refresh(requisition)

    return requisition.to_dict()

@router.get("/{requisition_id}", response_model=RequisitionResponse)
def get_requisition(
    requisition_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    requisition = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")
    
    user_roles = set(current_user.role.split(","))
    manager_can_review = "manager" in user_roles and requisition.status == "pending_dept"
    if not user_roles.intersection(HR_ADMIN_ROLES) and requisition.created_by_id != current_user.id and not manager_can_review:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem tờ trình này")

    return requisition.to_dict()

@router.put("/{requisition_id}", response_model=RequisitionResponse)
def update_requisition(
    requisition_id: int,
    payload: RequisitionUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    requisition = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")

    user_roles = set(current_user.role.split(","))
    if requisition.created_by_id != current_user.id and not user_roles.intersection(HR_ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Bạn không có quyền chỉnh sửa tờ trình này")

    if requisition.status not in ["draft", "rejected", "changes_requested"]:
        raise HTTPException(status_code=400, detail="Chỉ sửa được bản nháp, tờ trình bị từ chối hoặc cần bổ sung")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(requisition, key, value)

    requisition.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(requisition)

    return requisition.to_dict()

@router.delete("/{requisition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requisition(
    requisition_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    requisition = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")

    if requisition.status != "draft":
        raise HTTPException(status_code=400, detail="Chỉ có thể xóa tờ trình ở trạng thái Nháp")

    if requisition.created_by_id != current_user.id and "admin" not in current_user.role.split(","):
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa tờ trình này")

    db.delete(requisition)
    db.commit()

@router.post("/{requisition_id}/submit", response_model=RequisitionResponse)
def submit_requisition(
    requisition_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    requisition = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")

    if requisition.status not in ["draft", "rejected", "changes_requested"]:
        raise HTTPException(status_code=400, detail="Tờ trình đã được gửi hoặc phê duyệt trước đó")

    user_roles = set(current_user.role.split(","))
    if requisition.created_by_id != current_user.id and not user_roles.intersection(HR_ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Bạn không có quyền gửi tờ trình này")

    requisition.status = "pending_dept"
    requisition.updated_at = datetime.utcnow()

    log = RequisitionApprovalLog(
        requisition_id=requisition.id,
        approver_id=current_user.id,
        action="submit",
        comment="Gửi tờ trình lên Trưởng phòng phê duyệt",
    )
    db.add(log)
    db.commit()
    db.refresh(requisition)

    return requisition.to_dict()

@router.post("/{requisition_id}/approve", response_model=RequisitionResponse)
def approve_requisition(
    requisition_id: int,
    payload: Optional[RequisitionApprovalAction] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    requisition = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")

    user_roles = set(current_user.role.split(","))

    comment = payload.comment.strip() if payload and payload.comment else "Đã phê duyệt"

    if requisition.status == "pending_dept":
        if not user_roles.intersection(DEPARTMENT_APPROVER_ROLES):
            raise HTTPException(status_code=403, detail="Chỉ Trưởng bộ phận hoặc Admin mới có quyền duyệt vòng phòng ban")
        requisition.status = "pending_hr"
        log_action = "approve_dept"
        log_comment = f"[Trưởng phòng duyệt]: {comment}"
    elif requisition.status == "pending_hr":
        # Step 2 Approval: HR Manager or Admin
        if not user_roles.intersection(HR_ADMIN_ROLES):
            raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền duyệt vòng HR")
        override = bool(payload and payload.override_budget)
        if override and (not payload.comment or len(payload.comment.strip()) < 5):
            raise HTTPException(422, "Nhập lý do ghi đè ngân sách có ít nhất 5 ký tự.")
        reserve_budget(db, requisition, override=override)
        requisition.status = "approved"
        log_action = "approve_hr"
        log_comment = f"[HR Manager duyệt]: {comment}"
        if override:
            log_comment = f"[Ghi đè ngân sách có xác nhận]: {comment}"
    else:
        raise HTTPException(status_code=400, detail="Tờ trình không ở trạng thái chờ phê duyệt")

    requisition.updated_at = datetime.utcnow()

    log = RequisitionApprovalLog(
        requisition_id=requisition.id,
        approver_id=current_user.id,
        action=log_action,
        comment=log_comment,
    )
    db.add(log)
    db.commit()
    db.refresh(requisition)

    return requisition.to_dict()


@router.get("/{requisition_id}/budget-check")
def check_requisition_budget(requisition_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, HR_ADMIN_ROLES)
    req = db.get(JobRequisition, requisition_id)
    if not req:
        raise HTTPException(404, "Không tìm thấy tờ trình.")
    return budget_check(db, req)


@router.put("/{requisition_id}/assign", response_model=RequisitionResponse)
def assign_recruiter(requisition_id: int, payload: RequisitionAssignment, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, HR_ADMIN_ROLES)
    req = db.get(JobRequisition, requisition_id)
    if not req:
        raise HTTPException(404, "Không tìm thấy tờ trình.")
    if req.status != "approved":
        raise HTTPException(409, "Chỉ phân công nhân viên tuyển dụng cho tờ trình đã được duyệt.")
    recruiter = db.get(User, payload.recruiter_id)
    validate_recruiter(recruiter)
    if payload.support_recruiter_id == payload.recruiter_id:
        raise HTTPException(422, "Recruiter chính và hỗ trợ phải khác nhau.")
    support = db.get(User, payload.support_recruiter_id) if payload.support_recruiter_id else None
    if payload.support_recruiter_id:
        validate_recruiter(support)
    req.recruiter_id = recruiter.id
    req.support_recruiter_id = payload.support_recruiter_id
    db.add(RequisitionApprovalLog(requisition_id=req.id, approver_id=user.id, action="assign_recruiter", comment=f"Recruiter chính: {recruiter.full_name}; hỗ trợ: {support.full_name if support else 'Không có'}."))
    db.commit()
    db.refresh(req)
    return req.to_dict()


@router.post("/{requisition_id}/posting")
def create_posting_from_requisition(requisition_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, HR_ADMIN_ROLES)
    req = db.get(JobRequisition, requisition_id)
    if not req:
        raise HTTPException(404, "Không tìm thấy tờ trình.")
    if req.status != "approved":
        raise HTTPException(409, "Tờ trình phải được HR phê duyệt trước khi soạn tin.")
    validate_recruiter(db.get(User, req.recruiter_id) if req.recruiter_id else None)
    existing = db.query(JobPosting).filter_by(requisition_id=req.id).first()
    if existing:
        return existing.to_dict()
    claim = RequisitionPublication(requisition_id=req.id)
    db.add(claim)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Tờ trình đã có tin tuyển dụng. Vui lòng tải lại.")
    reserve_budget(db, req)
    job = JobPosting(code=f"JOB-{datetime.utcnow().year}-{uuid4().hex[:10].upper()}", requisition_id=req.id,
                     title=req.title, department_id=req.department_id, job_title_id=req.job_title_id,
                     quantity=req.quantity, min_salary=req.min_salary, max_salary=req.max_salary,
                     work_location=req.work_location, employment_type=req.employment_type,
                     experience_years=req.experience_years, deadline=req.deadline,
                     job_description=req.job_description, requirements=req.requirements, benefits=req.benefits,
                     status="draft", created_by_id=user.id)
    db.add(job)
    db.flush()
    claim.job_id = job.id
    db.add(RequisitionApprovalLog(requisition_id=req.id, approver_id=user.id, action="create_posting", comment=f"Tạo bản nháp tin tuyển dụng {job.code}."))
    db.commit()
    db.refresh(job)
    return job.to_dict()

@router.post("/{requisition_id}/reject", response_model=RequisitionResponse)
def reject_requisition(
    requisition_id: int,
    payload: RequisitionApprovalAction,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    requisition = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")

    if requisition.status not in ["pending_dept", "pending_hr"]:
        raise HTTPException(status_code=400, detail="Chỉ có thể từ chối tờ trình đang ở trạng thái chờ duyệt")

    user_roles = set(current_user.role.split(","))
    if requisition.status == "pending_dept" and not user_roles.intersection(DEPARTMENT_APPROVER_ROLES):
        raise HTTPException(status_code=403, detail="Chỉ Trưởng bộ phận hoặc Admin mới có quyền từ chối vòng phòng ban")
    if requisition.status == "pending_hr" and not user_roles.intersection(HR_ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền từ chối vòng HR")

    comment = (payload.comment or "").strip()
    if len(comment) < 5:
        raise HTTPException(422, "Nhập lý do từ chối có ít nhất 5 ký tự.")

    requisition.status = "rejected"
    requisition.updated_at = datetime.utcnow()

    log = RequisitionApprovalLog(
        requisition_id=requisition.id,
        approver_id=current_user.id,
        action="reject",
        comment=comment,
    )
    db.add(log)
    db.commit()
    db.refresh(requisition)

    return requisition.to_dict()


@router.post("/{requisition_id}/request-change", response_model=RequisitionResponse)
def request_change(requisition_id: int, payload: RequisitionApprovalAction, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    req = db.get(JobRequisition, requisition_id)
    if not req:
        raise HTTPException(404, "Không tìm thấy tờ trình.")
    if req.status not in ["pending_dept", "pending_hr"]:
        raise HTTPException(409, "Chỉ yêu cầu bổ sung tờ trình đang chờ duyệt.")
    user = require_roles(authorization, db, DEPARTMENT_APPROVER_ROLES if req.status == "pending_dept" else HR_ADMIN_ROLES)
    comment = (payload.comment or "").strip()
    if len(comment) < 5:
        raise HTTPException(422, "Nhập nội dung cần bổ sung có ít nhất 5 ký tự.")
    stage = req.status
    req.status = "changes_requested"
    db.add(RequisitionApprovalLog(requisition_id=req.id, approver_id=user.id, action="request_change", comment=f"[{stage}] {comment}"))
    db.commit()
    db.refresh(req)
    return req.to_dict()


@router.post("/{requisition_id}/copy", response_model=RequisitionResponse, status_code=201)
def copy_requisition(requisition_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    source = get_requisition(requisition_id, authorization, db)
    fields = RequisitionCreate.model_fields
    payload = {key: value for key, value in source.items() if key in fields and key != "deadline"}
    payload.update(title=source["title"], submit_immediately=False)
    result = create_requisition(RequisitionCreate(**payload), authorization, db)
    user = get_current_user(authorization, db)
    db.add(RequisitionApprovalLog(requisition_id=result["id"], approver_id=user.id, action="copy", comment=f"Sao chép từ {source['code']}; cần chọn lại hạn tuyển và gửi duyệt."))
    db.commit()
    return db.get(JobRequisition, result["id"]).to_dict()
