from datetime import datetime, timezone
import json
from uuid import uuid4
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.api.v1.auth import require_roles
from app.core.security import decode_access_token
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
from app.services.audit import write_audit_log

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager", "recruiter"}
OFFER_REVIEW_ROLES = HR_ADMIN_ROLES | {"manager", "hiring_manager", "approver"}

def utc(value):
    return value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value

def validate_offer_dates(offer):
    if not offer.start_date or not offer.expiration_date:
        raise HTTPException(422, 'Cần bổ sung ngày nhận việc và hạn phản hồi trước khi trình duyệt/gửi')
    now = datetime.utcnow()
    if utc(offer.start_date) <= now or utc(offer.expiration_date) <= now:
        raise HTTPException(422, 'Ngày nhận việc và hạn phản hồi phải ở tương lai')
    if utc(offer.expiration_date) > utc(offer.start_date):
        raise HTTPException(422, 'Hạn phản hồi phải trước hoặc bằng ngày nhận việc')

def outside_band(application, salary):
    job = application.job
    return bool(job and ((job.min_salary is not None and salary < job.min_salary) or (job.max_salary is not None and salary > job.max_salary)))

def review_offer(db, offer_id):
    offer = db.query(JobOffer).filter_by(id=offer_id).with_for_update().first()
    if not offer:
        raise HTTPException(404, 'Không tìm thấy thư mời làm việc')
    return offer

def check_manager_scope(user, offer):
    if set(user.role.split(',')).intersection(HR_ADMIN_ROLES | {'approver'}):
        return
    requisition = offer.application.job.requisition if offer.application.job else None
    if not requisition or requisition.created_by_id != user.id:
        raise HTTPException(403, 'Bạn chỉ được duyệt offer của yêu cầu do mình phụ trách')

def get_hr_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, HR_ADMIN_ROLES)

def get_current_user(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để thực hiện thao tác này")
    user_id = decode_access_token(authorization.split(" ", 1)[1])
    if not user_id:
        raise HTTPException(status_code=401, detail="Phiên làm việc không hợp lệ hoặc đã hết hạn")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản chưa được kích hoạt hoặc không khả dụng")
    return user

def ensure_onboarding(db: Session, application_id: int) -> None:
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.application_id == application_id).first()
    if not checklist:
        db.add(OnboardingChecklist(application_id=application_id, status="pending"))

def candidate_offer(offer):
    data = offer.to_dict()
    for field in ('approvals', 'salary_exception_reason', 'min_salary', 'max_salary'):
        data.pop(field, None)
    return data

def generate_offer_code(db: Session) -> str:
    return f"OFR-{datetime.utcnow().year}-{uuid4().hex[:10].upper()}"

# ==================== OFFER LETTER ENDPOINTS ====================

