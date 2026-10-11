import json
from datetime import date, datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, model_validator

from app.db.session import get_db
from app.models.user import User
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.hr import ApprovalFlow, Department, JobTitle, RecruiterAssignment
from app.services.headcount_service import headcount_status
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.api.deps import get_current_user_obj, require_permission, require_roles_dep
from app.services.rbac_service import get_user_roles, get_effective_permissions
from app.models.audit import AuditLog
from app.services.notification_service import notify, users_with_roles

router = APIRouter()

# Workflow states
DRAFT_STATES = {"draft", "changes_requested"}
PENDING_STATES = {"pending_manager", "pending_hr", "pending_executive"}
STEP_LABELS = {"manager": "Trưởng Khối Duyệt", "hr": "HR Manager Phê Duyệt", "executive": "Ban Giám Đốc Phê Duyệt"}
STEP_NOTIFY_ROLES = {"manager": ["approver"], "hr": ["hr_manager"], "executive": ["approver"]}
TERMINAL_STATES = {"approved", "rejected", "cancelled", "filled", "paused"}
CLOSE_TARGETS = {"filled": "Đã tuyển đủ", "paused": "Tạm dừng", "cancelled": "Huỷ"}
ACTIVE_APPLICATION_STATES = {"submitted", "screening", "interview", "interviewing", "offer", "offered"}


class RequisitionCreate(BaseModel):
    title: str = Field(..., min_length=1, example="Kỹ Sư Backend Senior (Python/FastAPI)")
    department_id: int = Field(..., example=1)
    quantity: int = Field(default=1, ge=1)
    reason: str = Field(default="replacement")  # replacement, expansion, seasonal
    reason_detail: Optional[str] = None
    priority: str = Field(default="medium")  # low, medium, high, urgent
    employment_type: str = Field(default="Full-time")
    work_location: str = Field(default="Hà Nội")
    min_salary: Optional[int] = Field(default=None, ge=0)
    max_salary: Optional[int] = Field(default=None, ge=0)
    is_salary_negotiable: bool = False
    target_onboard_date: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_title_id: Optional[int] = None
    salary_justification: Optional[str] = None
    save_as_draft: bool = False

    @model_validator(mode="after")
    def _validate_business_fields(self):
        if self.min_salary is not None and self.max_salary is not None and self.min_salary > self.max_salary:
            raise ValueError("Mức lương tối thiểu không được lớn hơn mức lương tối đa.")
        if self.target_onboard_date:
            try:
                target = date.fromisoformat(self.target_onboard_date[:10])
            except ValueError:
                raise ValueError("Ngày cần người không đúng định dạng YYYY-MM-DD.")
            if target < date.today():
                raise ValueError("Ngày cần người không được ở quá khứ.")
        return self


class RequisitionApprovalAction(BaseModel):
    action: str = Field(..., example="approved")  # approved, rejected, changes_requested
    comment: Optional[str] = None


class RecruiterAssignRequest(BaseModel):
    recruiter_id: int
    assignment_type: str = "primary"  # primary (chính), secondary (hỗ trợ)


class HeadcountOverrideRequest(BaseModel):
    reason: str = Field(..., min_length=1)


class RequisitionCloseRequest(BaseModel):
    status: str = Field(..., example="filled")  # filled, paused, cancelled
    reason: str = Field(..., min_length=1)
    confirm_active_candidates: bool = False


def _role_codes(db: Session, user: User) -> set:
    return {r["code"] for r in get_user_roles(db, user)}


def _can_view_all(db: Session, user: User) -> bool:
    roles = _role_codes(db, user)
    if roles & {"admin", "hr_manager"}:
        return True
    return "requisition:approve" in set(get_effective_permissions(db, user))


def _assigned_requisition_ids(db: Session, user: User) -> set:
    rows = db.query(RecruiterAssignment.requisition_id).filter(RecruiterAssignment.recruiter_id == user.id).all()
    return {r[0] for r in rows}


