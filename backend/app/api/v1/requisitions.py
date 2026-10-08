from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.hr import Department
from app.core.security import decode_access_token
from app.api.v1.auth import require_roles

router = APIRouter()

class RequisitionCreate(BaseModel):
    title: str = Field(..., example="Kỹ Sư Backend Senior (Python/FastAPI)")
    department_id: int = Field(..., example=1)
    job_title_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    headcount: Optional[int] = None
    reason: str = Field(default="replacement") # replacement, expansion, seasonal
    reason_detail: Optional[str] = None
    priority: str = Field(default="medium") # low, medium, high, urgent
    employment_type: str = Field(default="Full-time")
    work_location: str = Field(default="Hà Nội")
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    proposed_min_salary: Optional[int] = None
    proposed_max_salary: Optional[int] = None
    is_salary_negotiable: bool = False
    target_onboard_date: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None

class RequisitionApprovalAction(BaseModel):
    action: str = Field(..., example="approved") # approved, rejected
    comment: Optional[str] = None

def get_current_user(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    token = authorization.split(" ")[1]
    user_id = decode_access_token(token, db=db)
    if not user_id:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin người dùng")
    return user

@router.get("")
def list_requisitions(
    status_filter: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr", "recruiter", "hiring_manager", "manager", "approver"})
    query = db.query(JobRequisition)
    if status_filter:
        query = query.filter(JobRequisition.status == status_filter)
    reqs = query.order_by(JobRequisition.created_at.desc()).all()
    return [r.to_dict() for r in reqs]

@router.get("/{req_id}")
def get_requisition(req_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr", "recruiter", "hiring_manager", "manager", "approver"})
    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")
    res = req.to_dict()
    res["approval_logs"] = [log.to_dict() for log in req.approval_logs]
    return res

@router.post("", status_code=201)
def create_requisition(
    payload: RequisitionCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = require_roles(authorization, db, allowed_roles={"hiring_manager", "manager", "hr_manager", "hr", "recruiter", "admin"})
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")

    min_sal = payload.min_salary if payload.min_salary is not None else payload.proposed_min_salary
    max_sal = payload.max_salary if payload.max_salary is not None else payload.proposed_max_salary
    effective_qty = payload.quantity if payload.headcount is None else payload.headcount

    # S2-05 AC: Kiểm soát mức lương đề xuất nằm trong khung công ty đã duyệt
    from app.models.hr import JobTitle
    job_title = None
    if payload.job_title_id:
        job_title = db.query(JobTitle).filter(JobTitle.id == payload.job_title_id).first()
        if not job_title or not job_title.is_active:
            raise HTTPException(status_code=400, detail="Job title does not exist or is inactive")
    else:
        job_title = db.query(JobTitle).filter(
            JobTitle.name.ilike(payload.title.strip()),
            JobTitle.department_id == payload.department_id,
            JobTitle.is_active.is_(True),
        ).first()
        if not job_title:
            job_title = db.query(JobTitle).filter(
                JobTitle.name.ilike(payload.title.strip()),
                JobTitle.is_active.is_(True),
            ).first()
    if (min_sal is not None or max_sal is not None) and not job_title:
        raise HTTPException(status_code=400, detail="Select an active job title with an approved company salary band")

    if job_title and (min_sal is not None or max_sal is not None):
        if min_sal is not None and min_sal > job_title.max_salary:
            raise HTTPException(status_code=400, detail="Proposed minimum salary exceeds the approved job-title salary band")
        if max_sal is not None and max_sal < job_title.min_salary:
            raise HTTPException(status_code=400, detail="Proposed maximum salary is below the approved job-title salary band")
        if min_sal is not None and min_sal < job_title.min_salary:
            raise HTTPException(
                status_code=400,
                detail=f"Mức lương tối thiểu đề xuất ({min_sal:,.0f} đ) thấp hơn khung công ty đã duyệt ({job_title.min_salary:,.0f} đ) của chức danh '{job_title.name}'."
            )
        if min_sal is not None and max_sal is not None and min_sal > max_sal:
            raise HTTPException(status_code=400, detail="Mức lương tối thiểu không được lớn hơn mức tối đa")
        if max_sal is not None and max_sal > job_title.max_salary:
            raise HTTPException(
                status_code=400,
                detail=f"Mức lương tối đa đề xuất ({max_sal:,.0f} đ) vượt quá khung công ty đã duyệt ({job_title.max_salary:,.0f} đ) của chức danh '{job_title.name}'. Vui lòng điều chỉnh hoặc yêu cầu phê duyệt ngoại lệ."
            )

    code_seq = db.query(JobRequisition).count() + 1
    code = f"REQ-2026-{code_seq:03d}"

    try:
        req = JobRequisition(
            code=code,
            title=payload.title,
            department_id=payload.department_id,
            job_title_id=job_title.id if job_title else payload.job_title_id,
            job_title_name=job_title.name if job_title else payload.title,
            quantity=effective_qty,
            reason=payload.reason,
            reason_detail=payload.reason_detail,
            priority=payload.priority,
            employment_type=payload.employment_type,
            work_location=payload.work_location,
            min_salary=min_sal,
            max_salary=max_sal,
            is_salary_negotiable=payload.is_salary_negotiable,
            target_onboard_date=payload.target_onboard_date,
            job_description=payload.job_description,
            requirements=payload.requirements,
            benefits=payload.benefits,
            status="pending_manager",
            current_approval_step="manager",
            created_by_id=user.id
        )
        db.add(req)
        db.flush()

        log = RequisitionApprovalLog(
            requisition_id=req.id,
            approver_id=user.id,
            step_name="Tạo mới tờ trình",
            action="submitted",
            comment="Đã khởi tạo tờ trình tuyển dụng và gửi trình duyệt"
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
        raise HTTPException(status_code=500, detail=f"Lỗi khi khởi tạo tờ trình: {str(e)}")

@router.post("/{req_id}/approve")
def approve_requisition(
    req_id: int,
    payload: RequisitionApprovalAction,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    user_roles = set([r.strip().lower() for r in (user.role or "").split(",") if r.strip()])

    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")

    # Workflow state machine validation
    if req.status in ["approved", "rejected", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail=f"Tờ trình đã ở trạng thái '{req.status}', không thể thực hiện phê duyệt lại."
        )

    # RBAC check: Manager/Hiring Manager/Admin for pending_manager; HR/HR Manager/Admin for pending_hr
    if req.status == "pending_manager" and not (user_roles.intersection({"manager", "hiring_manager", "admin"})):
        raise HTTPException(status_code=403, detail="Chỉ Trưởng bộ phận hoặc Quản trị viên mới có quyền duyệt cấp 1.")
    
    if req.status == "pending_hr" and not (user_roles.intersection({"hr_manager", "hr", "admin"})):
        raise HTTPException(status_code=403, detail="Chỉ Trưởng phòng Nhân sự hoặc Quản trị viên mới có quyền duyệt thẩm định cấp 2.")

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
            approver_id=user.id,
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
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
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
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    user_roles = set(user.role.split(","))
    if not user_roles.intersection({"hr_manager", "admin"}):
        raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền xác nhận ghi đè Headcount.")

    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")

    log = RequisitionApprovalLog(
        requisition_id=req.id,
        approver_id=user.id,
        step_name="Xác nhận Ghi Đè Headcount",
        action="headcount_override",
        comment=f"HR Manager đã phê duyệt ghi đè chỉ tiêu Headcount. Lý do: {payload.reason}"
    )
    db.add(log)
    db.commit()
    return {"success": True, "message": "Đã xác nhận ghi đè chỉ tiêu Headcount thành công."}
