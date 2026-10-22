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
from app.api.deps import get_current_user_obj, require_permission
from app.services.rbac_service import get_user_roles, get_effective_permissions
from app.models.audit import AuditLog
from app.services.notification_service import notify, users_with_roles
from app.core.search import build_search_filter, build_search_score

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
        if self.reason not in ("replacement", "expansion", "seasonal"):
            raise ValueError("Lý do tuyển dụng không hợp lệ (phải là 'replacement', 'expansion' hoặc 'seasonal').")
        if self.target_onboard_date:
            try:
                target = date.fromisoformat(self.target_onboard_date[:10])
            except ValueError:
                raise ValueError("Ngày cần người không đúng định dạng YYYY-MM-DD.")
            if target < date.today():
                raise ValueError("Ngày cần người không được ở quá khứ.")
        return self


class RequisitionUpdate(BaseModel):
    title: Optional[str] = None
    department_id: Optional[int] = None
    quantity: Optional[int] = Field(default=None, ge=1)
    reason: Optional[str] = None
    reason_detail: Optional[str] = None
    priority: Optional[str] = None
    employment_type: Optional[str] = None
    work_location: Optional[str] = None
    min_salary: Optional[int] = Field(default=None, ge=0)
    max_salary: Optional[int] = Field(default=None, ge=0)
    is_salary_negotiable: Optional[bool] = None
    target_onboard_date: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_title_id: Optional[int] = None
    salary_justification: Optional[str] = None

    @model_validator(mode="after")
    def _validate_business_fields(self):
        if self.min_salary is not None and self.max_salary is not None and self.min_salary > self.max_salary:
            raise ValueError("Mức lương tối thiểu không được lớn hơn mức lương tối đa.")
        if self.reason is not None and self.reason not in ("replacement", "expansion", "seasonal"):
            raise ValueError("Lý do tuyển dụng không hợp lệ (phải là 'replacement', 'expansion' hoặc 'seasonal').")
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
    handover_reason: Optional[str] = None


class HeadcountOverrideRequest(BaseModel):
    reason: str = Field(..., min_length=1)


class RequisitionCloseRequest(BaseModel):
    status: str = Field(..., example="filled")  # filled, paused, cancelled
    reason: str = Field(..., min_length=1)
    confirm_active_candidates: bool = False


class RequisitionCloneRequest(BaseModel):
    title: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=1)
    target_onboard_date: Optional[str] = None
    reason: Optional[str] = None
    reason_detail: Optional[str] = None


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
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.status == "active", ApprovalFlow.is_deleted == False).all()
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


