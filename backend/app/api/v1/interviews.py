from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.application import JobApplication, ApplicationLog
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.master_data import AskedQuestion, CompetencyCriterion, CompetencyFramework, InterviewQuestion
from app.models.referral_eval import CandidateEvaluation
from app.api.deps import get_current_user_obj
from app.services.notification_service import notify
from app.services.email_dispatch import frontend_link, new_link_token, queue_template_email
from app.services.access_scope import (
    visible_applications, ensure_application_visible, ensure_can_manage_application, require_any_permission,
    role_codes, FULL_ACCESS_ROLES,
)

router = APIRouter()

FEEDBACK_STATUSES = {"completed", "cancelled"}


class InterviewCreate(BaseModel):
    application_id: int
    round_number: int = Field(default=1, ge=1)
    round_name: str = "Vòng 1: HR Screening"
    scheduled_time: str  # ISO string or YYYY-MM-DD HH:MM
    duration_minutes: int = Field(default=45, ge=5, le=480)
    location: str = "Phòng Họp 302 / Google Meet"
    meeting_link: Optional[str] = None
    interviewer_ids: List[int] = Field(default_factory=list)
    override_conflict_reason: Optional[str] = None


class InterviewUpdate(BaseModel):
    scheduled_time: str
    duration_minutes: int = Field(default=45, ge=5, le=480)
    location: str
    meeting_link: Optional[str] = None
    interviewer_ids: List[int] = Field(..., min_length=1)
    override_conflict_reason: Optional[str] = None
    reason: Optional[str] = Field(default=None, max_length=500)  # why the slot moved (kept in the application history)


class InterviewCancel(BaseModel):
    reason: str = Field(..., min_length=1)


class BulkSchedule(BaseModel):
    application_ids: List[int] = Field(..., min_length=1)
    start_time: str
    slot_minutes: int = Field(default=30, ge=10, le=240)
    round_number: int = 1
    round_name: str = "Phỏng vấn tập trung"
    location: str = "Phòng Họp 302"
    meeting_link: Optional[str] = None
    interviewer_ids: List[int] = Field(..., min_length=1)
    confirm: bool = False


class CandidateReply(BaseModel):
    response: str  # confirmed, reschedule_requested
    note: Optional[str] = Field(default=None, max_length=1000)


class InterviewFeedbackUpdate(BaseModel):
    status: str = "completed"  # completed, cancelled
    feedback_notes: Optional[str] = None
    score: Optional[int] = Field(default=None, ge=1, le=10)
    passed: Optional[bool] = None


class AskedQuestionIn(BaseModel):
    question_id: str


