import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.db.session import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.master_data import CompetencyCriterion
from app.models.referral_eval import InternalReferral, CandidateEvaluation
from app.api.deps import get_current_user_obj
from app.services.access_scope import (
    role_codes, require_any_permission, ensure_application_visible, ensure_can_manage_application, forbidden,
    visible_applications, FULL_ACCESS_ROLES,
)

router = APIRouter()

RECOMMENDATIONS = {"hire", "hold", "reject"}
REOPEN_WINDOW = timedelta(hours=24)
STAFF_VIEW_ROLES = FULL_ACCESS_ROLES | {"recruiter", "hiring_manager", "manager"}


class ReferralCreate(BaseModel):
    candidate_name: str = Field(..., min_length=1)
    candidate_email: EmailStr
    candidate_phone: str = Field(..., min_length=1)
    job_posting_id: int
    cv_url: Optional[str] = None
    relationship_note: Optional[str] = None


class CriterionRating(BaseModel):
    criterion_id: str
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class EvaluationCreate(BaseModel):
    application_id: int
    interview_id: Optional[int] = None
    ratings: List[CriterionRating] = Field(default_factory=list)  # S6-07 scorecard (1–5 per criterion)
    technical_score: Optional[int] = Field(default=None, ge=1, le=10)
    culture_fit_score: Optional[int] = Field(default=None, ge=1, le=10)
    communication_score: Optional[int] = Field(default=None, ge=1, le=10)
    overall_score: Optional[int] = Field(default=None, ge=1, le=10)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    recommendation: str  # hire, hold, reject (bắt buộc chọn kết luận — S6-08)
    comments: Optional[str] = None


def _is_assigned_interviewer(db: Session, user: User, application_id: int, interview_id: Optional[int] = None) -> bool:
    q = db.query(InterviewInterviewer.id).join(
        InterviewSchedule, InterviewSchedule.id == InterviewInterviewer.interview_id
    ).filter(InterviewSchedule.application_id == application_id, InterviewInterviewer.interviewer_id == user.id)
    if interview_id:
        q = q.filter(InterviewSchedule.id == interview_id)
    return q.first() is not None


def _scorecard(db: Session, ratings: List[CriterionRating]):
    """Validate ratings against one framework and compute the weighted total (0–100). Returns (framework_id, snapshot, score)."""
    if not ratings:
        return None, None, None
    criteria = {c.id: c for c in db.query(CompetencyCriterion).filter(CompetencyCriterion.id.in_([r.criterion_id for r in ratings])).all()}
    if len(criteria) != len({r.criterion_id for r in ratings}):
        raise HTTPException(status_code=422, detail="Có tiêu chí đánh giá không tồn tại.")
    frameworks = {c.framework_id for c in criteria.values()}
    if len(frameworks) != 1:
        raise HTTPException(status_code=422, detail="Các tiêu chí phải thuộc cùng một khung năng lực.")
    framework_id = frameworks.pop()
    expected = {c.id for c in db.query(CompetencyCriterion).filter(CompetencyCriterion.framework_id == framework_id).all()}
    if expected != set(criteria):
        raise HTTPException(status_code=422, detail="Phiếu đánh giá phải chấm đủ mọi tiêu chí của khung năng lực.")
    snapshot, total_weight, weighted = [], 0, 0.0
    for r in ratings:
        c = criteria[r.criterion_id]
        snapshot.append({"criterion_id": c.id, "code": c.code, "name": c.name, "weight": c.weight, "score": r.score, "comment": r.comment})
        total_weight += c.weight
        weighted += c.weight * r.score
    score = round(weighted / total_weight / 5 * 100, 1) if total_weight else None
    return framework_id, json.dumps(snapshot, ensure_ascii=False), score


def _eval_out(e: CandidateEvaluation) -> dict:
    data = e.to_dict()
    try:
        data["criteria"] = json.loads(e.criteria_json) if e.criteria_json else []
    except ValueError:
        data["criteria"] = []
    data.update({"interview_id": e.interview_id, "framework_id": e.framework_id, "weighted_score": e.weighted_score,
                 "reopened_at": e.reopened_at.isoformat() if e.reopened_at else None})
    return data