@router.get("/check-salary-band")
def check_salary_band_endpoint(
    job_title_id: int,
    min_salary: Optional[int] = None,
    max_salary: Optional[int] = None,
    current_user: User = Depends(require_permission("requisition:create")),
    db: Session = Depends(get_db)
):
    """S2-10 AC3: Kiểm tra mức lương đề xuất có nằm ngoài dải chuẩn hay không mà không để lộ dải lương mật (S2-05)."""
    title = db.query(JobTitle).filter(JobTitle.id == job_title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Chức danh không tồn tại")
    low = min_salary if min_salary is not None else max_salary
    high = max_salary if max_salary is not None else min_salary
    outside = (low is not None and low < title.min_salary) or (high is not None and high > title.max_salary)
    return {
        "job_title_id": job_title_id,
        "outside": outside,
        "requires_justification": outside,
    }


@router.get("")
def list_requisitions(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    department_id: Optional[int] = None,
    recruiter_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    overdue_only: bool = False,
    needs_handover_only: bool = False,
    current_user: User = Depends(require_permission("requisition:view")),
    db: Session = Depends(get_db)
):
    query = db.query(JobRequisition)
    if not _can_view_all(db, current_user):
        assigned = _assigned_requisition_ids(db, current_user)
        query = query.filter(
            (JobRequisition.created_by_id == current_user.id) | (JobRequisition.id.in_(assigned or {-1}))
        )
    search_score = None
    if search and search.strip():
        search_cols = [JobRequisition.title, JobRequisition.code]
        query = query.filter(build_search_filter(search_cols, search.strip()))
        search_score = build_search_score(search_cols, search.strip())
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
    if search_score is not None:
        rows = query.order_by(search_score.desc(), JobRequisition.created_at.desc()).all()
    else:
        rows = query.order_by(JobRequisition.created_at.desc()).all()
    # S3-06 & S1-10: show who is in charge and detect locked/inactive recruiters needing handover
    assigned = {}
    rec_status_map = {}
    if rows:
        for a, name, email, acc_status, is_act in (
            db.query(RecruiterAssignment, User.full_name, User.email, User.account_status, User.is_active)
            .join(User, User.id == RecruiterAssignment.recruiter_id)
            .filter(RecruiterAssignment.requisition_id.in_([r.id for r in rows])).all()
        ):
            assigned.setdefault(a.requisition_id, []).append({
                "recruiter_id": a.recruiter_id,
                "full_name": name or email,
                "assignment_type": a.assignment_type
            })
            rec_status_map[(a.requisition_id, a.recruiter_id)] = (acc_status, is_act, name or email)

    reqs = []
    for r in rows:
        recs = assigned.get(r.id, [])
        primary = next((x for x in recs if x["assignment_type"] == "primary"), None)
        needs_handover = False
        handover_reason_flag = None
        if r.status in {"approved", "in_progress"}:
            if not primary:
                needs_handover = True
                handover_reason_flag = "Chưa có chuyên viên tuyển dụng phụ trách chính"
            else:
                acc_status, is_act, full_name = rec_status_map.get((r.id, primary["recruiter_id"]), ("active", True, primary["full_name"]))
                if acc_status != "active" or not is_act:
                    needs_handover = True
                    handover_reason_flag = f"Chuyên viên {full_name} đã bị khoá tài khoản/nghỉ việc"

        item = r.to_dict() | {
            "recruiters": recs,
            "needs_handover": needs_handover,
            "handover_reason_flag": handover_reason_flag,
        }
        reqs.append(item)

    if overdue_only:
        reqs = [r for r in reqs if r["is_overdue"]]
    if needs_handover_only:
        reqs = [r for r in reqs if r["needs_handover"]]
    return reqs


@router.get("/handover-history")
def get_handover_history(
    requisition_id: Optional[int] = None,
    current_user: User = Depends(require_permission("requisition:view")),
    db: Session = Depends(get_db)
):
    """S3-06 & S1-10: Audit trail of recruiter assignments and handovers."""
    query = (
        db.query(RequisitionApprovalLog, JobRequisition.code, JobRequisition.title, User.full_name, User.email)
        .join(JobRequisition, JobRequisition.id == RequisitionApprovalLog.requisition_id)
        .outerjoin(User, User.id == RequisitionApprovalLog.approver_id)
        .filter(RequisitionApprovalLog.action.in_(["recruiter_handover", "recruiter_assigned"]))
    )
    if requisition_id:
        query = query.filter(RequisitionApprovalLog.requisition_id == requisition_id)
    logs = query.order_by(RequisitionApprovalLog.created_at.desc()).limit(100).all()

    return [
        {
            "id": log.id,
            "requisition_id": log.requisition_id,
            "requisition_code": code,
            "requisition_title": title,
            "approver_name": approver_name or approver_email or "Hệ thống",
            "action": log.action,
            "step_name": log.step_name,
            "comment": log.comment,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log, code, title, approver_name, approver_email in logs
    ]


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

    # S3-03 AC1: Hiển thị chuỗi cấp duyệt, cấp nào đã duyệt, đang chờ ai (Current Approver Info)
    current_approver_info = None
    if req.status.startswith("pending_"):
        step_key = req.status.replace("pending_", "", 1)
        step_label = STEP_LABELS.get(step_key, "Phê duyệt")
        target_roles = STEP_NOTIFY_ROLES.get(step_key, ["approver"])
        uids = users_with_roles(db, target_roles, exclude_user_id=None)
        approver_objs = db.query(User).filter(User.id.in_(uids)).all() if uids else []

        # Tính thời gian hồ sơ đang dừng tại bước duyệt này
        last_log = req.approval_logs[-1] if req.approval_logs else None
        last_dt = last_log.created_at if last_log else req.created_at
        waited_seconds = max((datetime.utcnow() - last_dt).total_seconds(), 0) if last_dt else 0
        waited_hours = round(waited_seconds / 3600, 1)

        current_approver_info = {
            "step_code": step_key,
            "step_label": step_label,
            "target_roles": target_roles,
            "approvers": [
                {
                    "id": u.id,
                    "full_name": u.full_name,
                    "email": u.email,
                    "role": u.role,
                    "department": u.department,
                }
                for u in approver_objs
            ],
            "waited_hours": waited_hours,
            "is_overdue": waited_hours >= 48,
        }
    elif req.status == "approved":
        current_approver_info = {
            "step_code": "approved",
            "step_label": "Đã hoàn thành phê duyệt tất cả các cấp",
            "approvers": [],
            "waited_hours": 0,
            "is_overdue": False,
        }
    elif req.status == "rejected":
        current_approver_info = {
            "step_code": "rejected",
            "step_label": "Đã từ chối phê duyệt",
            "reject_reason": req.reject_reason,
            "approvers": [],
            "waited_hours": 0,
            "is_overdue": False,
        }
    elif req.status == "changes_requested":
        current_approver_info = {
            "step_code": "changes_requested",
            "step_label": "Yêu cầu bổ sung thông tin tờ trình",
            "reject_reason": req.reject_reason,
            "approvers": [],
            "waited_hours": 0,
            "is_overdue": False,
        }
    else:
        current_approver_info = {
            "step_code": req.status,
            "step_label": "Bản nháp",
            "approvers": [],
            "waited_hours": 0,
            "is_overdue": False,
        }
    res["current_approver_info"] = current_approver_info
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
                step_code="submit",
                step_name="Tạo mới tờ trình",
                action="submitted",
                comment="Đã khởi tạo tờ trình tuyển dụng và gửi trình duyệt",
            ))
            _notify_pending(db, req, initial_status, current_user.id)
            notify(db, [current_user.id], "requisition_submitted",
                   f"Trình duyệt tờ trình {req.code} thành công",
                   f"Tờ trình '{req.title}' ({req.quantity} nhân sự) đã được gửi vào luồng phê duyệt.",
                   link=f"/manager/requisitions?search={req.code}",
                   entity_type="REQUISITION", entity_id=req.id)
        else:
            notify(db, [current_user.id], "requisition_created",
                   f"Lưu nháp tờ trình {req.code} thành công",
                   f"Tờ trình '{req.title}' ({req.quantity} nhân sự) đã được lưu bản nháp thành công.",
                   link=f"/manager/requisitions?search={req.code}",
                   entity_type="REQUISITION", entity_id=req.id)
        _audit(db, current_user, "REQUISITION_CREATE", req, {"status": initial_status, "code": req.code})
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Mã tờ trình bị trùng do thao tác đồng thời. Vui lòng thử lại.")
    db.refresh(req)
    return req.to_dict()