def _parse_time(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Thời gian phỏng vấn không đúng định dạng (ISO 8601, ví dụ 2026-10-20T09:00).")
    return dt.replace(tzinfo=None)


def _overlaps(row: InterviewSchedule, start: datetime, end: datetime) -> bool:
    return row.scheduled_time < end and row.scheduled_time + timedelta(minutes=row.duration_minutes) > start


def find_conflicts(db: Session, interviewer_ids: List[int], location: str, meeting_link: Optional[str], start: datetime,
                   minutes: int, exclude_id: Optional[int] = None) -> List[dict]:
    """S6-04: conflicts per interviewer and per room (physical location; online links are not rooms)."""
    end = start + timedelta(minutes=minutes)
    candidates = db.query(InterviewSchedule).filter(InterviewSchedule.status == "scheduled",
                                                    InterviewSchedule.scheduled_time < end)
    if exclude_id:
        candidates = candidates.filter(InterviewSchedule.id != exclude_id)
    conflicts = []
    for row in candidates.all():
        if not _overlaps(row, start, end):
            continue
        shared = {i.interviewer_id for i in row.interviewers} & set(interviewer_ids)
        if shared:
            names = [u.full_name for u in db.query(User).filter(User.id.in_(shared)).all()]
            conflicts.append({"interview_id": row.id, "type": "interviewer", "who": names,
                              "at": row.scheduled_time.isoformat(), "candidate": row.application.full_name if row.application else None})
        if not meeting_link and not row.meeting_link and location and row.location and row.location.strip().lower() == location.strip().lower():
            conflicts.append({"interview_id": row.id, "type": "room", "room": row.location, "at": row.scheduled_time.isoformat(),
                              "candidate": row.application.full_name if row.application else None})
    return conflicts


def _raise_conflicts(conflicts: List[dict]):
    first = conflicts[0]
    what = ", ".join(first.get("who") or []) if first["type"] == "interviewer" else f"Phòng {first.get('room')}"
    raise HTTPException(status_code=409, detail={
        "code": "INTERVIEW_CONFLICT",
        "message": f"{what} đã có lịch trùng thời gian (lịch #{first['interview_id']}). Có thể ghi đè kèm lý do.",
        "conflicts": conflicts,
    })


def _validate_interviewers(db: Session, interviewer_ids: List[int]) -> List[int]:
    ids = list(dict.fromkeys(interviewer_ids))
    if not ids:
        raise HTTPException(status_code=422, detail="Cần chọn ít nhất một người phỏng vấn.")
    found = db.query(User.id).filter(User.id.in_(ids), User.account_status == "active").count()
    if found != len(ids):
        raise HTTPException(status_code=422, detail="Có người phỏng vấn không tồn tại hoặc đã bị khóa.")
    return ids


def _invite(db: Session, interview: InterviewSchedule, app: JobApplication, interviewer_ids: List[int], changed: bool = False):
    """S6-02/S6-05: notify interviewers; email the candidate a link valid only for this interview."""
    raw, digest = new_link_token()
    interview.confirmation_token_hash = digest
    interview.candidate_response = None
    names = ", ".join(u.full_name for u in db.query(User).filter(User.id.in_(interviewer_ids)).all())
    when = interview.scheduled_time.strftime("%H:%M - %d/%m/%Y")
    link = frontend_link("/candidate/interview/link", raw)
    queue_template_email(db, "INVITE_INTERVIEW", app.email, app.full_name, {
        "candidate_name": app.full_name, "job_title": app.job_posting.title if app.job_posting else "",
        "interview_time": when, "interview_location": interview.meeting_link or interview.location,
        "interviewer_name": names, "portal_link": link,
    }, related_entity="APPLICATION", related_id=app.id,
        footer_html=f'<p style="font-size:12px">Xác nhận tham dự hoặc đề nghị đổi lịch: <a href="{link}">{link}</a></p>')
    notify(db, interviewer_ids, "interview_invited",
           f"{'Cập nhật lịch' if changed else 'Lời mời'} phỏng vấn: {app.full_name}",
           f"{interview.round_name} lúc {when}", link=f"/interviewer?interview={interview.id}",
           entity_type="INTERVIEW", entity_id=interview.id)


def _get_interview(db: Session, interview_id: int) -> InterviewSchedule:
    interview = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")
    return interview


@router.get("")
def list_interviews(
    application_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    mine: bool = False,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db)
):
    visible_ids = visible_applications(db, current_user).with_entities(JobApplication.id)
    query = db.query(InterviewSchedule).filter(InterviewSchedule.application_id.in_(visible_ids))
    if mine:
        query = query.join(InterviewInterviewer, InterviewInterviewer.interview_id == InterviewSchedule.id).filter(
            InterviewInterviewer.interviewer_id == current_user.id)
    if application_id:
        query = query.filter(InterviewSchedule.application_id == application_id)
    if status_filter:
        query = query.filter(InterviewSchedule.status == status_filter)
    submitted = {e.interview_id for e in db.query(CandidateEvaluation.interview_id).filter(
        CandidateEvaluation.evaluator_id == current_user.id, CandidateEvaluation.interview_id.isnot(None)).all()}
    submitted_apps = {e.application_id for e in db.query(CandidateEvaluation.application_id).filter(
        CandidateEvaluation.evaluator_id == current_user.id).all()}
    out = []
    for i in query.order_by(InterviewSchedule.scheduled_time.asc()).all():
        data = i.to_dict()
        if i.application and i.application.candidate_id == current_user.id:
            # The candidate's own schedule: never expose panel feedback, scores or interviewer contacts.
            out.append({k: data[k] for k in ("id", "application_id", "job_title", "round_number", "round_name",
                                             "scheduled_time", "duration_minutes", "location", "meeting_link", "status")}
                       | {"candidate_response": i.candidate_response, "is_own_application": True})
            continue
        data.update({
            "cv_url": i.application.cv_url if i.application else None,
            "candidate_response": i.candidate_response,
            "cancel_reason": i.cancel_reason,
            "is_my_interview": current_user.id in {x.interviewer_id for x in i.interviewers},
            # S7-01 AC2: flag sessions whose evaluation I have not submitted yet
            "my_evaluation_submitted": i.id in submitted or i.application_id in submitted_apps,
        })
        out.append(data)
    return out