# ------------------------------------------------------------------ referrals (S4-07)
@router.get("")
def list_referrals(current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    query = db.query(InternalReferral)
    if not (role_codes(db, current_user) & FULL_ACCESS_ROLES):
        query = query.filter(InternalReferral.referrer_id == current_user.id)
    out = []
    for r in query.order_by(InternalReferral.created_at.desc()).all():
        data = r.to_dict()
        app = db.query(JobApplication).filter(JobApplication.referral_code == f"REF-{r.id}").first()
        # the referrer only sees a general status (S4-07 AC3)
        data["candidate_status"] = app.candidate_view()["public_status"] if app else None
        out.append(data)
    return out


@router.post("", status_code=201)
def create_referral(payload: ReferralCreate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    from app.api.v1.applications import ApplicationCreate, _create_application
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_posting_id).first()
    if not job or job.status != "published":
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tuyển dụng đang mở")
    email = payload.candidate_email.strip().lower()
    if email == (current_user.email or "").lower():
        raise HTTPException(status_code=422, detail="Không thể tự giới thiệu chính mình.")
    if db.query(InternalReferral.id).filter(InternalReferral.job_posting_id == job.id, InternalReferral.candidate_email == email).first():
        raise HTTPException(status_code=409, detail="Ứng viên này đã được giới thiệu cho vị trí này.")

    ref = InternalReferral(referrer_id=current_user.id, candidate_name=payload.candidate_name.strip(), candidate_email=email,
                           candidate_phone=payload.candidate_phone.strip(), job_posting_id=job.id, cv_url=payload.cv_url,
                           relationship_note=payload.relationship_note, bonus_amount=5000000, status="pending", payout_status="unpaid")
    db.add(ref)
    db.flush()
    # The referred person enters the real pipeline, labelled with the referral source and referrer (S4-07 AC2).
    _create_application(db, ApplicationCreate(
        job_posting_id=job.id, full_name=ref.candidate_name, email=email, phone=ref.candidate_phone, cv_url=payload.cv_url,
        cover_letter=f"Giới thiệu bởi {current_user.full_name}: {payload.relationship_note or ''}".strip(),
        referral_code=f"REF-{ref.id}", source="Giới thiệu nội bộ",
    ), job, None, None, "Giới thiệu nội bộ")
    db.commit()
    db.refresh(ref)
    return ref.to_dict()


# ------------------------------------------------------------------ evaluations (S6-07, S6-08, S7-03, S6-09)
@router.get("/evaluations")
def list_evaluations(application_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_application_visible(db, current_user, app)
    if app.candidate_id is not None and app.candidate_id == current_user.id:
        return []  # candidates never see the panel's evaluations of themselves
    query = db.query(CandidateEvaluation).filter(CandidateEvaluation.application_id == app.id)
    if not (role_codes(db, current_user) & STAFF_VIEW_ROLES):
        # S6-08: an interviewer cannot see other evaluations before submitting their own.
        if not query.filter(CandidateEvaluation.evaluator_id == current_user.id).first():
            return []
    return [_eval_out(e) for e in query.order_by(CandidateEvaluation.created_at.asc()).all()]


@router.get("/evaluations/summary")
def evaluation_summary(application_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S7-03: all rounds in one view — average per criterion and the conclusions."""
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    evals = db.query(CandidateEvaluation).filter(CandidateEvaluation.application_id == app.id).all()
    per_criterion = defaultdict(list)
    for e in evals:
        if not e.criteria_json:
            continue
        try:
            raw = json.loads(e.criteria_json)
            if isinstance(raw, dict):
                for k, v in raw.items():
                    per_criterion[str(k)].append(v if isinstance(v, (int, float)) else v.get("score", 0))
            elif isinstance(raw, list):
                for item in raw:
                    if isinstance(item, dict):
                        name = item.get("name") or item.get("code") or "Tiêu chí"
                        per_criterion[str(name)].append(item.get("score", 0))
        except Exception:
            pass
    weighted = [e.weighted_score for e in evals if e.weighted_score is not None]
    return {
        "application_id": app.id, "candidate": app.full_name, "evaluation_count": len(evals),
        "criteria_averages": {k: round(sum(v) / len(v), 2) for k, v in per_criterion.items()},
        "average_weighted_score": round(sum(weighted) / len(weighted), 1) if weighted else None,
        "recommendations": {r: sum(1 for e in evals if e.recommendation == r) for r in RECOMMENDATIONS},
        "evaluations": [_eval_out(e) for e in evals],
    }


@router.get("/evaluations/compare")
def compare_candidates(job_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S6-09: candidates of one position with ≥1 submitted evaluation, per-criterion scores, sorted by total."""
    apps = visible_applications(db, current_user).filter(JobApplication.job_posting_id == job_id).all()
    rows = []
    for app in apps:
        if not (role_codes(db, current_user) & STAFF_VIEW_ROLES):
            continue
        evals = db.query(CandidateEvaluation).filter(CandidateEvaluation.application_id == app.id).all()
        if not evals:
            continue
        crit = defaultdict(list)
        for e in evals:
            if not e.criteria_json:
                continue
            try:
                raw = json.loads(e.criteria_json)
                if isinstance(raw, dict):
                    for k, v in raw.items():
                        crit[str(k)].append(v if isinstance(v, (int, float)) else v.get("score", 0))
                elif isinstance(raw, list):
                    for item in raw:
                        if isinstance(item, dict):
                            name = item.get("name") or item.get("code") or "Tiêu chí"
                            crit[str(name)].append(item.get("score", 0))
            except Exception:
                pass
        weighted = [e.weighted_score for e in evals if e.weighted_score is not None]
        legacy = [e.overall_score * 10 for e in evals if e.weighted_score is None and e.overall_score]
        scores = weighted + legacy
        rows.append({"application_id": app.id, "candidate": app.full_name, "status": app.status,
                     "criteria": {k: round(sum(v) / len(v), 2) for k, v in crit.items()},
                     "total_score": round(sum(scores) / len(scores), 1) if scores else None, "evaluations": len(evals)})
    rows.sort(key=lambda r: (r["total_score"] is None, -(r["total_score"] or 0)))
    return rows


@router.post("/evaluations", status_code=201)
def create_evaluation(payload: EvaluationCreate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "interview:evaluate")
    if payload.recommendation not in RECOMMENDATIONS:
        raise HTTPException(status_code=422, detail="Kết luận bắt buộc: hire (Nên tuyển), hold (Cân nhắc), reject (Không nên tuyển).")
    app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    if not _is_assigned_interviewer(db, current_user, app.id, payload.interview_id) and "admin" not in role_codes(db, current_user):
        raise forbidden("Chỉ người phỏng vấn được mời mới được nộp phiếu đánh giá cho ứng viên này.")
    if db.query(CandidateEvaluation.id).filter(
        CandidateEvaluation.application_id == app.id, CandidateEvaluation.evaluator_id == current_user.id,
        CandidateEvaluation.interview_id == payload.interview_id,
    ).first():
        raise HTTPException(status_code=409, detail="Bạn đã nộp phiếu đánh giá cho ứng viên này; phiếu đã nộp không sửa được.")
    if not payload.ratings and payload.overall_score is None:
        raise HTTPException(status_code=422, detail="Phiếu đánh giá cần chấm theo tiêu chí hoặc nhập điểm tổng.")
    framework_id, snapshot, weighted = _scorecard(db, payload.ratings)
    legacy = {k: getattr(payload, k) or 0 for k in ("technical_score", "culture_fit_score", "communication_score")}
    overall = payload.overall_score or (round(weighted / 10) if weighted is not None else 0)
    eval_item = CandidateEvaluation(
        application_id=app.id, evaluator_id=current_user.id, interview_id=payload.interview_id, **legacy,
        overall_score=max(1, overall) if overall else 0, strengths=payload.strengths, weaknesses=payload.weaknesses,
        recommendation=payload.recommendation, comments=payload.comments, framework_id=framework_id,
        criteria_json=snapshot, weighted_score=weighted,
    )
    db.add(eval_item)
    db.commit()
    db.refresh(eval_item)
    return _eval_out(eval_item)


@router.post("/evaluations/{evaluation_id}/reopen")
def reopen_evaluation(evaluation_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S6-08 AC3: a recruiter may reopen a submitted evaluation within 24 hours of submission."""
    e = db.query(CandidateEvaluation).filter(CandidateEvaluation.id == evaluation_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu đánh giá")
    if not (role_codes(db, current_user) & (FULL_ACCESS_ROLES | {"recruiter"})):
        raise forbidden("Chỉ recruiter mới được mở lại phiếu đánh giá.")
    ensure_can_manage_application(db, current_user, db.query(JobApplication).filter(JobApplication.id == e.application_id).one())
    if datetime.utcnow() - e.created_at > REOPEN_WINDOW:
        raise HTTPException(status_code=409, detail="Đã quá 24 giờ kể từ khi nộp, không thể mở lại phiếu.")
    e.reopened_at = datetime.utcnow()
    db.commit()
    db.refresh(e)
    return _eval_out(e)


@router.put("/evaluations/{evaluation_id}")
def update_evaluation(evaluation_id: int, payload: EvaluationCreate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    e = db.query(CandidateEvaluation).filter(CandidateEvaluation.id == evaluation_id).first()
    if not e or e.evaluator_id != current_user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu đánh giá")
    if not e.reopened_at:
        raise HTTPException(status_code=409, detail="Phiếu đã nộp không sửa được, trừ khi recruiter mở lại.")
    if payload.recommendation not in RECOMMENDATIONS:
        raise HTTPException(status_code=422, detail="Kết luận bắt buộc: hire, hold, reject.")
    framework_id, snapshot, weighted = _scorecard(db, payload.ratings)
    e.framework_id, e.criteria_json, e.weighted_score = framework_id or e.framework_id, snapshot or e.criteria_json, weighted if weighted is not None else e.weighted_score
    for k in ("technical_score", "culture_fit_score", "communication_score", "overall_score"):
        if getattr(payload, k) is not None:
            setattr(e, k, getattr(payload, k))
    e.strengths, e.weaknesses, e.recommendation, e.comments = payload.strengths, payload.weaknesses, payload.recommendation, payload.comments
    e.reopened_at = None  # one edit per reopening
    db.commit()
    db.refresh(e)
    return _eval_out(e)