def _ensure_visible(db: Session, user: User, req: JobRequisition) -> None:
    if _can_view_all(db, user) or req.created_by_id == user.id or req.id in _assigned_requisition_ids(db, user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "PERMISSION_DENIED", "message": "Bạn không có quyền truy cập yêu cầu tuyển dụng này."},
    )


def _get_or_404(db: Session, req_id: int) -> JobRequisition:
    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình tuyển dụng")
    return req


def _audit(db: Session, actor: User, action: str, req: JobRequisition, details: dict) -> None:
    db.add(AuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        action=action,
        target_entity="REQUISITION",
        target_id=str(req.id),
        payload_json=json.dumps(details, ensure_ascii=False),
    ))


def _transition(db: Session, req: JobRequisition, from_status: str, values: dict) -> None:
    """Atomic compare-and-set on the workflow status so two concurrent decisions cannot both apply."""
    values = dict(values, updated_at=datetime.utcnow())
    updated = (
        db.query(JobRequisition)
        .filter(JobRequisition.id == req.id, JobRequisition.status == from_status)
        .update(values, synchronize_session=False)
    )
    if updated != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tờ trình vừa được người khác xử lý. Vui lòng tải lại để xem trạng thái mới nhất.",
        )


def resolve_approval_chain(db: Session, req: JobRequisition) -> list:
    """S3-01: pick the active flow for the department and proposed salary; department-specific flows win,
    then the flow with the highest matching salary threshold (so higher salaries escalate automatically)."""
    salary = req.max_salary or req.min_salary or 0
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.status == "active").all()
    matching = [f for f in flows
                if (f.department_id in (None, req.department_id))
                and (f.min_salary_threshold or 0) <= salary < (f.max_salary_threshold or float("inf"))]
    if not matching:
        return ["manager", "hr"]
    matching.sort(key=lambda f: (f.department_id is not None, f.min_salary_threshold or 0), reverse=True)
    return matching[0].steps()


def _enter_approval(db: Session, req: JobRequisition, from_status: Optional[str]) -> str:
    """Snapshot the chain and move to its first pending step."""
    chain = resolve_approval_chain(db, req)
    values = {"status": f"pending_{chain[0]}", "current_approval_step": chain[0],
              "approval_chain_json": json.dumps(chain), "approval_step_index": 0, "reject_reason": None}
    if from_status is None:
        for k, v in values.items():
            setattr(req, k, v)
    else:
        _transition(db, req, from_status, values)
    return values["status"]


def _check_headcount(db: Session, req: JobRequisition) -> None:
    """S3-04 AC3: exceeding the department budget blocks submission unless the HR Manager confirmed an override."""
    if req.headcount_overridden:
        return
    st = headcount_status(db, req.department_id, exclude_requisition_id=req.id)
    if st["has_budget"] and st["remaining"] < req.quantity:
        raise HTTPException(
            status_code=409,
            detail={"code": "HEADCOUNT_EXCEEDED",
                    "message": f"Vượt chỉ tiêu headcount của phòng ban (còn {max(st['remaining'], 0)}, yêu cầu {req.quantity}). "
                               "Cần Trưởng phòng Nhân sự xác nhận ghi đè kèm lý do.",
                    "remaining": st["remaining"], "budget": st["budget"]},
        )


def _check_salary_band(db: Session, payload) -> None:
    """S2-10 AC3: a proposed range outside the job title's standard band needs a justification."""
    if not payload.job_title_id:
        return
    title = db.query(JobTitle).filter(JobTitle.id == payload.job_title_id).first()
    if not title:
        raise HTTPException(status_code=422, detail="Chức danh không tồn tại")
    low = payload.min_salary if payload.min_salary is not None else payload.max_salary
    high = payload.max_salary if payload.max_salary is not None else payload.min_salary
    outside = (low is not None and low < title.min_salary) or (high is not None and high > title.max_salary)
    if outside and not (payload.salary_justification or "").strip():
        raise HTTPException(status_code=422, detail="Dải lương đề xuất nằm ngoài dải chuẩn của chức danh — bắt buộc nhập giải trình.")