@router.post("/conflicts")
def check_conflicts(payload: InterviewUpdate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "interview:schedule")
    return {"conflicts": find_conflicts(db, payload.interviewer_ids, payload.location, payload.meeting_link,
                                        _parse_time(payload.scheduled_time), payload.duration_minutes)}


@router.post("/bulk")
def bulk_schedule(payload: BulkSchedule, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S6-03: consecutive slots for several candidates; preview first, then confirm (all-or-nothing)."""
    require_any_permission(db, current_user, "interview:schedule")
    start = _parse_time(payload.start_time)
    if start < datetime.now():
        raise HTTPException(status_code=422, detail="Không thể đặt lịch phỏng vấn trong quá khứ.")
    interviewer_ids = _validate_interviewers(db, payload.interviewer_ids)
    apps = []
    for app_id in dict.fromkeys(payload.application_ids):
        app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
        if not app:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy hồ sơ #{app_id}")
        ensure_can_manage_application(db, current_user, app)
        apps.append(app)
    slots = []
    for idx, app in enumerate(apps):
        slot_start = start + timedelta(minutes=idx * payload.slot_minutes)
        conflicts = find_conflicts(db, interviewer_ids, payload.location, payload.meeting_link, slot_start, payload.slot_minutes)
        slots.append({"application_id": app.id, "candidate": app.full_name, "start": slot_start.isoformat(),
                      "end": (slot_start + timedelta(minutes=payload.slot_minutes)).isoformat(), "conflicts": conflicts})
    if not payload.confirm:
        return {"preview": True, "slots": slots}
    if any(s["conflicts"] for s in slots):
        raise HTTPException(status_code=409, detail={"code": "INTERVIEW_CONFLICT", "message": "Có khe giờ bị trùng lịch, hãy chọn khung giờ khác.", "slots": slots})
    created = []
    for app, slot in zip(apps, slots):
        interview = InterviewSchedule(application_id=app.id, round_number=payload.round_number, round_name=payload.round_name,
                                      scheduled_time=datetime.fromisoformat(slot["start"]), duration_minutes=payload.slot_minutes,
                                      location=payload.location, meeting_link=payload.meeting_link, status="scheduled",
                                      created_by_id=current_user.id)
        db.add(interview)
        db.flush()
        for iid in interviewer_ids:
            db.add(InterviewInterviewer(interview_id=interview.id, interviewer_id=iid))
        db.flush()
        if app.status in {"submitted", "screening"}:
            db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status, to_status="interviewing",
                                  comment=f"Đặt lịch {payload.round_name}"))
            app.status, app.stage_entered_at = "interviewing", datetime.utcnow()
        _invite(db, interview, app, interviewer_ids)
        created.append(interview)
    db.commit()
    return {"preview": False, "created": [i.to_dict() for i in created]}


@router.post("", status_code=201)
def schedule_interview(payload: InterviewCreate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "interview:schedule")
    app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    if app.status in {"hired", "rejected", "withdrawn", "onboarded"}:
        raise HTTPException(status_code=409, detail=f"Không thể đặt lịch cho hồ sơ ở trạng thái '{app.status}'.")

    start = _parse_time(payload.scheduled_time)
    if start < datetime.now():
        raise HTTPException(status_code=422, detail="Không thể đặt lịch phỏng vấn trong quá khứ.")
    interviewer_ids = _validate_interviewers(db, payload.interviewer_ids)
    conflicts = find_conflicts(db, interviewer_ids, payload.location, payload.meeting_link, start, payload.duration_minutes)
    if conflicts and not (payload.override_conflict_reason or "").strip():
        _raise_conflicts(conflicts)

    interview = InterviewSchedule(
        application_id=app.id, round_number=payload.round_number, round_name=payload.round_name, scheduled_time=start,
        duration_minutes=payload.duration_minutes, location=payload.location, meeting_link=payload.meeting_link,
        status="scheduled", created_by_id=current_user.id,
        override_reason=payload.override_conflict_reason if conflicts else None,
    )
    db.add(interview)
    db.flush()
    for interviewer_id in interviewer_ids:
        db.add(InterviewInterviewer(interview_id=interview.id, interviewer_id=interviewer_id))
    db.flush()
    if app.status in {"submitted", "screening"}:
        db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status,
                              to_status="interviewing", comment=f"Đặt lịch {payload.round_name}"))
        app.status, app.stage_entered_at = "interviewing", datetime.utcnow()
    _invite(db, interview, app, interviewer_ids)
    db.commit()
    db.refresh(interview)
    return interview.to_dict()


def _has_evaluation(db: Session, interview: InterviewSchedule) -> bool:
    return db.query(CandidateEvaluation.id).filter(CandidateEvaluation.interview_id == interview.id).first() is not None


@router.put("/{interview_id}")
def reschedule_interview(interview_id: int, payload: InterviewUpdate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S6-06: change time, format and interviewers; everybody is notified; locked once an evaluation exists."""
    require_any_permission(db, current_user, "interview:schedule")
    interview = _get_interview(db, interview_id)
    ensure_can_manage_application(db, current_user, interview.application)
    if interview.status != "scheduled":
        raise HTTPException(status_code=409, detail=f"Không thể dời lịch ở trạng thái '{interview.status}'.")
    if _has_evaluation(db, interview):
        raise HTTPException(status_code=409, detail="Buổi phỏng vấn đã có phiếu đánh giá được nộp, không sửa được.")
    start = _parse_time(payload.scheduled_time)
    if start < datetime.now():
        raise HTTPException(status_code=422, detail="Không thể đặt lịch phỏng vấn trong quá khứ.")
    interviewer_ids = _validate_interviewers(db, payload.interviewer_ids)
    conflicts = find_conflicts(db, interviewer_ids, payload.location, payload.meeting_link, start, payload.duration_minutes, exclude_id=interview.id)
    if conflicts and not (payload.override_conflict_reason or "").strip():
        _raise_conflicts(conflicts)
    previous = {i.interviewer_id for i in interview.interviewers}
    interview.scheduled_time, interview.duration_minutes = start, payload.duration_minutes
    interview.location, interview.meeting_link = payload.location, payload.meeting_link
    interview.override_reason = payload.override_conflict_reason if conflicts else None
    db.query(InterviewInterviewer).filter(InterviewInterviewer.interview_id == interview.id).delete(synchronize_session=False)
    for iid in interviewer_ids:
        db.add(InterviewInterviewer(interview_id=interview.id, interviewer_id=iid))
    db.flush()
    db.refresh(interview)
    _invite(db, interview, interview.application, sorted(set(interviewer_ids) | previous), changed=True)
    app = interview.application
    db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status, to_status=app.status,
                          comment=f"Dời lịch {interview.round_name} sang {start.strftime('%H:%M %d/%m/%Y')}"
                                  + (f": {payload.reason.strip()}" if (payload.reason or "").strip() else "")))
    db.commit()
    db.refresh(interview)
    return interview.to_dict()


