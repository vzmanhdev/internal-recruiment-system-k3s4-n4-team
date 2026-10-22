from datetime import datetime, timedelta, timezone
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
ICT = timezone(timedelta(hours=7))


def _current_time() -> datetime:
    """Current time in Vietnam ICT (UTC+7) as naive datetime for consistent DB comparisons."""
    return datetime.now(ICT).replace(tzinfo=None)


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
    preparation_notes: Optional[str] = None


class InterviewUpdate(BaseModel):
    scheduled_time: str
    duration_minutes: int = Field(default=45, ge=5, le=480)
    location: str
    meeting_link: Optional[str] = None
    interviewer_ids: List[int] = Field(..., min_length=1)
    override_conflict_reason: Optional[str] = None
    preparation_notes: Optional[str] = None
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
        raw = value.strip()
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        dt = datetime.fromisoformat(raw)
    except ValueError:
        raise HTTPException(status_code=422, detail="Thời gian phỏng vấn không đúng định dạng (ISO 8601, ví dụ 2026-10-20T09:00).")
    if dt.tzinfo is not None:
        dt = dt.astimezone(ICT).replace(tzinfo=None)
    return dt


def _overlaps(row: InterviewSchedule, start: datetime, end: datetime) -> bool:
    return row.scheduled_time < end and row.scheduled_time + timedelta(minutes=row.duration_minutes) > start


def find_conflicts(db: Session, interviewer_ids: List[int], location: str, meeting_link: Optional[str], start: datetime,
                   minutes: int, exclude_id: Optional[int] = None) -> List[dict]:
    """S6-04: conflicts per interviewer and per room with rich session details."""
    end = start + timedelta(minutes=minutes)
    candidates = db.query(InterviewSchedule).filter(
        InterviewSchedule.status == "scheduled",
        InterviewSchedule.scheduled_time < end
    )
    if exclude_id:
        candidates = candidates.filter(InterviewSchedule.id != exclude_id)
    conflicts = []
    
    # Pure online keywords that are not physical rooms
    online_keywords = {"trực tuyến", "online", "google meet", "teams", "ms teams", "zoom"}
    loc_clean = (location or "").strip()
    is_online_a = not loc_clean or loc_clean.lower() in online_keywords
    
    for row in candidates.all():
        if not _overlaps(row, start, end):
            continue
            
        row_end = row.scheduled_time + timedelta(minutes=row.duration_minutes)
        candidate_name = row.application.full_name if row.application else None
        candidate_id = row.application.candidate_id if row.application else None
        job_title = row.application.job_posting.title if (row.application and row.application.job_posting) else None
        round_name = row.round_name
        
        shared = {i.interviewer_id for i in row.interviewers} & set(interviewer_ids)
        if shared:
            conflicted_users = db.query(User).filter(User.id.in_(shared)).all()
            names = [u.full_name for u in conflicted_users]
            who_details = [{"id": u.id, "name": u.full_name, "email": u.email} for u in conflicted_users]
            conflicts.append({
                "interview_id": row.id,
                "type": "interviewer",
                "who": names,
                "who_details": who_details,
                "conflicting_interviewer_ids": list(shared),
                "at": row.scheduled_time.isoformat(),
                "start_time": row.scheduled_time.isoformat(),
                "end_time": row_end.isoformat(),
                "duration_minutes": row.duration_minutes,
                "candidate": candidate_name,
                "candidate_id": candidate_id,
                "job_title": job_title,
                "round_name": round_name,
                "location": row.location,
                "meeting_link": row.meeting_link,
            })
            
        row_loc_clean = (row.location or "").strip()
        is_online_b = not row_loc_clean or row_loc_clean.lower() in online_keywords
        if not is_online_a and not is_online_b and loc_clean.lower() == row_loc_clean.lower():
            conflicts.append({
                "interview_id": row.id,
                "type": "room",
                "room": row.location,
                "at": row.scheduled_time.isoformat(),
                "start_time": row.scheduled_time.isoformat(),
                "end_time": row_end.isoformat(),
                "duration_minutes": row.duration_minutes,
                "candidate": candidate_name,
                "candidate_id": candidate_id,
                "job_title": job_title,
                "round_name": round_name,
                "location": row.location,
                "meeting_link": row.meeting_link,
            })
    return conflicts


