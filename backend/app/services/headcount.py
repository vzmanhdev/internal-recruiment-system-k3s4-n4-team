from decimal import Decimal
from math import isfinite
from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session
from app.models.headcount import HeadcountBudget
from app.models.requisition import JobRequisition
from app.models.user import User


def budget_check(db: Session, req: JobRequisition):
    budget = db.query(HeadcountBudget).filter_by(department_id=req.department_id).first()
    cost = Decimal(str(req.max_salary or 0)) * req.quantity
    reason = None
    if not budget:
        reason = "Phòng ban chưa có ngân sách headcount. Hãy khai báo hạn mức trước khi duyệt."
    elif not req.max_salary or not isfinite(req.max_salary) or req.max_salary <= 0 or (req.min_salary is not None and req.min_salary > req.max_salary):
        reason = "Tờ trình phải có mức lương tối đa hợp lệ để kiểm soát ngân sách."
    elif not req.headcount_budget_id:
        if req.quantity > budget.headcount_limit - budget.reserved_headcount:
            reason = "Vượt hạn mức headcount: không đủ số người còn lại để phê duyệt."
        elif cost > budget.monthly_salary_limit - budget.reserved_monthly_salary:
            reason = "Vượt ngân sách quỹ lương tháng: không thể phê duyệt."
    return {"blocked": bool(reason), "reason": reason, "requested_headcount": req.quantity,
            "requested_monthly_salary": float(cost), "reserved": bool(req.headcount_budget_id),
            "budget": budget.to_dict() if budget else None}


def reserve_budget(db: Session, req: JobRequisition):
    if req.headcount_budget_id:
        return
    check = budget_check(db, req)
    if check["blocked"]:
        raise HTTPException(409, check["reason"])
    budget_id = check["budget"]["id"]
    cost = Decimal(str(req.max_salary)) * req.quantity
    # Conditional updates reserve both limits atomically, even for concurrent approvals.
    result = db.execute(update(HeadcountBudget).where(
        HeadcountBudget.id == budget_id,
        HeadcountBudget.reserved_headcount + req.quantity <= HeadcountBudget.headcount_limit,
        HeadcountBudget.reserved_monthly_salary + cost <= HeadcountBudget.monthly_salary_limit,
    ).values(reserved_headcount=HeadcountBudget.reserved_headcount + req.quantity,
             reserved_monthly_salary=HeadcountBudget.reserved_monthly_salary + cost),
        execution_options={"synchronize_session": False})
    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "Ngân sách vừa thay đổi hoặc đã vượt hạn mức. Vui lòng tải lại.")
    claimed = db.execute(update(JobRequisition).where(
        JobRequisition.id == req.id, JobRequisition.headcount_budget_id.is_(None),
        JobRequisition.status.in_(["pending_hr", "approved"]),
    ).values(headcount_budget_id=budget_id, reserved_monthly_salary=cost),
        execution_options={"synchronize_session": False})
    if claimed.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "Tờ trình đã được xử lý. Vui lòng tải lại.")
    db.refresh(req)


def validate_recruiter(user: User | None):
    if not user or not user.is_active or user.account_status != "active" or "recruiter" not in user.role.split(","):
        raise HTTPException(400, "Chọn nhân viên tuyển dụng có vai trò Recruiter và tài khoản đang hoạt động.")


def validate_linked_job(db: Session, job, publishing: bool = False):
    if not job.requisition_id:
        if publishing:
            raise HTTPException(409, "Chọn tờ trình đã duyệt headcount và phân công tuyển dụng trước khi xuất bản tin.")
        return
    req = db.query(JobRequisition).filter_by(id=job.requisition_id).first()
    if not req or req.status != "approved":
        raise HTTPException(409, "Tin phải gắn với tờ trình đã được HR phê duyệt.")
    if job.department_id != req.department_id or job.quantity != req.quantity or (job.max_salary or 0) > (req.max_salary or 0):
        raise HTTPException(409, "Phòng ban, headcount và mức lương của tin phải nằm trong tờ trình đã duyệt.")
    if publishing:
        validate_recruiter(db.get(User, req.recruiter_id) if req.recruiter_id else None)
        from datetime import datetime
        if job.deadline and job.deadline.date() < datetime.utcnow().date():
            raise HTTPException(400, "Không thể xuất bản tin có hạn tuyển dụng ở quá khứ.")
        if not (job.job_description or "").strip() or not (job.requirements or "").strip():
            raise HTTPException(400, "Bổ sung mô tả công việc và yêu cầu ứng viên trước khi xuất bản.")
        reserve_budget(db, req)