@router.post("/{interview_id}/cancel")
def cancel_interview(interview_id: int, payload: InterviewCancel, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "interview:schedule")
    interview = _get_interview(db, interview_id)
    ensure_can_manage_application(db, current_user, interview.application)
    if interview.status != "scheduled":
        raise HTTPException(status_code=409, detail=f"Không thể huỷ lịch ở trạng thái '{interview.status}'.")
    if _has_evaluation(db, interview):
        raise HTTPException(status_code=409, detail="Buổi phỏng vấn đã có phiếu đánh giá được nộp, không huỷ được.")
    interview.status, interview.cancel_reason, interview.confirmation_token_hash = "cancelled", payload.reason.strip(), None
    app = interview.application
    ids = [i.interviewer_id for i in interview.interviewers]
    notify(db, ids, "interview_invited", f"Huỷ lịch phỏng vấn: {app.full_name}", payload.reason,
           link=f"/interviewer?interview={interview.id}", entity_type="INTERVIEW", entity_id=interview.id)
    queue_template_email(db, "INTERVIEW_CANCELLED", app.email, app.full_name, {
        "candidate_name": app.full_name, "job_title": app.job_posting.title if app.job_posting else "",
        "cancel_reason": payload.reason.strip()}, related_entity="APPLICATION", related_id=app.id)
    db.commit()
    db.refresh(interview)
    return interview.to_dict()


