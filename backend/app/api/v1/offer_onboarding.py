from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.user import User
from app.schemas.offer_onboarding import (
    OfferCreate,
    OfferResponse,
    OfferStatusUpdate,
    PaginatedOffersResponse,
    OnboardingUpdate,
    OnboardingResponse,
    PaginatedOnboardingResponse,
)

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}

def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)

def generate_offer_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(JobOffer).count() + 1
    return f"OFR-{year}-{count:04d}"

# ==================== OFFER LETTER ENDPOINTS ====================

@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: OfferCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    app_record = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    code = generate_offer_code(db)

    offer = JobOffer(
        code=code,
        application_id=payload.application_id,
        position_title=payload.position_title.strip(),
        offered_salary=payload.offered_salary,
        start_date=payload.start_date,
        probation_period_months=payload.probation_period_months,
        work_location=payload.work_location.strip(),
        expiration_date=payload.expiration_date,
        notes=payload.notes,
        status="sent",
    )

    # Update Application Status to 'offered'
    app_record.status = "offered"

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return offer.to_dict()

@router.get("/offers/manage/all", response_model=PaginatedOffersResponse)
def list_offers(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    query = db.query(JobOffer)
    if status_filter != "all":
        query = query.filter(JobOffer.status == status_filter)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                JobOffer.code.ilike(term),
                JobOffer.position_title.ilike(term),
            )
        )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(JobOffer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [o.to_dict() for o in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.post("/offers/{offer_id}/status", response_model=OfferResponse)
def update_offer_status(
    offer_id: int,
    payload: OfferStatusUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin Offer")

    offer.status = payload.status
    if payload.notes:
        offer.notes = payload.notes
    offer.updated_at = datetime.utcnow()

    # If offer accepted -> update application status to 'hired' and trigger OnboardingChecklist
    if payload.status == "accepted":
        app_record = db.query(JobApplication).filter(JobApplication.application_id == offer.application_id).first() if hasattr(JobApplication, 'application_id') else db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
        if app_record:
            app_record.status = "hired"

        # Check if onboarding checklist exists
        ob = db.query(OnboardingChecklist).filter(OnboardingChecklist.application_id == offer.application_id).first()
        if not ob:
            ob = OnboardingChecklist(
                application_id=offer.application_id,
                status="in_progress",
            )
            db.add(ob)

    db.commit()
    db.refresh(offer)

    return offer.to_dict()

@router.get("/applications/{application_id}/offer", response_model=Optional[OfferResponse])
def get_application_offer(
    application_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    offer = db.query(JobOffer).filter(JobOffer.application_id == application_id).order_by(JobOffer.created_at.desc()).first()
    if not offer:
        return None
    return offer.to_dict()

# ==================== ONBOARDING CHECKLIST ENDPOINTS ====================

@router.get("/onboarding/manage/all", response_model=PaginatedOnboardingResponse)
def list_onboardings(
    status_filter: str = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    query = db.query(OnboardingChecklist)
    if status_filter != "all":
        query = query.filter(OnboardingChecklist.status == status_filter)

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(OnboardingChecklist.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [ob.to_dict() for ob in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.put("/onboarding/{onboarding_id}", response_model=OnboardingResponse)
def update_onboarding(
    onboarding_id: int,
    payload: OnboardingUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    ob = db.query(OnboardingChecklist).filter(OnboardingChecklist.id == onboarding_id).first()
    if not ob:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục Onboarding")

    if payload.welcome_email_sent is not None:
        ob.welcome_email_sent = payload.welcome_email_sent
    if payload.equipment_prepared is not None:
        ob.equipment_prepared = payload.equipment_prepared
    if payload.account_created is not None:
        ob.account_created = payload.account_created
    if payload.documents_submitted is not None:
        ob.documents_submitted = payload.documents_submitted
    if payload.orientation_scheduled is not None:
        ob.orientation_scheduled = payload.orientation_scheduled
    if payload.status is not None:
        ob.status = payload.status

    # Auto calculate status if all tasks checked
    tasks = [ob.welcome_email_sent, ob.equipment_prepared, ob.account_created, ob.documents_submitted, ob.orientation_scheduled]
    if all(tasks):
        ob.status = "completed"
    elif any(tasks):
        ob.status = "in_progress"

    ob.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ob)

    return ob.to_dict()
