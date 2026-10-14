from datetime import datetime, timedelta, timezone
import base64
import binascii
import hashlib
import hmac
import json
from math import ceil
from typing import Optional, List
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.core.security import decode_access_token
from app.core.config import settings
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
    CandidateInterviewResponse,
    InterviewConflictCheck,
    InterviewConflictResponse,
    InterviewBatchCreate,
    PaginatedInterviewsResponse,
)
from app.services.audit import write_audit_log
from app.services.interview_email import send_interview_invitation

router = APIRouter()

INTERVIEW_MANAGER_ROLES = {"admin", "hr_manager", "recruiter"}

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
    return require_roles(authorization, db, INTERVIEW_MANAGER_ROLES)

def _encode_response_token(schedule: InterviewSchedule) -> str:
    email = schedule.application.email.lower() if schedule.application else ""
    payload = {"interview_id": schedule.id, "email": email, "expires": int((datetime.now(timezone.utc) + timedelta(days=14)).timestamp())}
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(settings.SECRET_KEY.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"

def _decode_response_token(token: str) -> dict:
    try:
        encoded, signature = token.rsplit(".", 1)
        expected = hmac.new(settings.SECRET_KEY.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        padding = "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(encoded + padding).decode())
        if int(payload.get("expires", 0)) < int(datetime.now(timezone.utc).timestamp()):
            raise HTTPException(status_code=410, detail="Liên kết phản hồi lịch phỏng vấn đã hết hạn")
        return payload
    except HTTPException:
        raise
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, binascii.Error):
        raise HTTPException(status_code=400, detail="Liên kết phản hồi lịch phỏng vấn không hợp lệ")

def _serialize_schedule(schedule: InterviewSchedule, include_token: bool = False) -> dict:
    result = schedule.to_dict()
    result['accepts_response'] = schedule.status in {'scheduled', 'rescheduled'} and schedule.start_time > datetime.utcnow()
    for key in ('start_time', 'end_time', 'candidate_proposed_start_time', 'candidate_response_at', 'created_at', 'updated_at'):
        value = result.get(key)
        if value:
            result[key] = value + 'Z'
    if include_token:
        result["response_token"] = _encode_response_token(schedule)
    return result

def _find_conflicts(db: Session, payload: InterviewConflictCheck) -> list[dict]:
    query = db.query(InterviewSchedule).filter(
        InterviewSchedule.status.in_(["scheduled", "rescheduled"]),
        InterviewSchedule.start_time < payload.end_time,
        InterviewSchedule.end_time > payload.start_time,
    )
    if payload.exclude_interview_id:
        query = query.filter(InterviewSchedule.id != payload.exclude_interview_id)

    schedules = query.all()
    selected_interviewers = set(payload.interviewer_ids)
    normalized_location = payload.location_or_link.strip().casefold()
    conflicts: list[dict] = []
    for schedule in schedules:
        busy_people = selected_interviewers.intersection(
            item.interviewer_id for item in schedule.interviewers
        )
        room_conflict = (
            payload.interview_type == "offline"
            and schedule.interview_type == "offline"
            and normalized_location
            and schedule.location_or_link.strip().casefold() == normalized_location
        )
        reasons = []
        if busy_people:
            names = [item.interviewer.full_name for item in schedule.interviewers if item.interviewer_id in busy_people and item.interviewer]
            reasons.append(f"Người phỏng vấn bận: {', '.join(names)}")
        if room_conflict:
            reasons.append(f"Phòng họp {payload.location_or_link} đã được sử dụng")
        if reasons:
            conflicts.append({
                "interview_id": schedule.id,
                "code": schedule.code,
                "title": schedule.title or "Lịch phỏng vấn",
                "start_time": schedule.start_time.isoformat(),
                "end_time": schedule.end_time.isoformat() if schedule.end_time else schedule.start_time.isoformat(),
                "reason": "; ".join(reasons),
            })
    return conflicts

def _validate_schedule(db: Session, payload: InterviewCreate):
    if payload.end_time <= payload.start_time or payload.start_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Chọn thời gian tương lai; kết thúc phải sau bắt đầu")
    if payload.interview_type not in {'online', 'offline'}:
        raise HTTPException(status_code=400, detail="Hình thức phỏng vấn không hợp lệ")
    if not payload.interviewer_ids:
        raise HTTPException(status_code=400, detail="Vui lòng chọn người phỏng vấn")
    if not db.query(JobApplication).filter_by(id=payload.application_id).first():
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    for user_id in set(payload.interviewer_ids):
        user = db.query(User).filter_by(id=user_id, is_active=True).first()
        if not user or not set(user.role.split(',')).intersection({'admin', 'hr_manager', 'manager', 'hiring_manager', 'interviewer'}):
            raise HTTPException(status_code=400, detail="Người phỏng vấn không khả dụng")
    conflicts = _find_conflicts(db, InterviewConflictCheck(**payload.model_dump()))
    if conflicts:
        raise HTTPException(status_code=409, detail={"message": "Lịch phỏng vấn bị trùng", "conflicts": conflicts})

def _add_schedule(db: Session, payload: InterviewCreate, creator_id: int):
    from uuid import uuid4
    schedule = InterviewSchedule(
        **payload.model_dump(exclude={'interviewer_ids'}),
        code=f"INT-{datetime.utcnow().year}-{uuid4().hex[:12]}",
        created_by_id=creator_id,
        status='scheduled',
    )
    db.add(schedule)
    db.flush()
    for user_id in set(payload.interviewer_ids):
        db.add(InterviewInterviewer(interview_id=schedule.id, interviewer_id=user_id))
    db.query(JobApplication).filter_by(id=payload.application_id).first().status = 'interviewing'
    db.flush()
    return schedule

def _validate_candidate_reply(schedule: InterviewSchedule, payload: CandidateInterviewResponse):
    if schedule.status not in {'scheduled', 'rescheduled'} or schedule.start_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail='Lịch phỏng vấn hiện không nhận phản hồi')
    if payload.response == 'reschedule_requested':
        if not payload.proposed_start_time or payload.proposed_start_time <= datetime.utcnow():
            raise HTTPException(status_code=400, detail='Vui lòng đề nghị một thời gian mới trong tương lai')
        if not payload.note or len(payload.note.strip()) < 5:
            raise HTTPException(status_code=400, detail='Vui lòng nhập lý do đề nghị đổi lịch (ít nhất 5 ký tự)')