@router.post("/{interview_id}/candidate-response")
def candidate_response(interview_id: int, payload: CandidateReply, current_user: User = Depends(get_current_user_obj),
                       db: Session = Depends(get_db)):
    """S6-05 for a signed-in applicant: confirm or ask to reschedule their own interview (same rules as the e-mail link)."""
    if payload.response not in ("confirmed", "reschedule_requested"):
        raise HTTPException(status_code=422, detail="Phản hồi chỉ nhận 'confirmed' hoặc 'reschedule_requested'.")
    interview = _get_interview(db, interview_id)
    app = interview.application
    if not app or app.candidate_id is None or app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn chỉ có thể phản hồi lịch phỏng vấn của chính mình.")
    if interview.status != "scheduled" or interview.scheduled_time < datetime.now():
        raise HTTPException(status_code=409, detail="Lịch phỏng vấn này không còn nhận phản hồi.")
    interview.candidate_response, interview.candidate_response_note = payload.response, payload.note
    interview.candidate_responded_at = datetime.utcnow()
    notify(db, [interview.created_by_id], "interview_response",
           f"{app.full_name} {'xác nhận tham dự' if payload.response == 'confirmed' else 'đề nghị đổi lịch'} phỏng vấn",
           payload.note or "", link=f"/hr/interviews?interview={interview.id}", entity_type="INTERVIEW", entity_id=interview.id)
    db.commit()
    return {"id": interview.id, "candidate_response": interview.candidate_response}


