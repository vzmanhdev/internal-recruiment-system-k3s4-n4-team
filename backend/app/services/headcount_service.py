"""S3-04 headcount budget: remaining = approved budget − headcount committed by live requisitions of that year."""
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.hr import HeadcountBudget
from app.models.requisition import JobRequisition

COMMITTED_STATES = ["pending_manager", "pending_hr", "pending_executive", "approved", "filled"]


def headcount_status(db: Session, department_id: int, year: Optional[int] = None, exclude_requisition_id: Optional[int] = None) -> dict:
    year = year or datetime.utcnow().year
    budget = db.query(HeadcountBudget).filter(
        HeadcountBudget.department_id == department_id, HeadcountBudget.year == year
    ).first()
    q = db.query(func.coalesce(func.sum(JobRequisition.quantity), 0)).filter(
        JobRequisition.department_id == department_id,
        JobRequisition.status.in_(COMMITTED_STATES),
        func.strftime("%Y", JobRequisition.created_at) == str(year) if db.bind.dialect.name == "sqlite"
        else func.extract("year", JobRequisition.created_at) == year,
    )
    if exclude_requisition_id:
        q = q.filter(JobRequisition.id != exclude_requisition_id)
    committed = int(q.scalar() or 0)
    if not budget:
        return {"department_id": department_id, "year": year, "has_budget": False, "budget": None,
                "committed": committed, "remaining": None}
    return {"department_id": department_id, "year": year, "has_budget": True, "budget": budget.budget_quantity,
            "committed": committed, "remaining": budget.budget_quantity - committed}
