"""Legacy URLs use the same authorization and approval workflow as Sprint 7."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.application import JobApplication
from app.schemas.offer_onboarding import OfferCreate as CanonicalOfferCreate, OfferStatusUpdate as CanonicalStatus
from app.api.v1 import offer_onboarding as workflow

router = APIRouter()


class OfferCreate(BaseModel):
    application_id: int
    offered_salary: float = Field(..., ge=0, allow_inf_nan=False)
    currency: str = 'VND'
    start_date: datetime = Field(default_factory=lambda: datetime.utcnow()+timedelta(days=14))
    expiration_date: Optional[datetime] = None
    probation_duration_months: int = Field(2, ge=0, le=12)
    work_location: str = 'Hà Nội'
    notes: Optional[str] = None
    salary_exception_reason: Optional[str] = None


class OfferStatusUpdate(BaseModel):
    status: str
    decline_reason: Optional[str] = None


@router.get('')
def list_offers(status_filter: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = workflow.get_current_user(authorization, db)
    if set(user.role.split(',')).intersection(workflow.OFFER_REVIEW_ROLES):
        return workflow.list_offers(search='', status_filter=status_filter or 'all', page=1, page_size=100, authorization=authorization, db=db)['items']
    return workflow.list_my_offers(page=1, page_size=100, authorization=authorization, db=db)['items']


@router.get('/{offer_id}')
def get_offer(offer_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    return workflow.offer_detail(offer_id, authorization, db)


@router.post('', status_code=201)
def create_offer(payload: OfferCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    workflow.get_hr_user(authorization, db)
    application = db.query(JobApplication).filter_by(id=payload.application_id).first()
    if not application:
        raise HTTPException(404, 'Không tìm thấy hồ sơ')
    if payload.currency != 'VND':
        raise HTTPException(422, 'Dải lương hiện áp dụng đơn vị VND')
    canonical = CanonicalOfferCreate(application_id=payload.application_id, position_title=application.job.title,
        offered_salary=payload.offered_salary, start_date=payload.start_date,
        expiration_date=payload.expiration_date or min(workflow.utc(payload.start_date), datetime.utcnow()+timedelta(days=7)),
        probation_period_months=payload.probation_duration_months, work_location=payload.work_location,
        notes=payload.notes, salary_exception_reason=payload.salary_exception_reason)
    return workflow.create_offer(canonical, authorization, db)


@router.put('/{offer_id}/status')
def update_offer_status(offer_id: int, payload: OfferStatusUpdate, request: Request, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    canonical = CanonicalStatus(status=payload.status, notes=payload.decline_reason)
    if payload.status in {'accepted','declined'}:
        return workflow.respond_to_offer(offer_id, canonical, request, authorization, db)
    return workflow.update_offer_status(offer_id, canonical, authorization, db)
