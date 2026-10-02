from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.user import User
from app.schemas.requisition import (
    PaginatedRequisitionsResponse,
    RequisitionApprovalAction,
    RequisitionCreate,
    RequisitionResponse,
    RequisitionUpdate,
)

router = APIRouter()

ALLOWED_ROLES = {"admin", "hr_manager", "employee"}
HR_ADMIN_ROLES = {"admin", "hr_manager"}

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

    # Non-HR/Admin users only see requisitions they created
    if not user_roles.intersection(HR_ADMIN_ROLES):
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
    code = generate_requisition_code(db)

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
    if not user_roles.intersection(HR_ADMIN_ROLES) and requisition.created_by_id != current_user.id:
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

    if requisition.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400, detail="Chỉ có thể sửa tờ trình khi ở trạng thái Nháp hoặc Bị từ chối")

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

    if requisition.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400, detail="Tờ trình đã được gửi hoặc phê duyệt trước đó")

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
        # Step 1 Approval: Dept Lead or Admin/HR Manager
        requisition.status = "pending_hr"
        log_action = "approve_dept"
        log_comment = f"[Trưởng phòng duyệt]: {comment}"
    elif requisition.status == "pending_hr":
        # Step 2 Approval: HR Manager or Admin
        if not user_roles.intersection(HR_ADMIN_ROLES):
            raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền duyệt vòng HR")
        requisition.status = "approved"
        log_action = "approve_hr"
        log_comment = f"[HR Manager duyệt]: {comment}"
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

    comment = payload.comment.strip() if payload and payload.comment else "Từ chối phê duyệt"

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
