from datetime import datetime
from math import ceil
from typing import Optional, List
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.job import JobPosting
from app.models.referral_eval import InternalReferral, CandidateEvaluation
from app.models.user import User
from app.schemas.referral_eval import (
    EvaluationCreate,
    EvaluationResponse,
    PaginatedReferralsResponse,
    ReferralCreate,
    ReferralResponse,
    ReferralStatusUpdate,
)

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}

def get_current_user_from_header(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập để thực hiện thao tác này")
    token = authorization.split(" ", 1)[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên làm việc không hợp lệ hoặc đã hết hạn")
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản chưa được kích hoạt hoặc không khả dụng")
    return user

def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)

def get_internal_user(authorization: Optional[str], db: Session) -> User:
    user = get_current_user_from_header(authorization, db)
    roles = {role.strip() for role in user.role.split(",") if role.strip()}
    if not roles.intersection({"employee", "manager", "hr_manager", "admin"}):
        raise HTTPException(status_code=403, detail="Chức năng giới thiệu ứng viên chỉ dành cho nhân sự nội bộ")
    return user

def generate_ref_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(InternalReferral).count() + 1
    return f"REF-{year}-{count:04d}"

# ==================== INTERNAL REFERRAL ENDPOINTS ====================

@router.post("/referrals", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    payload: ReferralCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_internal_user(authorization, db)

    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job or job.status != "published":
        raise HTTPException(status_code=404, detail="Không tìm thấy vị trí tuyển dụng hoặc tin đã hết hạn nhận hồ sơ")

    code = generate_ref_code(db)

    referral = InternalReferral(
        code=code,
        referrer_id=current_user.id,
        job_id=payload.job_id,
        candidate_name=payload.candidate_name.strip(),
        candidate_email=payload.candidate_email.lower().strip(),
        candidate_phone=payload.candidate_phone.strip(),
        cv_url=payload.cv_url,
        relationship_note=payload.relationship_note,
        status="pending",
        bonus_amount=0.0,
    )

    db.add(referral)
    db.commit()
    db.refresh(referral)

    return referral.to_dict()

@router.get("/referrals/my", response_model=PaginatedReferralsResponse)
def get_my_referrals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_internal_user(authorization, db)

    query = db.query(InternalReferral).filter(InternalReferral.referrer_id == current_user.id)
    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(InternalReferral.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [ref.to_dict() for ref in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.get("/referrals/manage/all", response_model=PaginatedReferralsResponse)
def list_manage_referrals(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    query = db.query(InternalReferral)
    if status_filter != "all":
        query = query.filter(InternalReferral.status == status_filter)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InternalReferral.candidate_name.ilike(term),
                InternalReferral.candidate_email.ilike(term),
                InternalReferral.code.ilike(term),
            )
        )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(InternalReferral.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [ref.to_dict() for ref in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.post("/referrals/{referral_id}/status", response_model=ReferralResponse)
def update_referral_status(
    referral_id: int,
    payload: ReferralStatusUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    referral = db.query(InternalReferral).filter(InternalReferral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi giới thiệu nhân sự")

    valid_statuses = {"pending", "contacted", "interviewed", "hired", "bonus_paid", "rejected"}
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")

    referral.status = payload.status
    if payload.bonus_amount is not None:
        referral.bonus_amount = payload.bonus_amount
    referral.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(referral)

    return referral.to_dict()

# ==================== CANDIDATE EVALUATION ENDPOINTS ====================

@router.post("/applications/{application_id}/evaluations", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_application_evaluation(
    application_id: int,
    payload: EvaluationCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    hr_user = get_hr_user(authorization, db)

    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    evaluation = CandidateEvaluation(
        application_id=application_id,
        evaluator_id=hr_user.id,
        overall_score=payload.overall_score,
        competency_score=payload.competency_score,
        culture_fit_score=payload.culture_fit_score,
        recommendation=payload.recommendation,
        feedback=payload.feedback.strip(),
    )

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    return evaluation.to_dict()

@router.get("/applications/{application_id}/evaluations", response_model=List[EvaluationResponse])
def get_application_evaluations(
    application_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    app_record = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    evaluations = (
        db.query(CandidateEvaluation)
        .filter(CandidateEvaluation.application_id == application_id)
        .order_by(CandidateEvaluation.created_at.desc())
        .all()
    )

    return [e.to_dict() for e in evaluations]