def _notify_pending(db: Session, req: JobRequisition, status_value: str, actor_id: int) -> None:
    approver_roles = STEP_NOTIFY_ROLES.get(status_value.replace("pending_", "", 1)) if status_value.startswith("pending_") else None
    if approver_roles:
        notify(db, users_with_roles(db, approver_roles, exclude_user_id=actor_id), "approval_pending",
               f"Tờ trình {req.code} chờ bạn duyệt", req.title, link=f"/hr/approvals?requisition={req.id}",
               entity_type="REQUISITION", entity_id=req.id)


def _next_code(db: Session) -> str:
    year = datetime.utcnow().year
    seq = db.query(JobRequisition).count() + 1
    code = f"REQ-{year}-{seq:03d}"
    while db.query(JobRequisition.id).filter(JobRequisition.code == code).first():
        seq += 1
        code = f"REQ-{year}-{seq:03d}"
    return code


@router.get("")
def list_requisitions(
    status_filter: Optional[str] = None,
    department_id: Optional[int] = None,
    recruiter_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    overdue_only: bool = False,
    current_user: User = Depends(require_permission("requisition:view")),
    db: Session = Depends(get_db)
):
    query = db.query(JobRequisition)
    if not _can_view_all(db, current_user):
        assigned = _assigned_requisition_ids(db, current_user)
        query = query.filter(
            (JobRequisition.created_by_id == current_user.id) | (JobRequisition.id.in_(assigned or {-1}))
        )
    if status_filter:
        query = query.filter(JobRequisition.status == status_filter)
    if department_id:
        query = query.filter(JobRequisition.department_id == department_id)
    if recruiter_id:
        req_ids = [r[0] for r in db.query(RecruiterAssignment.requisition_id).filter(RecruiterAssignment.recruiter_id == recruiter_id).all()]
        query = query.filter(JobRequisition.id.in_(req_ids or [-1]))
    if date_from:
        query = query.filter(JobRequisition.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(JobRequisition.created_at <= datetime.combine(date_to, datetime.max.time()))
    rows = query.order_by(JobRequisition.created_at.desc()).all()
    # S3-06: show who is in charge; one query for all assignments on the page.
    assigned = {}
    if rows:
        for a, name in (db.query(RecruiterAssignment, User.full_name)
                        .join(User, User.id == RecruiterAssignment.recruiter_id)
                        .filter(RecruiterAssignment.requisition_id.in_([r.id for r in rows])).all()):
            assigned.setdefault(a.requisition_id, []).append(
                {"recruiter_id": a.recruiter_id, "full_name": name, "assignment_type": a.assignment_type})
    reqs = [r.to_dict() | {"recruiters": assigned.get(r.id, [])} for r in rows]
    if overdue_only:
        reqs = [r for r in reqs if r["is_overdue"]]
    return reqs


@router.get("/{req_id}")
def get_requisition(
    req_id: int,
    current_user: User = Depends(require_permission("requisition:view")),
    db: Session = Depends(get_db)
):
    req = _get_or_404(db, req_id)
    _ensure_visible(db, current_user, req)
    res = req.to_dict()
    res["approval_logs"] = [log.to_dict() for log in req.approval_logs]
    res["recruiter_assignments"] = [
        a.to_dict() for a in db.query(RecruiterAssignment).filter(RecruiterAssignment.requisition_id == req.id).all()
    ]
    return res


@router.post("", status_code=201)
def create_requisition(
    payload: RequisitionCreate,
    current_user: User = Depends(require_permission("requisition:create")),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")

    _check_salary_band(db, payload)
    data = payload.model_dump(exclude={"save_as_draft"})
    if payload.job_title_id:
        data["job_title_name"] = db.query(JobTitle.name).filter(JobTitle.id == payload.job_title_id).scalar()
    req = JobRequisition(
        code=_next_code(db),
        **data,
        status="draft",
        current_approval_step="draft",
        created_by_id=current_user.id,
    )
    if not payload.save_as_draft:
        _check_headcount(db, req)
        _enter_approval(db, req, None)
    initial_status = req.status
    db.add(req)
    try:
        db.flush()
        if not payload.save_as_draft:
            db.add(RequisitionApprovalLog(
                requisition_id=req.id,
                approver_id=current_user.id,
                step_name="Tạo mới tờ trình",
                action="submitted",
                comment="Đã khởi tạo tờ trình tuyển dụng và gửi trình duyệt",
            ))
        _audit(db, current_user, "REQUISITION_CREATE", req, {"status": initial_status, "code": req.code})
        _notify_pending(db, req, initial_status, current_user.id)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Mã tờ trình bị trùng do thao tác đồng thời. Vui lòng thử lại.")
    db.refresh(req)
    return req.to_dict()


@router.put("/{req_id}")
def update_requisition(
    req_id: int,
    payload: RequisitionCreate,
    current_user: User = Depends(require_permission("requisition:edit")),
    db: Session = Depends(get_db)
):
    req = _get_or_404(db, req_id)
    if req.created_by_id != current_user.id and not (_role_codes(db, current_user) & {"admin", "hr_manager"}):
        raise HTTPException(status_code=403, detail="Chỉ người tạo tờ trình mới được chỉnh sửa.")
    if req.status not in DRAFT_STATES:
        raise HTTPException(status_code=409, detail=f"Chỉ sửa được tờ trình ở trạng thái Nháp hoặc Yêu cầu bổ sung (hiện tại: '{req.status}').")
    if not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    _check_salary_band(db, payload)
    for key, value in payload.model_dump(exclude={"save_as_draft"}).items():
        setattr(req, key, value)
    if payload.job_title_id:
        req.job_title_name = db.query(JobTitle.name).filter(JobTitle.id == payload.job_title_id).scalar()
    _audit(db, current_user, "REQUISITION_UPDATE", req, {"status": req.status})
    db.commit()
    db.refresh(req)
    return req.to_dict()


@router.post("/{req_id}/submit")
def submit_requisition(
    req_id: int,
    current_user: User = Depends(require_permission("requisition:create")),
    db: Session = Depends(get_db)
):
    req = _get_or_404(db, req_id)
    if req.created_by_id != current_user.id and "admin" not in _role_codes(db, current_user):
        raise HTTPException(status_code=403, detail="Chỉ người tạo tờ trình mới được gửi duyệt.")
    if req.status not in DRAFT_STATES:
        raise HTTPException(status_code=409, detail=f"Tờ trình đang ở trạng thái '{req.status}', không thể gửi duyệt.")
    from_status = req.status
    _check_headcount(db, req)
    new_status = _enter_approval(db, req, from_status)
    db.add(RequisitionApprovalLog(
        requisition_id=req.id, approver_id=current_user.id, step_name="Gửi trình duyệt",
        action="submitted", comment="Gửi lại sau khi bổ sung" if from_status == "changes_requested" else "Gửi trình duyệt",
    ))
    _audit(db, current_user, "REQUISITION_SUBMIT", req, {"from": from_status, "to": new_status})
    _notify_pending(db, req, new_status, current_user.id)
    db.commit()
    db.refresh(req)
    return req.to_dict()


@router.post("/{req_id}/approve")
def approve_requisition(
    req_id: int,
    payload: RequisitionApprovalAction,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    role_codes = _role_codes(db, current_user)
    effective_perms = set(get_effective_permissions(db, current_user))
    req = _get_or_404(db, req_id)

    # Workflow state machine validation
    if req.status not in PENDING_STATES:
        raise HTTPException(
            status_code=400,
            detail=f"Tờ trình đã ở trạng thái '{req.status}', không thể thực hiện phê duyệt lại."
        )

    has_approve_perm = "requisition:approve" in effective_perms or "admin" in role_codes
    chain = req.approval_chain()
    step = req.status.replace("pending_", "", 1)
    index = chain.index(step) if step in chain else 0
    if step == "manager":
        if not (has_approve_perm or role_codes & {"hiring_manager", "manager"}):
            raise HTTPException(status_code=403, detail="Chỉ Trưởng bộ phận hoặc Admin mới có quyền duyệt cấp 1.")
    elif step == "hr":
        if not (has_approve_perm or "hr_manager" in role_codes):
            raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền duyệt thẩm định cấp 2.")
    else:  # executive level for over-threshold salaries
        if not role_codes & {"approver", "admin"}:
            raise HTTPException(status_code=403, detail="Chỉ Ban Giám đốc (Người duyệt) mới duyệt được cấp này.")

    comment = (payload.comment or "").strip()
    if payload.action in ("rejected", "changes_requested") and not comment:
        raise HTTPException(status_code=422, detail="Từ chối hoặc Yêu cầu bổ sung bắt buộc phải nhập ý kiến.")

    from_status = req.status
    if payload.action == "approved":
        step_name = STEP_LABELS.get(step, "Phê duyệt")
        if index + 1 < len(chain):
            nxt = chain[index + 1]
            values = {"status": f"pending_{nxt}", "current_approval_step": nxt, "approval_step_index": index + 1}
        else:
            values = {"status": "approved", "current_approval_step": "completed", "approval_step_index": index + 1}
    elif payload.action == "rejected":
        values, step_name = {"status": "rejected", "reject_reason": comment}, "Từ chối phê duyệt"
    elif payload.action == "changes_requested":
        values, step_name = {"status": "changes_requested", "current_approval_step": "draft", "reject_reason": comment}, "Yêu cầu bổ sung"
    else:
        raise HTTPException(status_code=400, detail="Thao tác action không hợp lệ (chỉ chấp nhận 'approved', 'rejected' hoặc 'changes_requested')")

    _transition(db, req, from_status, values)
    db.add(RequisitionApprovalLog(
        requisition_id=req.id,
        approver_id=current_user.id,
        step_name=step_name,
        action=payload.action,
        comment=comment or None,
    ))
    _audit(db, current_user, "REQUISITION_DECISION", req, {"from": from_status, "to": values["status"], "action": payload.action})
    _notify_pending(db, req, values["status"], current_user.id)
    notify(db, [req.created_by_id], "requisition_decision", f"Tờ trình {req.code}: {step_name}", comment or values["status"],
           link=f"/manager?requisition={req.id}", entity_type="REQUISITION", entity_id=req.id)
    db.commit()
    db.refresh(req)
    return req.to_dict()


# Phân công Recruiter (S3-06)
@router.post("/{req_id}/assign-recruiters")
def assign_recruiter(
    req_id: int,
    payload: RecruiterAssignRequest,
    current_user: User = Depends(require_roles_dep({"hr_manager"})),
    db: Session = Depends(get_db)
):
    req = _get_or_404(db, req_id)
    if req.status != "approved":
        raise HTTPException(status_code=409, detail="Chỉ phân công recruiter cho tờ trình đã được duyệt.")
    if payload.assignment_type not in ("primary", "secondary"):
        raise HTTPException(status_code=422, detail="Loại phân công chỉ chấp nhận 'primary' hoặc 'secondary'.")

    recruiter = db.query(User).filter(User.id == payload.recruiter_id).first()
    if not recruiter or recruiter.account_status != "active":
        raise HTTPException(status_code=404, detail="Không tìm thấy recruiter đang hoạt động.")
    if "recruiter" not in _role_codes(db, recruiter):
        raise HTTPException(status_code=422, detail="Người được phân công không có vai trò Chuyên viên Tuyển dụng.")

    existing = db.query(RecruiterAssignment).filter(
        RecruiterAssignment.requisition_id == req.id, RecruiterAssignment.recruiter_id == recruiter.id
    ).first()
    if existing and existing.assignment_type == payload.assignment_type:
        raise HTTPException(status_code=409, detail="Recruiter này đã được phân công cho tờ trình.")

    previous_primary = None
    if payload.assignment_type == "primary":
        current_primary = db.query(RecruiterAssignment).filter(
            RecruiterAssignment.requisition_id == req.id, RecruiterAssignment.assignment_type == "primary"
        ).first()
        if current_primary and current_primary.recruiter_id != recruiter.id:
            previous_primary = current_primary.recruiter_id
            current_primary.assignment_type = "secondary"

    if existing:
        existing.assignment_type = payload.assignment_type
    else:
        db.add(RecruiterAssignment(requisition_id=req.id, recruiter_id=recruiter.id, assignment_type=payload.assignment_type))
    db.add(RequisitionApprovalLog(
        requisition_id=req.id, approver_id=current_user.id, step_name="Phân công recruiter",
        action="recruiter_assigned",
        comment=f"Recruiter {recruiter.email} ({payload.assignment_type})"
                + (f"; chuyển giao từ user #{previous_primary}" if previous_primary else ""),
    ))
    _audit(db, current_user, "REQUISITION_ASSIGN_RECRUITER", req,
           {"recruiter_id": recruiter.id, "type": payload.assignment_type, "previous_primary": previous_primary})
    notify(db, [recruiter.id], "recruiter_assigned", f"Bạn được phân công tờ trình {req.code}", req.title,
           link=f"/recruiter?requisition={req.id}", entity_type="REQUISITION", entity_id=req.id)
    db.commit()
    return {"success": True, "message": f"Đã phân công Recruiter {recruiter.email} ({payload.assignment_type}) cho tờ trình {req.code}."}


# Ghi đè Headcount khi vượt chỉ tiêu (S3-04 Override)
@router.post("/{req_id}/headcount-override")
def override_headcount(
    req_id: int,
    payload: HeadcountOverrideRequest,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    role_codes = _role_codes(db, current_user)
    effective_perms = set(get_effective_permissions(db, current_user))

    is_allowed = "admin" in role_codes or "hr_manager" in role_codes or "requisition:override_headcount" in effective_perms
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Chỉ HR Manager hoặc Admin mới có quyền xác nhận ghi đè Headcount.")

    req = _get_or_404(db, req_id)
    req.headcount_overridden = True
    db.add(RequisitionApprovalLog(
        requisition_id=req.id,
        approver_id=current_user.id,
        step_name="Xác nhận Ghi Đè Headcount",
        action="headcount_override",
        comment=f"HR Manager đã phê duyệt ghi đè chỉ tiêu Headcount. Lý do: {payload.reason}"
    ))
    _audit(db, current_user, "REQUISITION_HEADCOUNT_OVERRIDE", req, {"reason": payload.reason})
    db.commit()
    return {"success": True, "message": "Đã xác nhận ghi đè chỉ tiêu Headcount thành công."}


# Tạm dừng / Đóng / Huỷ yêu cầu tuyển dụng (S3-07)
@router.post("/{req_id}/close")
def close_requisition(
    req_id: int,
    payload: RequisitionCloseRequest,
    current_user: User = Depends(require_roles_dep({"hr_manager"})),
    db: Session = Depends(get_db)
):
    if payload.status not in CLOSE_TARGETS:
        raise HTTPException(status_code=422, detail="Trạng thái kết thúc chỉ chấp nhận 'filled', 'paused' hoặc 'cancelled'.")
    req = _get_or_404(db, req_id)
    if req.status in {"filled", "cancelled"}:
        raise HTTPException(status_code=409, detail=f"Tờ trình đã kết thúc ở trạng thái '{req.status}'.")

    postings = db.query(JobPosting).filter(JobPosting.requisition_id == req.id).all()
    posting_ids = [p.id for p in postings]
    active_candidates = 0
    if posting_ids:
        active_candidates = db.query(JobApplication).filter(
            JobApplication.job_posting_id.in_(posting_ids),
            JobApplication.status.in_(ACTIVE_APPLICATION_STATES),
        ).count()
    if active_candidates and not payload.confirm_active_candidates:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "ACTIVE_CANDIDATES_IN_PIPELINE",
                "message": f"Còn {active_candidates} ứng viên đang trong pipeline. Hãy xử lý hoặc xác nhận trước khi đóng.",
                "active_candidates": active_candidates,
            },
        )

    from_status = req.status
    _transition(db, req, from_status, {"status": payload.status, "reject_reason": payload.reason})
    for posting in postings:
        if posting.status == "published":
            posting.status = "closed"
    db.add(RequisitionApprovalLog(
        requisition_id=req.id, approver_id=current_user.id, step_name=CLOSE_TARGETS[payload.status],
        action=payload.status, comment=payload.reason,
    ))
    _audit(db, current_user, "REQUISITION_CLOSE", req,
           {"from": from_status, "to": payload.status, "unpublished_postings": posting_ids, "active_candidates": active_candidates})
    db.commit()
    db.refresh(req)
    return req.to_dict()


# Sao chép yêu cầu tuyển dụng (S3-05)
@router.post("/{req_id}/copy", status_code=201)
def copy_requisition(
    req_id: int,
    current_user: User = Depends(require_permission("requisition:create")),
    db: Session = Depends(get_db)
):
    src = _get_or_404(db, req_id)
    _ensure_visible(db, current_user, src)
    copy = JobRequisition(
        code=_next_code(db), title=src.title, department_id=src.department_id, job_title_id=src.job_title_id,
        job_title_name=src.job_title_name, quantity=src.quantity, reason=src.reason, reason_detail=src.reason_detail,
        priority=src.priority, employment_type=src.employment_type, work_location=src.work_location,
        min_salary=src.min_salary, max_salary=src.max_salary, is_salary_negotiable=src.is_salary_negotiable,
        job_description=src.job_description, requirements=src.requirements, benefits=src.benefits,
        salary_justification=src.salary_justification,
        status="draft", current_approval_step="draft", created_by_id=current_user.id,
    )  # always a draft, no approval history and no needed-by date inherited
    db.add(copy)
    db.flush()
    _audit(db, current_user, "REQUISITION_COPY", copy, {"source_id": src.id})
    db.commit()
    db.refresh(copy)
    return copy.to_dict()


@router.delete("/{req_id}")
def delete_draft_requisition(
    req_id: int,
    current_user: User = Depends(require_permission("requisition:create")),
    db: Session = Depends(get_db)
):
    """Only never-submitted drafts can be deleted, by their creator; anything with history is kept (S3-03 AC3)."""
    req = _get_or_404(db, req_id)
    if req.created_by_id != current_user.id and "admin" not in _role_codes(db, current_user):
        raise HTTPException(status_code=403, detail="Chỉ người tạo mới được xoá bản nháp.")
    if req.status != "draft" or db.query(RequisitionApprovalLog.id).filter(RequisitionApprovalLog.requisition_id == req.id).first():
        raise HTTPException(status_code=409, detail="Chỉ xoá được bản nháp chưa từng gửi duyệt; tờ trình đã có lịch sử thì không xoá được.")
    _audit(db, current_user, "REQUISITION_DRAFT_DELETE", req, {"code": req.code})
    db.delete(req)
    db.commit()
    return {"success": True}
