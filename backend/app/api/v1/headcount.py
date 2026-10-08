from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.headcount import HeadcountBudget
from app.models.hr import Department
from app.models.user import User

router = APIRouter()


class BudgetInput(BaseModel):
    headcount_limit: int = Field(ge=0, le=100000)
    monthly_salary_limit: Decimal = Field(ge=0, le=10**15, decimal_places=2)


@router.get("/budgets")
def budgets(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, {"hr_manager", "admin"})
    return [b.to_dict() for b in db.query(HeadcountBudget).order_by(HeadcountBudget.department_id).all()]


@router.put("/budgets/{department_id}")
def save_budget(department_id: int, payload: BudgetInput, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, {"hr_manager", "admin"})
    if not db.get(Department, department_id):
        raise HTTPException(404, "Không tìm thấy phòng ban.")
    current = db.query(HeadcountBudget).filter_by(department_id=department_id).first()
    if current:
        result = db.execute(update(HeadcountBudget).where(
            HeadcountBudget.id == current.id,
            HeadcountBudget.reserved_headcount <= payload.headcount_limit,
            HeadcountBudget.reserved_monthly_salary <= payload.monthly_salary_limit,
        ).values(**payload.model_dump()), execution_options={"synchronize_session": False})
        if result.rowcount != 1:
            db.rollback()
            raise HTTPException(409, "Không thể giảm hạn mức xuống dưới ngân sách đã phê duyệt.")
    else:
        current = HeadcountBudget(department_id=department_id, **payload.model_dump())
        db.add(current)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ngân sách vừa được tạo. Vui lòng tải lại.")
    db.refresh(current)
    return current.to_dict()


@router.get("/recruiters")
def recruiters(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, {"hr_manager", "admin"})
    users = db.query(User).filter(User.is_active.is_(True), User.account_status == "active").order_by(User.full_name).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email} for u in users if "recruiter" in u.role.split(",")]