@router.get('/offers/applications/{application_id}/context')
def offer_context(application_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    get_hr_user(authorization, db)
    application = db.query(JobApplication).filter_by(id=application_id).first()
    if not application or not application.job:
        raise HTTPException(404, 'Không tìm thấy hồ sơ hoặc vị trí tuyển dụng')
    job = application.job
    return dict(min_salary=job.min_salary, max_salary=job.max_salary, work_location=job.work_location)

@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: OfferCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    creator = get_hr_user(authorization, db)

    app_record = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    validate_offer_dates(payload)
    if app_record.status in {'hired', 'rejected', 'withdrawn'}:
        raise HTTPException(409, 'Hồ sơ đã kết thúc, không thể tạo offer')
    if outside_band(app_record, payload.offered_salary) and len((payload.salary_exception_reason or '').strip()) < 10:
        raise HTTPException(422, 'Lương ngoài dải: cần giải trình ít nhất 10 ký tự để trình duyệt ngoại lệ')

    code = generate_offer_code(db)

    offer = JobOffer(
        code=code,
        application_id=payload.application_id,
        position_title=payload.position_title.strip(),
        offered_salary=payload.offered_salary,
        start_date=utc(payload.start_date),
        probation_period_months=payload.probation_period_months,
        work_location=payload.work_location.strip(),
        expiration_date=utc(payload.expiration_date),
        notes=payload.notes,
        status="draft",
        created_by_id=creator.id,
        salary_exception_reason=payload.salary_exception_reason,
        approval_history='[]',
    )

    # An internal draft must not change the candidate pipeline before approval.

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
    reviewer = require_roles(authorization, db, OFFER_REVIEW_ROLES)

    query = db.query(JobOffer)
    if not set(reviewer.role.split(',')).intersection(HR_ADMIN_ROLES | {'approver'}):
        from app.models.job import JobPosting
        from app.models.requisition import JobRequisition
        own_applications = db.query(JobApplication.id).join(JobPosting, JobApplication.job_id == JobPosting.id).join(JobRequisition, JobPosting.requisition_id == JobRequisition.id).filter(JobRequisition.created_by_id == reviewer.id)
        query = query.filter(JobOffer.application_id.in_(own_applications))
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

@router.get("/offers/my", response_model=PaginatedOffersResponse)
def list_my_offers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(authorization, db)
    query = (
        db.query(JobOffer)
        .join(JobApplication, JobOffer.application_id == JobApplication.id)
        .filter(or_(JobApplication.candidate_id == current_user.id, JobApplication.email == current_user.email.lower()))
        .filter(JobOffer.status.in_(['sent', 'accepted', 'declined', 'expired']))
    )
    total = query.count()
    items = query.order_by(JobOffer.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [candidate_offer(offer) for offer in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, ceil(total / page_size)),
    }

@router.post("/offers/{offer_id}/respond", response_model=OfferResponse)
def respond_to_offer(
    offer_id: int,
    payload: OfferStatusUpdate,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if payload.status not in {"accepted", "declined"}:
        raise HTTPException(status_code=422, detail="Ứng viên chỉ có thể chấp nhận hoặc từ chối thư mời")
    current_user = get_current_user(authorization, db)
    offer = review_offer(db, offer_id)
    if not offer or not offer.application:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời làm việc")
    application = offer.application
    if application.candidate_id != current_user.id and application.email != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Bạn không có quyền phản hồi thư mời này")
    if offer.status != "sent":
        raise HTTPException(status_code=400, detail="Thư mời này đã được phản hồi hoặc không còn hiệu lực")
    if offer.expiration_date and offer.expiration_date <= datetime.utcnow():
        raise HTTPException(410, 'Thư mời đã hết hạn phản hồi')

    offer.status = payload.status
    if payload.notes:
        offer.response_notes = payload.notes.strip()
    offer.updated_at = datetime.utcnow()
    application.status = "hired" if payload.status == "accepted" else "rejected"
    if payload.status == "accepted":
        ensure_onboarding(db, offer.application_id)
    db.commit()
    db.refresh(offer)
    write_audit_log(
        db,
        action="Chấp nhận thư mời" if payload.status == "accepted" else "Từ chối thư mời",
        module="Thư mời làm việc",
        request=request,
        user=current_user,
        status="success" if payload.status == "accepted" else "warning",
        details=offer.code,
    )
    return candidate_offer(offer)

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

    if payload.status != 'sent' or offer.status != 'approved':
        raise HTTPException(409, 'Chỉ offer đã được duyệt đầy đủ mới được gửi. Ứng viên tự phản hồi tại trang thư mời')
    validate_offer_dates(offer)
    offer.status = 'sent'
    offer.application.status = 'offered'
    offer.updated_at = datetime.utcnow()

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

@router.post('/offers/{offer_id}/submit', response_model=OfferResponse)
def submit_offer(offer_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    get_hr_user(authorization, db)
    offer = review_offer(db, offer_id)
    if offer.status not in {'draft', 'changes_requested'}:
        raise HTTPException(409, 'Chỉ bản nháp hoặc offer cần bổ sung mới được trình duyệt')
    validate_offer_dates(offer)
    if outside_band(offer.application, offer.offered_salary) and len((offer.salary_exception_reason or '').strip()) < 10:
        raise HTTPException(422, 'Cần giải trình cho lương ngoài dải')
    steps = json.loads(offer.approval_history or '[]')
    chain = [('manager', 'Trưởng bộ phận')]
    if outside_band(offer.application, offer.offered_salary):
        chain.append(('approver', 'Ban phê duyệt ngoại lệ lương'))
    else:
        chain.append(('hr_manager', 'Trưởng phòng Nhân sự'))
    for step in steps:
        if step['status'] in {'pending', 'waiting'}:
            step['status'] = 'cancelled'
    round_number = 1 + max([item.get('round', 0) for item in steps], default=0)
    steps.extend([dict(role=role, label=label, status='pending' if index == 0 else 'waiting', round=round_number) for index, (role, label) in enumerate(chain)])
    offer.approval_history = json.dumps(steps, ensure_ascii=False)
    offer.status = 'pending_approval'
    db.commit()
    return offer.to_dict()

@router.put('/offers/{offer_id}', response_model=OfferResponse)
def edit_offer(offer_id: int, payload: OfferCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    get_hr_user(authorization, db)
    offer = review_offer(db, offer_id)
    if offer.status not in {'draft', 'changes_requested'} or payload.application_id != offer.application_id:
        raise HTTPException(409, 'Chỉ được sửa nội dung bản nháp hoặc offer cần bổ sung, không được đổi ứng viên')
    validate_offer_dates(payload)
    if outside_band(offer.application, payload.offered_salary) and len((payload.salary_exception_reason or '').strip()) < 10:
        raise HTTPException(422, 'Cần giải trình ít nhất 10 ký tự cho lương ngoài dải')
    for key, value in payload.model_dump(exclude={'application_id'}).items():
        setattr(offer, key, utc(value) if isinstance(value, datetime) else value)
    db.commit()
    return offer.to_dict()

@router.post('/offers/{offer_id}/review', response_model=OfferResponse)
def approve_offer(offer_id: int, payload: OfferStatusUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, OFFER_REVIEW_ROLES)
    offer = review_offer(db, offer_id)
    check_manager_scope(user, offer)
    steps = json.loads(offer.approval_history or '[]')
    active = next((step for step in steps if step['status'] == 'pending'), None)
    if offer.status != 'pending_approval' or not active:
        raise HTTPException(409, 'Offer không ở trạng thái chờ duyệt')
    roles = set(user.role.split(','))
    permitted = {active['role'], 'admin'} | ({'hiring_manager'} if active['role'] == 'manager' else set())
    if not roles.intersection(permitted):
        raise HTTPException(403, f"Đang chờ {active['label']} phê duyệt")
    if payload.status == 'approved' and active['role'] == 'hr_manager' and outside_band(offer.application, offer.offered_salary):
        raise HTTPException(403, 'HR chỉ duyệt offer trong dải chuẩn. Yêu cầu bổ sung và trình lại để chuyển cấp ngoại lệ')
    if payload.status not in {'approved', 'rejected', 'changes_requested'}:
        raise HTTPException(422, 'Thao tác phê duyệt không hợp lệ')
    if payload.status != 'approved' and len((payload.notes or '').strip()) < 5:
        raise HTTPException(422, 'Từ chối / yêu cầu bổ sung phải nhập ý kiến ít nhất 5 ký tự')
    active.update(status=payload.status, reviewer=user.full_name, reviewer_id=user.id, note=(payload.notes or '').strip(), reviewed_at=datetime.utcnow().isoformat() + 'Z')
    if payload.status == 'approved':
        following = next((step for step in steps if step['status'] == 'waiting'), None)
        if following:
            following['status'] = 'pending'
        else:
            offer.status = 'approved'
    else:
        offer.status = payload.status
    offer.approval_history = json.dumps(steps, ensure_ascii=False)
    db.commit()
    return offer.to_dict()

@router.get('/offers/{offer_id}', response_model=OfferResponse)
def offer_detail(offer_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    offer = review_offer(db, offer_id)
    if set(user.role.split(',')).intersection(OFFER_REVIEW_ROLES):
        check_manager_scope(user, offer)
    elif offer.status not in {'sent', 'accepted', 'declined', 'expired'} or (offer.application.candidate_id != user.id and offer.application.email.lower() != user.email.lower()):
        raise HTTPException(404, 'Không tìm thấy thư mời của bạn')
    return offer.to_dict() if set(user.role.split(",")).intersection(OFFER_REVIEW_ROLES) else candidate_offer(offer)

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
    return save_onboarding(db, ob, payload)


def save_onboarding(db, ob, payload):

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
    else:
        ob.status = "pending"
    ob.is_completed = all(tasks)
    ob.completed_at = datetime.utcnow() if all(tasks) else None

    ob.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ob)

    return ob.to_dict()


def candidate_checklists(db, user):
    accepted = db.query(JobOffer.application_id).filter(JobOffer.status == 'accepted')
    return db.query(OnboardingChecklist).join(JobApplication, OnboardingChecklist.application_id == JobApplication.id).filter(
        or_(JobApplication.candidate_id == user.id, JobApplication.email == user.email.lower()),
        JobApplication.id.in_(accepted))


@router.get('/onboarding/my', response_model=PaginatedOnboardingResponse)
def my_onboarding(application_id: Optional[int] = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                  authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    query = candidate_checklists(db, user)
    if application_id is not None:
        query = query.filter(OnboardingChecklist.application_id == application_id)
    total = query.count()
    items = query.order_by(OnboardingChecklist.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    return dict(items=[item.to_dict() for item in items], total=total, page=page, page_size=page_size, pages=max(1, ceil(total/page_size)))


class CandidateOnboardingUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    documents_submitted: bool


@router.put('/onboarding/{onboarding_id}/candidate', response_model=OnboardingResponse)
def candidate_update_onboarding(onboarding_id: int, payload: CandidateOnboardingUpdate,
                                authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    checklist = candidate_checklists(db, user).filter(OnboardingChecklist.id == onboarding_id).with_for_update().first()
    if not checklist:
        raise HTTPException(404, 'Không tìm thấy checklist nhận việc của bạn')
    return save_onboarding(db, checklist, OnboardingUpdate(documents_submitted=payload.documents_submitted))