@router.post('/interviews/batch', response_model=List[InterviewResponse], status_code=201)
def create_interview_batch(payload: InterviewBatchCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_hr_user(authorization, db)
    schedules = []
    try:
        for item in payload.interviews:
            _validate_schedule(db, item)
            schedules.append(_add_schedule(db, item, user.id))
        db.commit()
    except Exception:
        db.rollback()
        raise
    return [_serialize_schedule(item, include_token=True) for item in schedules]

def generate_interview_code(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(InterviewSchedule).count() + 1
    return f"INT-{year}-{count:04d}"

# ==================== INTERVIEW SCHEDULING ENDPOINTS ====================

@router.post("/interviews/check-conflicts", response_model=InterviewConflictResponse)
def check_interview_conflicts(
    payload: InterviewConflictCheck,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="Thời gian kết thúc phải sau thời gian bắt đầu")
    conflicts = _find_conflicts(db, payload)
    return {"has_conflict": bool(conflicts), "conflicts": conflicts}

@router.get("/interviews/interviewers")
def list_available_interviewers(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)
    users = db.query(User).filter(User.is_active.is_(True)).order_by(User.full_name.asc()).all()
    allowed_roles = {"admin", "hr_manager", "manager", "hiring_manager", "interviewer"}
    return [
        {"id": user.id, "full_name": user.full_name, "email": user.email, "roles": [role.strip() for role in user.role.split(",") if role.strip()]}
        for user in users
        if allowed_roles.intersection({role.strip().lower() for role in user.role.split(",") if role.strip()})
    ]

@router.post("/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: InterviewCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_hr_user(authorization, db)
    _validate_schedule(db, payload)
    schedule = _add_schedule(db, payload, user.id)
    db.commit()
    db.refresh(schedule)
    return _serialize_schedule(schedule, include_token=True)

@router.get("/interviews/public/{token}", response_model=InterviewResponse)
def get_public_interview(token: str, db: Session = Depends(get_db)):
    payload = _decode_response_token(token)
    schedule = db.query(InterviewSchedule).filter(InterviewSchedule.id == int(payload["interview_id"])).first()
    if not schedule or not schedule.application or schedule.application.email.lower() != payload.get("email"):
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")
    return _serialize_schedule(schedule)

@router.post('/interviews/{interview_id}/send-invitation')
def send_invitation(interview_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    get_hr_user(authorization, db)
    schedule = db.query(InterviewSchedule).filter_by(id=interview_id).first()
    if not schedule or not schedule.application:
        raise HTTPException(status_code=404, detail='Không tìm thấy lịch phỏng vấn')
    if schedule.status not in {'scheduled', 'rescheduled'}:
        raise HTTPException(status_code=400, detail='Lịch đã đóng, không thể gửi lời mời')
    response_url = f'{settings.FRONTEND_URL.rstrip("/")}/interview-response?token={_encode_response_token(schedule)}'
    try:
        sent = send_interview_invitation(schedule.application.email, schedule.title, response_url)
    except Exception:
        raise HTTPException(status_code=502, detail='Không gửi được email. Vui lòng kiểm tra cấu hình SMTP')
    if not sent:
        raise HTTPException(status_code=503, detail='SMTP chưa được cấu hình. Bạn có thể sao chép liên kết để gửi ứng viên')
    return {'message': 'Đã gửi email mời phỏng vấn'}

@router.post("/interviews/public/{token}/respond", response_model=InterviewResponse)
def respond_to_public_interview(
    token: str,
    payload: CandidateInterviewResponse,
    db: Session = Depends(get_db),
):
    token_data = _decode_response_token(token)
    schedule = db.query(InterviewSchedule).filter(InterviewSchedule.id == int(token_data["interview_id"])).first()
    if not schedule or not schedule.application or schedule.application.email.lower() != token_data.get("email"):
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")
    _validate_candidate_reply(schedule, payload)
    schedule.candidate_response = payload.response
    schedule.candidate_response_note = payload.note.strip() if payload.note else None
    schedule.candidate_proposed_start_time = payload.proposed_start_time
    schedule.candidate_response_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    return _serialize_schedule(schedule)

@router.get("/interviews/my", response_model=PaginatedInterviewsResponse)
def get_my_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_header(authorization, db)

    query = (
        db.query(InterviewSchedule)
        .join(InterviewInterviewer, InterviewSchedule.id == InterviewInterviewer.interview_id)
        .filter(InterviewInterviewer.interviewer_id == current_user.id)
    )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(InterviewSchedule.start_time.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [_serialize_schedule(sc) for sc in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/interviews/candidate/my", response_model=PaginatedInterviewsResponse)
def get_candidate_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_header(authorization, db)
    query = (
        db.query(InterviewSchedule)
        .join(JobApplication, InterviewSchedule.application_id == JobApplication.id)
        .filter(or_(JobApplication.candidate_id == current_user.id, JobApplication.email == current_user.email.lower()))
    )
    total = query.count()
    items = query.order_by(InterviewSchedule.start_time.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_serialize_schedule(item, include_token=True) for item in items], "total": total, "page": page, "page_size": page_size, "pages": max(1, ceil(total / page_size))}


@router.post("/interviews/{interview_id}/respond", response_model=InterviewResponse)
def respond_to_interview(
    interview_id: int,
    payload: CandidateInterviewResponse,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_header(authorization, db)
    schedule = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not schedule or not schedule.application:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")
    application = schedule.application
    if application.candidate_id != current_user.id and application.email != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Bạn không có quyền phản hồi lịch phỏng vấn này")
    _validate_candidate_reply(schedule, payload)
    schedule.candidate_response = payload.response
    schedule.candidate_response_note = payload.note.strip() if payload.note else None
    schedule.candidate_proposed_start_time = payload.proposed_start_time
    schedule.candidate_response_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    action = {
        "confirmed": "Xác nhận lịch phỏng vấn",
        "reschedule_requested": "Đề nghị đổi lịch phỏng vấn",
        "declined": "Từ chối lịch phỏng vấn",
    }[payload.response]
    write_audit_log(db, action=action, module="Phỏng vấn", request=request, user=current_user, status="success" if payload.response == "confirmed" else "warning", details=schedule.code)
    return _serialize_schedule(schedule)

@router.get("/interviews/manage/all", response_model=PaginatedInterviewsResponse)
def list_manage_interviews(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    query = db.query(InterviewSchedule)
    if status_filter != "all":
        query = query.filter(InterviewSchedule.status == status_filter)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InterviewSchedule.title.ilike(term),
                InterviewSchedule.code.ilike(term),
            )
        )

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(InterviewSchedule.start_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [_serialize_schedule(sc, include_token=True) for sc in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }

@router.put("/interviews/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    payload: InterviewUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    schedule = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch phỏng vấn")

    start_time = payload.start_time or schedule.start_time
    end_time = payload.end_time or schedule.end_time
    next_status = payload.status or schedule.status
    if next_status not in {'scheduled', 'rescheduled', 'completed', 'cancelled'}:
        raise HTTPException(status_code=400, detail='Trạng thái lịch không hợp lệ')
    if (payload.start_time or payload.end_time or payload.interviewer_ids is not None or payload.location_or_link is not None) and next_status in {'scheduled', 'rescheduled'}:
        if not end_time or end_time <= start_time or start_time <= datetime.utcnow():
            raise HTTPException(status_code=400, detail='Thời gian lịch mới chưa hợp lệ')
        conflicts = _find_conflicts(db, InterviewConflictCheck(
            start_time=start_time, end_time=end_time,
            interviewer_ids=payload.interviewer_ids if payload.interviewer_ids is not None else [person.interviewer_id for person in schedule.interviewers],
            interview_type=payload.interview_type or schedule.interview_type,
            location_or_link=payload.location_or_link or schedule.location_or_link,
            exclude_interview_id=schedule.id,
        ))
        if conflicts:
            raise HTTPException(status_code=409, detail={'message': 'Lịch mới bị trùng', 'conflicts': conflicts})
    if payload.start_time is not None and payload.start_time != schedule.start_time:
        schedule.candidate_response = 'pending'
        schedule.candidate_response_note = None
        schedule.candidate_proposed_start_time = None
        schedule.candidate_response_at = None

    if payload.title is not None:
        schedule.title = payload.title.strip()
    if payload.interview_type is not None:
        schedule.interview_type = payload.interview_type
    if payload.location_or_link is not None:
        schedule.location_or_link = payload.location_or_link.strip()
    if payload.start_time is not None:
        schedule.start_time = payload.start_time
    if payload.end_time is not None:
        schedule.end_time = payload.end_time
    if payload.notes is not None:
        schedule.notes = payload.notes
    if payload.status is not None:
        schedule.status = payload.status
    schedule.updated_at = datetime.utcnow()

    if payload.interviewer_ids is not None:
        # Clear existing interviewers
        db.query(InterviewInterviewer).filter(InterviewInterviewer.interview_id == schedule.id).delete()
        for u_id in set(payload.interviewer_ids):
            user = db.query(User).filter(User.id == u_id).first()
            if user:
                interviewer_rel = InterviewInterviewer(
                    interview_id=schedule.id,
                    interviewer_id=user.id,
                )
                db.add(interviewer_rel)

    db.commit()
    db.refresh(schedule)

    return _serialize_schedule(schedule, include_token=True)

@router.get("/applications/{application_id}/interviews", response_model=List[InterviewResponse])
def get_application_interviews(
    application_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    get_hr_user(authorization, db)

    schedules = (
        db.query(InterviewSchedule)
        .filter(InterviewSchedule.application_id == application_id)
        .order_by(InterviewSchedule.start_time.asc())
        .all()
    )

    return [_serialize_schedule(sc, include_token=True) for sc in schedules]
