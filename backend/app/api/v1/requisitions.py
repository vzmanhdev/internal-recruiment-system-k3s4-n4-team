from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.hr import Department
from app.api.deps import get_current_user_obj, require_permission
from app.services.rbac_service import get_user_roles, get_effective_permissions
from app.models.audit import AuditLog

router = APIRouter()

class RequisitionCreate(BaseModel):
    title: str = Field(..., example="Kỹ Sư Backend Senior (Python/FastAPI)")
    department_id: int = Field(..., example=1)
    quantity: int = Field(default=1, ge=1)
    reason: str = Field(default="replacement") # replacement, expansion, seasonal
    reason_detail: Optional[str] = None
    priority: str = Field(default="medium") # low, medium, high, urgent
    employment_type: str = Field(default="Full-time")
    work_location: str = Field(default="Hà Nội")
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    is_salary_negotiable: bool = False
    target_onboard_date: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None

class RequisitionApprovalAction(BaseModel):
    action: str = Field(..., example="approved") # approved, rejected
    comment: Optional[str] = None

@router.get("")
def list_requisitions(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    query = db.query(JobRequisition)
    if status_filter:
        query = query.filter(JobRequisition.status == status_filter)
    reqs = query.order_by(JobRequisition.created_at.desc()).all()
    return [r.to_dict() for r in reqs]

@router.get("/{req_id}")
def get_requisition(
    req_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")
    res = req.to_dict()
    res["approval_logs"] = [log.to_dict() for log in req.approval_logs]
    return res

@router.post("", status_code=201)
def create_requisition(
    payload: RequisitionCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")

    code_seq = db.query(JobRequisition).count() + 1
    code = f"REQ-2026-{code_seq:03d}"

    try:
        req = JobRequisition(
            code=code,
            title=payload.title,
            department_id=payload.department_id,
            quantity=payload.quantity,
            reason=payload.reason,
            reason_detail=payload.reason_detail,
            priority=payload.priority,
            employment_type=payload.employment_type,
            work_location=payload.work_location,
            min_salary=payload.min_salary,
            max_salary=payload.max_salary,
            is_salary_negotiable=payload.is_salary_negotiable,
            target_onboard_date=payload.target_onboard_date,
            job_description=payload.job_description,
            requirements=payload.requirements,
            benefits=payload.benefits,
            status="pending_manager",
            current_approval_step="manager",
            created_by_id=current_user.id
        )
        db.add(req)
        db.flush()

        log = RequisitionApprovalLog(
            requisition_id=req.id,
            approver_id=current_user.id,
            step_name="Tạo mới tờ trình",
            action="submitted",
            comment="Đã khởi tạo tờ trình tuyển dụng và gửi trình duyệt"
        )
        db.add(log)
        db.commit()
        db.refresh(req)
        return req.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi khởi tạo tờ trình: {str(e)}")

@router.post("/{req_id}/approve")
def approve_requisition(
    req_id: int,
    payload: RequisitionApprovalAction,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(db, current_user)
    role_codes = {r["code"] for r in roles}
    effective_perms = set(get_effective_permissions(db, current_user))

    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")

    # Workflow state machine validation
    if req.status in ["approved", "rejected", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail=f"Tờ trình đã ở trạng thái '{req.status}', không thể thực hiện phê duyệt lại."
        )

    # RBAC check: Manager/Hiring Manager/Admin for pending_manager, HR Manager/Admin for pending_hr
    has_approve_perm = "requisition:approve" in effective_perms or "admin" in role_codes

    if req.status == "pending_manager":
        is_allowed = "admin" in role_codes or "hiring_manager" in role_codes or "manager" in role_codes or has_approve_perm
        if not is_allowed:
            raise HTTPException(status_code=403, detail="Chỉ Trưởng bộ phận hoặc Admin mới có quyền duyệt cấp 1.")
    elif req.status == "pending_hr":
        is_allowed = "admin" in role_codes or "hr_manager" in role_codes or has_approve_perm
        if not is_allowed:
            raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền duyệt thẩm định cấp 2.")

    try:
        if payload.action == "approved":
            if req.status == "pending_manager":
                req.status = "pending_hr"
                req.current_approval_step = "hr"
                step_name = "Trưởng Khối Duyệt"
            elif req.status == "pending_hr":
                req.status = "approved"
                req.current_approval_step = "completed"
                step_name = "HR Manager Phê Duyệt"
            else:
                req.status = "approved"
                req.current_approval_step = "completed"
                step_name = "Phê Duyệt Tờ Trình"
        elif payload.action == "rejected":
            req.status = "rejected"
            req.reject_reason = payload.comment
            step_name = "Từ chối phê duyệt"
        else:
            raise HTTPException(status_code=400, detail="Thao tác action không hợp lệ (chỉ chấp nhận 'approved' hoặc 'rejected')")

        log = RequisitionApprovalLog(
            requisition_id=req.id,
            approver_id=current_user.id,
            step_name=step_name,
            action=payload.action,
            comment=payload.comment
        )
        db.add(log)
        db.commit()
        db.refresh(req)
        return req.to_dict()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi cập nhật tờ trình: {str(e)}")

# Phân công Recruiter (S3-06)
class RecruiterAssignRequest(BaseModel):
    recruiter_id: int
    assignment_type: str = "primary" # primary (chính), secondary (hỗ trợ)

@router.post("/{req_id}/assign-recruiters")
def assign_recruiter(
    req_id: int,
    payload: RecruiterAssignRequest,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")

    from app.models.hr import RecruiterAssignment
    assignment = RecruiterAssignment(
        requisition_id=req.id,
        recruiter_id=payload.recruiter_id,
        assignment_type=payload.assignment_type
    )
    db.add(assignment)
    db.commit()
    return {"success": True, "message": f"Đã phân công Recruiter ID {payload.recruiter_id} ({payload.assignment_type}) cho tờ trình {req.code}."}

# Ghi đè Headcount khi vượt chỉ tiêu (S3-04 Override)
class HeadcountOverrideRequest(BaseModel):
    reason: str

@router.post("/{req_id}/headcount-override")
def override_headcount(
    req_id: int,
    payload: HeadcountOverrideRequest,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(db, current_user)
    role_codes = {r["code"] for r in roles}
    effective_perms = set(get_effective_permissions(db, current_user))

    is_allowed = "admin" in role_codes or "hr_manager" in role_codes or "requisition:override_headcount" in effective_perms
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền xác nhận ghi đè Headcount.")

    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")

    log = RequisitionApprovalLog(
        requisition_id=req.id,
        approver_id=current_user.id,
        step_name="Xác nhận Ghi Đè Headcount",
        action="headcount_override",
        comment=f"HR Manager đã phê duyệt ghi đè chỉ tiêu Headcount. Lý do: {payload.reason}"
    )
    db.add(log)
    db.commit()
    return {"success": True, "message": "Đã xác nhận ghi đè chỉ tiêu Headcount thành công."}
