from datetime import datetime
import json
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
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.requisition import JobRequisition
from app.schemas.referral_eval import (
    EvaluationCreate,
    EvaluationResponse,
    PaginatedReferralsResponse,
    ReferralCreate,
    ReferralResponse,
    ReferralStatusUpdate,
    ScorecardSubmit,
)
from app.services.scorecards import interview_scorecard, calculate_scorecard
from pydantic import BaseModel

class QuestionMark(BaseModel):
    question_id: int
    asked: bool

router = APIRouter()

HR_ADMIN_ROLES = {"admin", "hr_manager"}
EVALUATION_ROLES = {"admin", "hr_manager", "recruiter", "hiring_manager", "manager", "interviewer"}

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

def get_evaluation_user(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, EVALUATION_ROLES)

def accessible_evaluation_applications(db: Session, user: User):
    query = db.query(JobApplication)
    if set(user.role.split(',')).intersection({'admin', 'hr_manager', 'recruiter'}):
        return query
    assigned_ids = db.query(InterviewSchedule.application_id).join(InterviewInterviewer).filter(InterviewInterviewer.interviewer_id == user.id)
    managed_job_ids = db.query(JobPosting.id).join(JobRequisition, JobPosting.requisition_id == JobRequisition.id).filter(JobRequisition.created_by_id == user.id)
    return query.filter(or_(JobApplication.id.in_(assigned_ids), JobApplication.job_id.in_(managed_job_ids)))

def get_internal_user(authorization: Optional[str], db: Session) -> User:
    user = get_current_user_from_header(authorization, db)
    roles = {role.strip() for role in user.role.split(",") if role.strip()}
    if not roles.intersection({"employee", "recruiter", "manager", "hr_manager", "admin"}):
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

def authorized_scorecard(db, interview_id, user):
    interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
    if not interview or not accessible_evaluation_applications(db, user).filter(JobApplication.id == interview.application_id).first():
        raise HTTPException(status_code=404, detail='Không tìm thấy lịch hoặc bạn chưa được phân công')
    if not set(user.role.split(',')).intersection({'admin', 'hr_manager', 'recruiter'}):
        if not db.query(InterviewInterviewer).filter_by(interview_id=interview_id, interviewer_id=user.id).first():
            raise HTTPException(status_code=403, detail='Bạn chưa được phân công đánh giá lịch này')
    return interview

def question_panel(db, interview, user):
    name, criteria, _ = interview_scorecard(db, interview, user.id)
    panel = db.query(InterviewInterviewer).filter_by(interview_id=interview.id, interviewer_id=user.id).first()
    if not panel:
        raise HTTPException(403, 'Chỉ người được phân công phỏng vấn mới được đánh dấu câu hỏi')
    marks = json.loads(panel.asked_questions or '[]')
    return panel, {'framework_name': name, 'questions': [dict(id=item['id'], competency=item['name'], text=f"Hãy kể một tình huống thực tế thể hiện {item['name'].lower()}. Bạn đã xử lý ra sao và kết quả thế nào?", guidance=item.get('description'), asked=item['id'] in marks) for item in criteria]}