def suggest_next_slot(db: Session, interviewer_ids: List[int], location: str, meeting_link: Optional[str],
                      start: datetime, minutes: int, exclude_id: Optional[int] = None) -> Optional[dict]:
    """S6-04 AC2: Suggest the next available contiguous slot for the requested interviewers and room."""
    current_candidate = start
    for _ in range(12):  # Scan up to 12 forward steps (e.g., several hours ahead)
        confs = find_conflicts(db, interviewer_ids, location, meeting_link, current_candidate, minutes, exclude_id)
        if not confs:
            slot_end = current_candidate + timedelta(minutes=minutes)
            return {
                "start_time": current_candidate.isoformat(),
                "end_time": slot_end.isoformat(),
                "formatted_range": f"{current_candidate.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}",
                "formatted_date": current_candidate.strftime("%d/%m/%Y"),
            }
        max_end = None
        for c in confs:
            if "end_time" in c:
                c_end = _parse_time(c["end_time"])
                if max_end is None or c_end > max_end:
                    max_end = c_end
        next_dt = max_end if max_end else (current_candidate + timedelta(minutes=30))
        # Round up to nearest 15-minute mark
        remainder = next_dt.minute % 15
        if remainder != 0:
            next_dt += timedelta(minutes=15 - remainder)
        current_candidate = next_dt
    return None