@router.put("/{interview_id}/feedback")
def update_interview_feedback(interview_id: int, payload: InterviewFeedbackUpdate,
                              current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    interview = _get_interview(db, interview_id)
    if payload.status not in FEEDBACK_STATUSES:
        raise HTTPException(status_code=422, detail="Trạng thái chỉ chấp nhận 'completed' hoặc 'cancelled'.")
    assigned = {i.interviewer_id for i in interview.interviewers}
    if current_user.id not in assigned and not (role_codes(db, current_user) & FULL_ACCESS_ROLES):
        raise HTTPException(status_code=403, detail="Chỉ người phỏng vấn được phân công mới được nhập kết quả buổi phỏng vấn này.")
    interview.status = payload.status
    if payload.feedback_notes is not None:
        interview.feedback_notes = payload.feedback_notes
    if payload.score is not None:
        interview.score = payload.score
    if payload.passed is not None:
        interview.passed = payload.passed
    db.commit()
    db.refresh(interview)
    return interview.to_dict()


def framework_for(db: Session, app: JobApplication) -> Optional[CompetencyFramework]:
    """The active framework applied to the position's job title (requisition job title, else posting title)."""
    names = set()
    job = app.job_posting
    if job:
        names.add(job.title)
        if job.requisition and job.requisition.job_title_name:
            names.add(job.requisition.job_title_name)
    for fw in db.query(CompetencyFramework).filter(CompetencyFramework.status == "active").all():
        if names & set(fw.job_titles()):
            return fw
    return None


@router.get("/{interview_id}/scorecard-template")
def scorecard_template(interview_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S6-07: evaluation form generated from the job title's competency framework (criteria + weights, scale 1–5)."""
    interview = _get_interview(db, interview_id)
    if current_user.id not in {i.interviewer_id for i in interview.interviewers} and not (role_codes(db, current_user) & FULL_ACCESS_ROLES):
        raise HTTPException(status_code=403, detail="Chỉ người phỏng vấn được mời mới mở được phiếu của buổi này.")
    fw = framework_for(db, interview.application)
    if not fw:
        return {"framework": None, "criteria": [], "scale": [1, 5]}
    criteria = db.query(CompetencyCriterion).filter(CompetencyCriterion.framework_id == fw.id).order_by(CompetencyCriterion.code).all()
    return {"framework": {"id": fw.id, "name": fw.name}, "criteria": [c.to_dict() for c in criteria], "scale": [1, 5]}


@router.get("/{interview_id}/question-suggestions")
def question_suggestions(interview_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S7-02: questions filtered by job title and the scorecard criteria; marks those already asked in earlier rounds."""
    interview = _get_interview(db, interview_id)
    if current_user.id not in {i.interviewer_id for i in interview.interviewers} and not (role_codes(db, current_user) & FULL_ACCESS_ROLES):
        raise HTTPException(status_code=403, detail="Chỉ người phỏng vấn được mời mới xem được bộ câu hỏi.")
    fw = framework_for(db, interview.application)
    criteria_ids = [c.id for c in db.query(CompetencyCriterion).filter(CompetencyCriterion.framework_id == fw.id).all()] if fw else []
    q = db.query(InterviewQuestion).filter(InterviewQuestion.status == "active")
    if criteria_ids:
        q = q.filter(InterviewQuestion.criteria_id.in_(criteria_ids))
    elif interview.application.job_posting:
        q = q.filter(InterviewQuestion.job_title.ilike(f"%{interview.application.job_posting.title}%"))
    asked = {a.question_id for a in db.query(AskedQuestion).filter(AskedQuestion.application_id == interview.application_id).all()}
    return [{**x.to_dict(), "already_asked": x.id in asked} for x in q.order_by(InterviewQuestion.code).all()]


@router.post("/{interview_id}/asked-questions", status_code=201)
def mark_question_asked(interview_id: int, payload: AskedQuestionIn, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    interview = _get_interview(db, interview_id)
    if current_user.id not in {i.interviewer_id for i in interview.interviewers}:
        raise HTTPException(status_code=403, detail="Chỉ người phỏng vấn được mời mới đánh dấu câu hỏi.")
    question = db.query(InterviewQuestion).filter(InterviewQuestion.id == payload.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    if not db.query(AskedQuestion.id).filter(AskedQuestion.application_id == interview.application_id, AskedQuestion.question_id == question.id).first():
        db.add(AskedQuestion(application_id=interview.application_id, question_id=question.id, interview_id=interview.id, asked_by_id=current_user.id))
        question.times_used = (question.times_used or 0) + 1
        db.commit()
    return {"success": True}
