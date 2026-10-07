from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.offer import Offer, OnboardingTask
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter()

class OfferCreate(BaseModel):
    applicationId: str
    candidateName: str
    positionTitle: str
    salary: int
    startDate: str
    status: Optional[str] = "draft"

class OnboardingTaskCreate(BaseModel):
    candidateId: str
    candidateName: str
    taskName: str
    dueDate: str
    assignedTo: Optional[str] = "HR Specialist"

@router.get("", response_model=List[dict])
def get_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager", "recruiter", "approver"))
):
    offers = db.query(Offer).all()
    return [o.to_dict() for o in offers]

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_offer(
    offer_in: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager", "recruiter"))
):
    off_id = f"off-{int(db.query(Offer).count()) + 1}"
    new_offer = Offer(
        id=off_id,
        application_id=offer_in.applicationId,
        candidate_name=offer_in.candidateName,
        position_title=offer_in.positionTitle,
        salary=offer_in.salary,
        start_date=offer_in.startDate,
        status=offer_in.status or "draft"
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer.to_dict()

@router.get("/onboarding", response_model=List[dict])
def get_onboarding_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager", "recruiter", "approver"))
):
    tasks = db.query(OnboardingTask).all()
    return [t.to_dict() for t in tasks]

@router.post("/onboarding", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_onboarding_task(
    task_in: OnboardingTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    task_id = f"ob-{int(db.query(OnboardingTask).count()) + 1}"
    new_task = OnboardingTask(
        id=task_id,
        candidate_id=task_in.candidateId,
        candidate_name=task_in.candidateName,
        task_name=task_in.taskName,
        due_date=task_in.dueDate,
        assigned_to=task_in.assignedTo or "HR Specialist"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task.to_dict()