def _raise_conflicts(conflicts: List[dict], suggested_slot: Optional[dict] = None):
    first = conflicts[0]
    what = ", ".join(first.get("who") or []) if first["type"] == "interviewer" else f"Phòng {first.get('room')}"
    candidate_info = f" với ứng viên '{first.get('candidate')}'" if first.get("candidate") else ""
    time_str = ""
    if "start_time" in first and "end_time" in first:
        try:
            st = _parse_time(first["start_time"]).strftime("%H:%M")
            et = _parse_time(first["end_time"]).strftime("%H:%M")
            time_str = f" lúc {st} - {et}"
        except Exception:
            pass
    raise HTTPException(status_code=409, detail={
        "code": "INTERVIEW_CONFLICT",
        "message": f"Phát hiện xung đột lịch! {what} đã có lịch{time_str}{candidate_info} (buổi #{first['interview_id']}). Trùng là lỗi chặn, cần xác nhận ghi đè kèm lý do (tối thiểu 10 ký tự) để lưu.",
        "conflicts": conflicts,
        "suggested_slot": suggested_slot,
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
    prep_notes = interview.preparation_notes or "Vui lòng có mặt trước 10 phút, trang phục lịch sự. Nếu phỏng vấn online, hãy kiểm tra camera/micro và kết nối Internet ổn định. Nếu trực tiếp, vui lòng mang theo CV bản in."
    queue_template_email(db, "INVITE_INTERVIEW", app.email, app.full_name, {
        "candidate_name": app.full_name, "job_title": app.job_posting.title if app.job_posting else "",
        "interview_time": when, "interview_location": interview.meeting_link or interview.location,
        "interviewer_name": names, "portal_link": link,
        "preparation_notes": prep_notes,
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
            out.append({k: data[k] for k in ("id", "application_id", "job_title", "department", "round_number", "round_name",
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
    start = _parse_time(payload.scheduled_time)
    conflicts = find_conflicts(db, payload.interviewer_ids, payload.location, payload.meeting_link,
                               start, payload.duration_minutes)
    suggested = suggest_next_slot(db, payload.interviewer_ids, payload.location, payload.meeting_link,
                                  start, payload.duration_minutes) if conflicts else None
    return {
        "has_conflict": len(conflicts) > 0,
        "conflicts": conflicts,
        "suggested_slot": suggested,
    }


@router.post("/bulk")
def bulk_schedule(payload: BulkSchedule, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S6-03: consecutive slots for several candidates; preview first, then confirm (all-or-nothing)."""
    require_any_permission(db, current_user, "interview:schedule")
    start = _parse_time(payload.start_time)
    if start < _current_time():
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
    if start < _current_time():
        raise HTTPException(status_code=422, detail="Không thể đặt lịch phỏng vấn trong quá khứ.")
    interviewer_ids = _validate_interviewers(db, payload.interviewer_ids)
    conflicts = find_conflicts(db, interviewer_ids, payload.location, payload.meeting_link, start, payload.duration_minutes)
    
    override_reason = (payload.override_conflict_reason or "").strip()
    if conflicts:
        if len(override_reason) < 10:
            suggested = suggest_next_slot(db, interviewer_ids, payload.location, payload.meeting_link, start, payload.duration_minutes)
            _raise_conflicts(conflicts, suggested)

    interview = InterviewSchedule(
        application_id=app.id, round_number=payload.round_number, round_name=payload.round_name, scheduled_time=start,
        duration_minutes=payload.duration_minutes, location=payload.location, meeting_link=payload.meeting_link,
        preparation_notes=payload.preparation_notes or "Vui lòng có mặt trước 10 phút, trang phục lịch sự. Nếu phỏng vấn online, hãy kiểm tra camera/micro và kết nối Internet ổn định. Nếu trực tiếp, vui lòng mang theo CV bản in.",
        status="scheduled", created_by_id=current_user.id,
        override_reason=override_reason if (conflicts and override_reason) else None,
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
    
    if conflicts and override_reason:
        conflict_desc = "; ".join([f"buổi #{c['interview_id']} ({c['type']}: {', '.join(c.get('who') or []) or c.get('room')})" for c in conflicts])
        db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status,
                              to_status=app.status, comment=f"Xác nhận ghi đè xung đột lịch với {conflict_desc}. Lý do: {override_reason}"))
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
    if start < _current_time():
        raise HTTPException(status_code=422, detail="Không thể đặt lịch phỏng vấn trong quá khứ.")
    interviewer_ids = _validate_interviewers(db, payload.interviewer_ids)
    conflicts = find_conflicts(db, interviewer_ids, payload.location, payload.meeting_link, start, payload.duration_minutes, exclude_id=interview.id)
    
    override_reason = (payload.override_conflict_reason or "").strip()
    if conflicts:
        if len(override_reason) < 10:
            suggested = suggest_next_slot(db, interviewer_ids, payload.location, payload.meeting_link, start, payload.duration_minutes, exclude_id=interview.id)
            _raise_conflicts(conflicts, suggested)

    previous = {i.interviewer_id for i in interview.interviewers}
    interview.scheduled_time, interview.duration_minutes = start, payload.duration_minutes
    interview.location, interview.meeting_link = payload.location, payload.meeting_link
    interview.override_reason = override_reason if (conflicts and override_reason) else None
    if payload.preparation_notes is not None:
        interview.preparation_notes = payload.preparation_notes
    db.query(InterviewInterviewer).filter(InterviewInterviewer.interview_id == interview.id).delete(synchronize_session=False)
    for iid in interviewer_ids:
        db.add(InterviewInterviewer(interview_id=interview.id, interviewer_id=iid))
    db.flush()
    db.refresh(interview)
    _invite(db, interview, interview.application, sorted(set(interviewer_ids) | previous), changed=True)
    app = interview.application
    
    reschedule_comment = f"Dời lịch {interview.round_name} sang {start.strftime('%H:%M %d/%m/%Y')}" + (f": {payload.reason.strip()}" if (payload.reason or "").strip() else "")
    if conflicts and override_reason:
        conflict_desc = "; ".join([f"buổi #{c['interview_id']} ({c['type']}: {', '.join(c.get('who') or []) or c.get('room')})" for c in conflicts])
        reschedule_comment += f" [Ghi đè xung đột với {conflict_desc}. Lý do: {override_reason}]"
        
    db.add(ApplicationLog(application_id=app.id, changed_by_id=current_user.id, from_status=app.status, to_status=app.status,
                          comment=reschedule_comment))
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
    interview.status, interview.cancel_reason = "cancelled", payload.reason.strip()
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


@router.delete("/{interview_id}", status_code=204)
def delete_interview(interview_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "interview:schedule")
    interview = _get_interview(db, interview_id)
    ensure_can_manage_application(db, current_user, interview.application)
    if _has_evaluation(db, interview):
        raise HTTPException(status_code=409, detail="Buổi phỏng vấn đã có phiếu đánh giá được nộp, không thể xóa.")
    db.query(InterviewInterviewer).filter(InterviewInterviewer.interview_id == interview.id).delete(synchronize_session=False)
    db.delete(interview)
    db.commit()
    return None


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
    recipients = [interview.created_by_id]
    if interview.interviewers:
        recipients.extend(intv.interviewer_id for intv in interview.interviewers)
    action_label = "xác nhận tham dự" if payload.response == "confirmed" else "đề nghị đổi lịch"
    notify(db, list(dict.fromkeys(recipients)), "interview_response",
           f"{app.full_name} {action_label} phỏng vấn",
           payload.note or "", link=f"/recruiter/interviews?interview={interview.id}", entity_type="INTERVIEW", entity_id=interview.id)
    db.commit()
    return {
        "id": interview.id,
        "candidate_response": interview.candidate_response,
        "candidate_response_note": interview.candidate_response_note,
        "candidate_responded_at": interview.candidate_responded_at.isoformat() if interview.candidate_responded_at else None,
        "message": f"Đã ghi nhận {action_label} của bạn thành công.",
    }


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