@router.get('/interviews/{interview_id}/questions')
def get_questions(interview_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_evaluation_user(authorization, db)
    interview = authorized_scorecard(db, interview_id, user)
    return question_panel(db, interview, user)[1]

@router.put('/interviews/{interview_id}/questions')
def mark_question(interview_id: int, payload: QuestionMark, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_evaluation_user(authorization, db)
    interview = authorized_scorecard(db, interview_id, user)
    if interview.status == 'cancelled':
        raise HTTPException(409, 'Buổi phỏng vấn đã hủy')
    panel, data = question_panel(db, interview, user)
    if payload.question_id not in {item['id'] for item in data['questions']}:
        raise HTTPException(422, 'Câu hỏi không thuộc khung năng lực của lịch này')
    marks = set(json.loads(panel.asked_questions or '[]'))
    marks.add(payload.question_id) if payload.asked else marks.discard(payload.question_id)
    panel.asked_questions = json.dumps(sorted(marks))
    db.commit()
    return question_panel(db, interview, user)[1]

@router.get('/interviews/{interview_id}/scorecard')
def get_interview_scorecard(interview_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_evaluation_user(authorization, db)
    interview = authorized_scorecard(db, interview_id, user)
    name, criteria, saved = interview_scorecard(db, interview, user.id)
    return {'framework_name': name, 'criteria': criteria, 'evaluation': saved.to_dict() if saved else None}

@router.post('/interviews/{interview_id}/scorecard', response_model=EvaluationResponse)
def submit_interview_scorecard(interview_id: int, payload: ScorecardSubmit, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_evaluation_user(authorization, db)
    interview = authorized_scorecard(db, interview_id, user)
    if interview.status == 'cancelled':
        raise HTTPException(status_code=400, detail='Không thể chấm điểm lịch đã hủy')
    name, criteria, evaluation = interview_scorecard(db, interview, user.id)
    snapshots, total = calculate_scorecard(criteria, payload.criteria)
    if len(payload.feedback.strip()) < 5:
        raise HTTPException(status_code=400, detail='Nhận xét chung cần ít nhất 5 ký tự')
    if not evaluation:
        evaluation = CandidateEvaluation(application_id=interview.application_id, interview_id=interview.id, evaluator_id=user.id)
        db.add(evaluation)
    evaluation.framework_name = name
    evaluation.criteria_scores = json.dumps(snapshots, ensure_ascii=False)
    evaluation.overall_score = total
    evaluation.competency_score = total
    evaluation.culture_fit_score = total
    evaluation.recommendation = payload.recommendation
    evaluation.feedback = payload.feedback.strip()
    evaluation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(evaluation)
    return evaluation.to_dict()

@router.post("/applications/{application_id}/evaluations", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_application_evaluation(
    application_id: int,
    payload: EvaluationCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    hr_user = get_evaluation_user(authorization, db)

    app_record = accessible_evaluation_applications(db, hr_user).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    evaluation = db.query(CandidateEvaluation).filter_by(application_id=application_id, evaluator_id=hr_user.id, interview_id=None).first()
    if evaluation:
        for field, value in payload.model_dump().items():
            setattr(evaluation, field, value.strip() if isinstance(value, str) else value)
        evaluation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(evaluation)
        return evaluation.to_dict()
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
    user = get_evaluation_user(authorization, db)

    app_record = accessible_evaluation_applications(db, user).filter(JobApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")

    evaluations = (
        db.query(CandidateEvaluation)
        .filter(CandidateEvaluation.application_id == application_id)
        .order_by(CandidateEvaluation.created_at.desc())
        .all()
    )

    return [e.to_dict() for e in evaluations]

@router.get("/evaluations/comparison")
def compare_candidate_evaluations(
    application_ids: str = Query(""),
    final_only: bool = Query(False),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_evaluation_user(authorization, db)
    requested_ids = [int(value) for value in application_ids.split(",") if value.strip().isdigit()]
    applications_query = accessible_evaluation_applications(db, user)
    final_interview_ids = db.query(InterviewSchedule.id).filter(InterviewSchedule.is_final_round.is_(True), InterviewSchedule.status != 'cancelled')
    if final_only:
        finalist_ids = db.query(InterviewSchedule.application_id).filter(InterviewSchedule.id.in_(final_interview_ids))
        applications_query = applications_query.filter(JobApplication.id.in_(finalist_ids))
    if requested_ids:
        applications_query = applications_query.filter(JobApplication.id.in_(requested_ids))
    else:
        evaluated_ids = db.query(CandidateEvaluation.application_id)
        applications_query = applications_query.filter(JobApplication.id.in_(evaluated_ids))
    applications = applications_query.order_by(JobApplication.updated_at.desc()).limit(12).all()

    result = []
    for application in applications:
        evaluations_query = db.query(CandidateEvaluation).filter(CandidateEvaluation.application_id == application.id)
        if final_only:
            evaluations_query = evaluations_query.filter(CandidateEvaluation.interview_id.in_(final_interview_ids))
        evaluations = evaluations_query.order_by(CandidateEvaluation.created_at.asc()).all()
        if final_only and not evaluations:
            continue
        criterion_totals = {}
        for evaluation in evaluations:
            for criterion in json.loads(evaluation.criteria_scores or '[]'):
                key = str(criterion['id'])
                item = criterion_totals.setdefault(key, {'id':criterion['id'], 'name':criterion['name'], 'weight':criterion['weight'], 'sum':0, 'count':0})
                item['sum'] += criterion['score']
                item['count'] += 1
        count = len(evaluations)
        average = lambda field: round(sum(float(getattr(item, field) or 0) for item in evaluations) / count, 2) if count else 0
        result.append({
            "application_id": application.id,
            "candidate_name": application.full_name,
            "job_title": application.job.title if application.job else None,
            "fit_score": application.fit_score or 0,
            "overall_score": average("overall_score"),
            "competency_score": average("competency_score"),
            "culture_fit_score": average("culture_fit_score"),
            "evaluation_count": count,
            'criteria_scores': [{'id':item['id'], 'name':item['name'], 'weight':item['weight'], 'score':round(item['sum'] / item['count'], 2)} for item in criterion_totals.values()],
            'total_points': round(average('overall_score') * 20, 2),
            "recommendations": [item.recommendation for item in evaluations],
            "evaluators": [item.to_dict() for item in evaluations],
        })
    return result