@router.put("/{req_id}")
def update_requisition(
    req_id: int,
    payload: RequisitionUpdate,
    current_user: User = Depends(require_permission("requisition:edit")),
    db: Session = Depends(get_db)
):
    req = _get_or_404(db, req_id)
    if req.created_by_id != current_user.id and not (_role_codes(db, current_user) & {"admin", "hr_manager"}):
        raise HTTPException(status_code=403, detail="Chỉ người tạo tờ trình mới được chỉnh sửa.")
    if req.status not in DRAFT_STATES:
        raise HTTPException(status_code=409, detail=f"Chỉ sửa được tờ trình ở trạng thái Nháp hoặc Yêu cầu bổ sung (hiện tại: '{req.status}').")
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(req, key, value)
    if payload.job_title_id:
        req.job_title_name = db.query(JobTitle.name).filter(JobTitle.id == payload.job_title_id).scalar()
    _check_salary_band(db, req)
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
    _check_salary_band(db, req)
    _check_headcount(db, req)
    new_status = _enter_approval(db, req, from_status)
    db.add(RequisitionApprovalLog(
        requisition_id=req.id,
        approver_id=current_user.id,
        step_code="submit",
        step_name="Gửi trình duyệt",
        action="submitted",
        comment="Gửi lại sau khi bổ sung" if from_status == "changes_requested" else "Gửi trình duyệt",
    ))
    _audit(db, current_user, "REQUISITION_SUBMIT", req, {"from": from_status, "to": new_status})
    _notify_pending(db, req, new_status, current_user.id)
    notify(db, [current_user.id], "requisition_submitted",
           f"Trình duyệt tờ trình {req.code} thành công",
           f"Tờ trình '{req.title}' ({req.quantity} nhân sự) đã được gửi vào luồng phê duyệt.",
           link=f"/manager/requisitions?search={req.code}",
           entity_type="REQUISITION", entity_id=req.id)
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
    if not (req.status.startswith("pending_") and req.status != "pending_approval"):
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
        step_name = STEP_LABELS.get(step, f"Phê duyệt cấp {step}")
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
        step_code=step,
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
    current_user: User = Depends(require_permission("requisition:assign")),
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

    is_handover = bool(previous_primary or payload.handover_reason)
    action_type = "recruiter_handover" if is_handover else "recruiter_assigned"
    step_title = "Bàn giao / Phân công Recruiter" if is_handover else "Phân công recruiter"
    log_comment = f"Recruiter: {recruiter.full_name or recruiter.email} ({payload.assignment_type})"
    if payload.handover_reason:
        log_comment += f" | Lý do bàn giao: {payload.handover_reason}"
    if previous_primary:
        log_comment += f" | Chuyển giao từ Recruiter #{previous_primary}"

    db.add(RequisitionApprovalLog(
        requisition_id=req.id,
        approver_id=current_user.id,
        step_name=step_title,
        action=action_type,
        comment=log_comment,
    ))
    _audit(db, current_user, "REQUISITION_HANDOVER" if is_handover else "REQUISITION_ASSIGN_RECRUITER", req,
           {"recruiter_id": recruiter.id, "type": payload.assignment_type, "previous_primary": previous_primary, "handover_reason": payload.handover_reason})
    notify(db, [recruiter.id], "recruiter_assigned", f"Bạn được phân công tờ trình {req.code}", req.title,
           link=f"/recruiter?requisition={req.id}", entity_type="REQUISITION", entity_id=req.id)
    db.commit()
    return {
        "success": True,
        "message": f"Đã {'bàn giao' if is_handover else 'phân công'} Recruiter {recruiter.full_name or recruiter.email} ({payload.assignment_type}) cho tờ trình {req.code}."
    }


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
    current_user: User = Depends(require_permission("requisition:close")),
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


