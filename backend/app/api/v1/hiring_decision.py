import json
from datetime import datetime
from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.application import JobApplication, ApplicationLog
from app.models.hiring_decision import HiringDecision
from app.models.interview import InterviewSchedule
from app.models.job import JobPosting
from app.models.offer_onboarding import JobOffer
from app.models.referral_eval import CandidateEvaluation
from app.models.requisition import JobRequisition

router = APIRouter()
REVIEW_ROLES = {'admin', 'manager', 'hiring_manager', 'hr_manager', 'recruiter'}


def scoped_applications(db, user):
    query = db.query(JobApplication)
    if set(user.role.split(',')).intersection({'admin', 'hr_manager', 'recruiter'}):
        return query
    return query.join(JobPosting, JobApplication.job_id == JobPosting.id).join(JobRequisition, JobPosting.requisition_id == JobRequisition.id).filter(JobRequisition.created_by_id == user.id)


def application_summary(db, item):
    decision = db.query(HiringDecision).filter_by(application_id=item.id).first()
    evaluations = db.query(CandidateEvaluation).filter_by(application_id=item.id).all()
    return dict(id=item.id, code=item.code, full_name=item.full_name, email=item.email,
                job_title=item.job.title if item.job else None, status=item.status,
                evaluation_count=len(evaluations), average_score=round(sum(e.overall_score for e in evaluations)/len(evaluations), 2) if evaluations else None,
                hiring_decision=decision.to_dict() if decision else None)


@router.get('/hiring/applications')
def list_decisions(search: str = '', decision: str = 'all', page: int = Query(1, ge=1),
                   page_size: int = Query(20, ge=1, le=100), authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, REVIEW_ROLES)
    query = scoped_applications(db, user).filter(JobApplication.status.in_(['interviewing', 'offered', 'hired', 'rejected']))
    if search.strip():
        term = f'%{search.strip()}%'
        query = query.filter(or_(JobApplication.full_name.ilike(term), JobApplication.email.ilike(term), JobApplication.code.ilike(term)))
    if decision != 'all':
        if decision not in {'pending', 'selected', 'rejected'}:
            raise HTTPException(422, 'Bộ lọc quyết định không hợp lệ')
        ids = db.query(HiringDecision.application_id)
        query = query.filter(~JobApplication.id.in_(ids)) if decision == 'pending' else query.filter(JobApplication.id.in_(ids.filter(HiringDecision.decision == decision)))
    total = query.count()
    items = query.order_by(JobApplication.updated_at.desc(), JobApplication.id.desc()).offset((page-1)*page_size).limit(page_size).all()
    return dict(items=[application_summary(db, item) for item in items], page=page, pages=max(1, ceil(total/page_size)), total=total)


@router.get('/hiring/applications/{application_id}')
def decision_detail(application_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, REVIEW_ROLES)
    item = scoped_applications(db, user).filter(JobApplication.id == application_id).first()
    if not item:
        raise HTTPException(404, 'Không tìm thấy hồ sơ thuộc phạm vi phụ trách')
    evaluations = db.query(CandidateEvaluation).filter_by(application_id=item.id).order_by(CandidateEvaluation.created_at).all()
    rounds = db.query(InterviewSchedule).filter_by(application_id=item.id).order_by(InterviewSchedule.round_number, InterviewSchedule.start_time).all()
    return {**application_summary(db, item), 'rounds': [dict(id=round.id, title=round.title or round.round_name, round_name=round.round_name, round_number=round.round_number,
            start_time=round.start_time.isoformat()+'Z', status=round.status, evaluations=[e.to_dict() for e in evaluations if e.interview_id == round.id]) for round in rounds],
            'general_evaluations': [e.to_dict() for e in evaluations if not e.interview_id]}


class DecisionInput(BaseModel):
    decision: str = Field(..., pattern='^(selected|rejected)$')
    note: str = Field(..., min_length=5, max_length=2000)


@router.put('/hiring/applications/{application_id}/decision')
def decide(application_id: int, payload: DecisionInput, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = require_roles(authorization, db, {'admin', 'manager', 'hiring_manager'})
    item = scoped_applications(db, user).filter(JobApplication.id == application_id).with_for_update().first()
    if not item:
        raise HTTPException(404, 'Không tìm thấy hồ sơ thuộc phạm vi phụ trách')
    if item.status not in {'interviewing'}:
        raise HTTPException(409, 'Chỉ được quyết định hồ sơ đang phỏng vấn, trước khi gửi offer')
    if len(payload.note.strip()) < 5:
        raise HTTPException(422, 'Cần nhập ý kiến ít nhất 5 ký tự')
    if payload.decision == 'selected' and not db.query(CandidateEvaluation).filter_by(application_id=item.id).first():
        raise HTTPException(409, 'Cần có ít nhất một phiếu đánh giá trước khi quyết định tuyển')
    offers = db.query(JobOffer).filter_by(application_id=item.id).all()
    if any(offer.status in {'sent', 'accepted'} for offer in offers):
        raise HTTPException(409, 'Đã gửi offer, không thể thay đổi quyết định tại đây')
    record = db.query(HiringDecision).filter_by(application_id=item.id).first()
    if not record:
        record = HiringDecision(application_id=item.id)
        db.add(record)
    record.decision, record.note, record.decided_by_id = payload.decision, payload.note.strip(), user.id
    record.updated_at = datetime.utcnow()
    previous = item.status
    if payload.decision == 'rejected':
        item.status = 'rejected'
        item.rejection_reason = payload.note.strip()
        for offer in offers:
            if offer.status in {'draft', 'changes_requested', 'pending_approval', 'approved'}:
                offer.status = 'rejected'
                history = json.loads(offer.approval_history or '[]')
                for step in history:
                    if step['status'] in {'pending', 'waiting'}:
                        step.update(status='cancelled', note='Trưởng bộ phận đã loại hồ sơ')
                offer.approval_history = json.dumps(history, ensure_ascii=False)
    db.add(ApplicationLog(application_id=item.id, user_id=user.id, from_status=previous, to_status=item.status,
                          note=f"Quyết định {'tuyển' if payload.decision == 'selected' else 'loại'}: {payload.note.strip()}"))
    db.commit()
    return decision_detail(application_id, authorization, db)
