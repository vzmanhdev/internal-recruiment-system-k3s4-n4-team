from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.application import JobApplication
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.api.deps import get_current_user_obj

router = APIRouter()

class OfferCreate(BaseModel):
    application_id: int
    offered_salary: int = Field(..., example=25000000)
    currency: str = "VND"
    probation_salary_percentage: int = 85
    start_date: str = "2026-10-15"
    probation_duration_months: int = 2
    work_location: str = "Hà Nội"
    notes: Optional[str] = None

class OfferStatusUpdate(BaseModel):
    status: str # sent, accepted, declined
    decline_reason: Optional[str] = None

class ChecklistItemUpdate(BaseModel):
    task_name: str
    is_completed: bool

@router.get("")
def list_offers(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    query = db.query(JobOffer)
    if status_filter:
        query = query.filter(JobOffer.status == status_filter)

    offers = query.order_by(JobOffer.created_at.desc()).all()
    return [o.to_dict() for o in offers]

@router.get("/{offer_id}")
def get_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời nhận việc")
    return offer.to_dict()

@router.post("", status_code=201)
def create_offer(
    payload: OfferCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    offer = db.query(JobOffer).filter(JobOffer.application_id == payload.application_id).first()
    if not offer:
        offer = JobOffer(
            application_id=payload.application_id,
            offered_salary=payload.offered_salary,
            currency=payload.currency,
            probation_salary_percentage=payload.probation_salary_percentage,
            start_date=payload.start_date,
            probation_duration_months=payload.probation_duration_months,
            work_location=payload.work_location,
            notes=payload.notes,
            status="sent",
            created_by_id=current_user.id
        )
        db.add(offer)
        db.commit()
        db.refresh(offer)

        # Default Onboarding Checklist items
        default_tasks = [
            ("Chuẩn bị Hợp đồng Thử việc & Hồ sơ nhân sự", "HR"),
            ("Tạo Email Công ty & Tài khoản Slack/Jira", "IT"),
            ("Bàn giao Máy tính & Thiết bị làm việc", "IT"),
            ("Sắp xếp Chỗ ngồi & Thẻ nhân viên", "Admin"),
            ("Buổi OrientOnboarding & Giới thiệu Phòng ban", "HR"),
        ]
        for task_name, role in default_tasks:
            item = OnboardingChecklist(
                offer_id=offer.id,
                task_name=task_name,
                assigned_role=role,
                is_completed=False
            )
            db.add(item)

        # Update Application status to offered
        app.status = "offered"
        db.commit()
        db.refresh(offer)

    return offer.to_dict()

@router.put("/{offer_id}/status")
def update_offer_status(
    offer_id: int,
    payload: OfferStatusUpdate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời nhận việc")

    offer.status = payload.status
    if payload.decline_reason:
        offer.decline_reason = payload.decline_reason

    if payload.status == "accepted" and offer.application:
        offer.application.status = "hired"

    db.commit()
    db.refresh(offer)

    return offer.to_dict()