class RequisitionResumeRequest(BaseModel):
    reason: str = Field(..., min_length=1)


@router.post("/{req_id}/resume")
def resume_requisition(
    req_id: int,
    payload: RequisitionResumeRequest,
    current_user: User = Depends(require_permission("requisition:close")),
    db: Session = Depends(get_db)
):
    """Re-open a paused requisition (back to approved). Postings closed by the pause stay closed — republish them explicitly."""
    req = _get_or_404(db, req_id)
    if req.status != "paused":
        raise HTTPException(status_code=409, detail=f"Chỉ mở lại được tờ trình đang tạm dừng (hiện tại '{req.status}').")
    _transition(db, req, "paused", {"status": "approved"})
    db.add(RequisitionApprovalLog(requisition_id=req.id, approver_id=current_user.id, step_name="Mở lại tuyển dụng",
                                  action="resumed", comment=payload.reason))
    _audit(db, current_user, "REQUISITION_RESUME", req, {"from": "paused", "to": "approved", "reason": payload.reason})
    db.commit()
    db.refresh(req)
    return req.to_dict()


# Sao chép yêu cầu tuyển dụng (S3-05: EP-03)
@router.post("/{req_id}/clone", status_code=201)
@router.post("/{req_id}/copy", status_code=201)
def clone_requisition(
    req_id: int,
    payload: Optional[RequisitionCloneRequest] = None,
    current_user: User = Depends(require_permission("requisition:create")),
    db: Session = Depends(get_db)
):
    """
    S3-05: 'Là Trưởng bộ phận, tôi muốn sao chép một yêu cầu tuyển dụng đã có để tạo yêu cầu mới...'
    - S3-05-AC01: Sao chép toàn bộ mô tả công việc (job_description), yêu cầu ứng viên (requirements),
      quyền lợi (benefits), dải lương (min_salary, max_salary, is_salary_negotiable), vị trí chức danh, phòng ban.
    - S3-05-AC02: Bản sao luôn bắt đầu ở trạng thái Nháp ('draft'), sinh mã độc nhất mới (code),
      không kế thừa lịch sử duyệt (approval_logs rỗng), không kế thừa phân công recruiter (recruiter_assignments rỗng).
    - TC-S3-05-X01: Không thừa hưởng token duyệt hoặc phê duyệt cũ, bảo mật phân quyền phòng ban.
    """
    src = _get_or_404(db, req_id)
    _ensure_visible(db, current_user, src)

    # AC1: Sao chép mô tả công việc và yêu cầu ứng viên, có thể ghi đè tiêu đề/số lượng nếu truyền payload
    title = (payload.title.strip() if payload and payload.title and payload.title.strip() else f"{src.title} (Bản sao)")
    quantity = payload.quantity if (payload and payload.quantity is not None) else src.quantity
    reason = payload.reason if (payload and payload.reason) else src.reason
    reason_detail = payload.reason_detail if (payload and payload.reason_detail) else (src.reason_detail or f"Sao chép từ yêu cầu {src.code}")

    target_date = None
    if payload and payload.target_onboard_date:
        try:
            parsed = date.fromisoformat(payload.target_onboard_date[:10])
            if parsed < date.today():
                raise HTTPException(status_code=422, detail="Ngày cần người không được ở quá khứ.")
            target_date = payload.target_onboard_date[:10]
        except ValueError:
            raise HTTPException(status_code=422, detail="Ngày cần người không đúng định dạng YYYY-MM-DD.")
    elif src.target_onboard_date:
        try:
            parsed = date.fromisoformat(src.target_onboard_date[:10])
            if parsed >= date.today():
                target_date = src.target_onboard_date[:10]
        except ValueError:
            target_date = None

    # AC2: Bản sao luôn bắt đầu ở trạng thái Nháp, không kế thừa lịch sử duyệt và phân công
    copy = JobRequisition(
        code=_next_code(db),
        title=title,
        department_id=src.department_id,
        job_title_id=src.job_title_id,
        job_title_name=src.job_title_name,
        quantity=quantity,
        reason=reason,
        reason_detail=reason_detail,
        priority=src.priority,
        employment_type=src.employment_type,
        work_location=src.work_location,
        min_salary=src.min_salary,
        max_salary=src.max_salary,
        is_salary_negotiable=src.is_salary_negotiable,
        target_onboard_date=target_date,
        job_description=src.job_description,
        requirements=src.requirements,
        benefits=src.benefits,
        salary_justification=src.salary_justification,
        status="draft",
        current_approval_step="draft",
        approval_chain_json=None,
        approval_step_index=0,
        headcount_overridden=False,
        reject_reason=None,
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(copy)
    db.flush()

    _audit(db, current_user, "REQUISITION_CLONE", copy, {
        "source_id": src.id,
        "source_code": src.code,
        "new_code": copy.code,
        "title": copy.title
    })

    notify(
        db,
        [current_user.id],
        "requisition_created",
        f"Sao chép tờ trình {src.code} thành công",
        f"Đã sao chép tờ trình '{src.title}' ({src.code}) thành bản nháp mới {copy.code} ({copy.title}). Lịch sử phê duyệt được khởi tạo mới hoàn toàn.",
        link=f"/manager/requisitions?search={copy.code}",
        entity_type="REQUISITION",
        entity_id=copy.id,
    )

    db.commit()
    db.refresh(copy)

    res = copy.to_dict()
    res["source_requisition_code"] = src.code
    res["source_requisition_id"] = src.id
    res["cloned_from"] = {"id": src.id, "code": src.code, "title": src.title}
    res["message"] = f"Sao chép thành công từ {src.code} sang {copy.code} (Trạng thái: Bản nháp)"
    return res


@router.post("/{req_id}/remind")
def remind_current_approvers(
    req_id: int,
    current_user: User = Depends(require_permission("requisition:view")),
    db: Session = Depends(get_db)
):
    """Nudge the people who can act on the current approval step (once per day per requisition).
    Only the requisition's creator (or an admin) may send it, and only while it is waiting for approval."""
    from datetime import date as _date
    from app.models.notification import Notification
    req = _get_or_404(db, req_id)
    _ensure_visible(db, current_user, req)
    if req.created_by_id != current_user.id and "admin" not in _role_codes(db, current_user):
        raise HTTPException(status_code=403, detail="Chỉ người lập tờ trình mới gửi được nhắc nhở phê duyệt.")
    if not req.status.startswith("pending_"):
        raise HTTPException(status_code=409, detail="Tờ trình không ở trạng thái chờ duyệt.")
    roles = STEP_NOTIFY_ROLES.get(req.status.replace("pending_", "", 1), [])
    recipients = users_with_roles(db, roles, exclude_user_id=current_user.id)
    recipient_users = db.query(User).filter(User.id.in_(recipients)).all() if recipients else []
    key_prefix = f"remind:{req.id}:{_date.today().isoformat()}"
    if db.query(Notification.id).filter(Notification.dedupe_key.like(key_prefix + ":%")).first():
        raise HTTPException(status_code=409, detail="Đã gửi nhắc nhở cho tờ trình này trong hôm nay.")
    sent = 0
    for uid in recipients:
        if notify(db, [uid], "approval_pending", f"Nhắc duyệt tờ trình {req.code}",
                  f"{current_user.full_name} đề nghị xử lý tờ trình '{req.title}'.",
                  link="/approver/requisitions", entity_type="REQUISITION", entity_id=req.id):
            db.flush()
            last = db.query(Notification).filter(Notification.recipient_id == uid).order_by(Notification.id.desc()).first()
            last.dedupe_key = f"{key_prefix}:{uid}"
            sent += 1
    _audit(db, current_user, "REQUISITION_REMIND", req, {"recipients": sent})
    db.commit()

    recipient_details = [
        {"id": u.id, "name": u.full_name, "email": u.email, "role": u.role}
        for u in recipient_users
    ]
    recipient_names = ", ".join(u["name"] for u in recipient_details) or "người phê duyệt"
    return {
        "sent": sent,
        "code": req.code,
        "title": req.title,
        "step_code": req.status.replace("pending_", "", 1),
        "recipients": recipient_details,
        "message": f"Đã gửi thông báo nhắc nhở duyệt tờ trình {req.code} tới {recipient_names} thành công."
    }


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


# S3-03 AC3 & TC-S3-03-X01: Bảo vệ tính bất biến của nhật ký phê duyệt (Immutable Audit Trail)
@router.patch("/{req_id}/approval-logs/{log_id}")
@router.put("/{req_id}/approval-logs/{log_id}")
@router.delete("/{req_id}/approval-logs/{log_id}")
def immutable_approval_log_protection(
    req_id: int,
    log_id: int,
    current_user: User = Depends(get_current_user_obj)
):
    """S3-03 AC3 & TC-S3-03-X01: Lịch sử phê duyệt là dữ liệu kiểm toán bất biến (immutable audit log).
    Nghiêm cấm mọi hành vi sửa đổi hoặc xoá đối với Admin hoặc bất kỳ vai trò nào."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Lịch sử phê duyệt là dữ liệu kiểm toán bất biến (immutable audit trail). Nghiêm cấm chỉnh sửa hoặc xóa theo chính sách tuân thủ ISO/SaaS."
    )
