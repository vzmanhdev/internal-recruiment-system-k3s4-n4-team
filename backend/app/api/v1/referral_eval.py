from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.referral_eval import InternalReferral, CandidateEvaluation
from app.api.deps import get_current_user_obj
from app.services.rbac_service import get_user_roles

router = APIRouter()

class ReferralCreate(BaseModel):
    candidate_name: str
    candidate_email: str
    candidate_phone: str
    job_posting_id: int
    cv_url: Optional[str] = None
    relationship_note: Optional[str] = None

class EvaluationCreate(BaseModel):
    application_id: int
    technical_score: int = Field(default=8, ge=1, le=10)
    culture_fit_score: int = Field(default=8, ge=1, le=10)
    communication_score: int = Field(default=8, ge=1, le=10)
    overall_score: int = Field(default=8, ge=1, le=10)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    recommendation: str = "hire" # hire, hold, reject
    comments: Optional[str] = None

@router.get("")
def list_referrals(
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(db, current_user)
    role_codes = {r["code"] for r in roles}

    query = db.query(InternalReferral)
    # If standard employee, only list their own referrals
    if "admin" not in role_codes and "hr_manager" not in role_codes:
        query = query.filter(InternalReferral.referrer_id == current_user.id)

    referrals = query.order_by(InternalReferral.created_at.desc()).all()
    return [r.to_dict() for r in referrals]

@router.post("", status_code=201)
def create_referral(
    payload: ReferralCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_posting_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng")

    ref = InternalReferral(
        referrer_id=current_user.id,
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        candidate_phone=payload.candidate_phone,
        job_posting_id=payload.job_posting_id,
        cv_url=payload.cv_url,
        relationship_note=payload.relationship_note,
        bonus_amount=5000000,
        status="pending",
        payout_status="unpaid"
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)

    return ref.to_dict()

@router.post("/evaluations", status_code=201)
def create_evaluation(
    payload: EvaluationCreate,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    eval_item = CandidateEvaluation(
        application_id=payload.application_id,
        evaluator_id=current_user.id,
        technical_score=payload.technical_score,
        culture_fit_score=payload.culture_fit_score,
        communication_score=payload.communication_score,
        overall_score=payload.overall_score,
        strengths=payload.strengths,
        weaknesses=payload.weaknesses,
        recommendation=payload.recommendation,
        comments=payload.comments
    )
    db.add(eval_item)
    db.commit()
    db.refresh(eval_item)

    return eval_item.to_dict()
