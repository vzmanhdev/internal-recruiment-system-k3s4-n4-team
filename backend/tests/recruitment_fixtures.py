from uuid import uuid4
from app.core.security import hash_password
from app.models.user import User
from app.models.requisition import JobRequisition
from app.models.headcount import HeadcountBudget


def approved_requisition(db, department_id, quantity=1, salary=100):
    """Seed approved headcount for tests focused on downstream candidate/job behavior."""
    recruiter = db.query(User).filter_by(email="fixture-recruiter@test.local").first()
    if not recruiter:
        recruiter = User(email="fixture-recruiter@test.local", full_name="Fixture Recruiter", role="recruiter", hashed_password=hash_password("Recruit123"), is_active=True, account_status="active")
        db.add(recruiter); db.flush()
    budget = db.query(HeadcountBudget).filter_by(department_id=department_id).first()
    if not budget:
        budget = HeadcountBudget(department_id=department_id, headcount_limit=10000, monthly_salary_limit=10**12)
        db.add(budget)
    req = JobRequisition(code=f"FIXTURE-{uuid4().hex}", title="Approved fixture", department_id=department_id, quantity=quantity,
                         reason="new_headcount", max_salary=salary, created_by_id=recruiter.id, recruiter_id=recruiter.id, status="approved")
    db.add(req); db.commit(); db.refresh(req)
    return req.id
