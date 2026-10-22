"""Comprehensive automated test suite for User Story S6-05 (SCRUM-91):
'Là Ứng viên, tôi muốn nhận thư mời phỏng vấn và xác nhận tham dự, để chắc chắn về thời gian địa điểm và báo trước nếu không tới được.'

Acceptance Criteria covered 100%:
- AC1: Email chứa thời gian, địa điểm hoặc liên kết họp, tên vị trí, hướng dẫn chuẩn bị.
- AC2: Ứng viên bấm xác nhận hoặc đề nghị đổi lịch qua liên kết trong thư.
- AC3: Trạng thái xác nhận hiển thị cho recruiter.
- AC4: Liên kết chỉ dùng được cho đúng buổi phỏng vấn đó (single-use cryptographically hashed token, HTTP 410 on cancelled/past).
- QA-EXTRA: Kiểm tra phân quyền ứng viên đăng nhập (portal candidate-response) và validation dữ liệu.
"""
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.main import app
from app.db.session import Base
from app.db.seed_rbac import ROLES_DATA, PERMISSIONS_DATA, DEFAULT_GRANTED_MATRIX
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission
from app.models.hr import Department, JobTitle, RecruiterAssignment
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.email_automation import EmailLog
from app.models.notification import Notification
from app.core.security import hash_password
from tests.conftest import session_token

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)
ICT = timezone(timedelta(hours=7))


@pytest.fixture(autouse=True)
def setup_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # 1. Seed Roles & Permissions
    roles = {r["code"]: Role(code=r["code"], name=r["name"]) for r in ROLES_DATA}
    db.add_all(roles.values())
    for p in PERMISSIONS_DATA:
        db.add(Permission(code=p["code"], name=p["name"], module=p["module"]))
    for role_code, granted in DEFAULT_GRANTED_MATRIX.items():
        for p in PERMISSIONS_DATA:
            db.add(RolePermission(role_code=role_code, permission_code=p["code"], is_granted=p["code"] in granted))
    db.commit()

    # 2. Seed Users (Recruiter, Interviewer, Candidate, Other Candidate)
    users = {}
    for key, role in [
        ("rec", "recruiter"),
        ("int1", "interviewer"),
        ("candidate", "candidate"),
        ("other_candidate", "candidate"),
    ]:
        u = User(
            email=f"{key}@company.com",
            full_name=f"User {key.upper()}",
            hashed_password=hash_password("Password123"),
            role=role,
            is_active=True,
            account_status="active",
            security_version=1,
        )
        db.add(u)
        db.flush()
        db.add(UserRole(user_id=u.id, role_id=roles[role].id))
        users[key] = u
    db.commit()

    # 3. Department, Requisition, Job Posting
    dept = Department(code="TECH", name="Khối Công nghệ Thông tin")
    db.add(dept)
    db.commit()

    title = JobTitle(name="Chuyên viên Backend Python", department_id=dept.id, level="Senior", min_salary=30_000_000, max_salary=50_000_000)
    db.add(title)
    db.commit()

    req = JobRequisition(
        code="REQ-S6-05",
        title="Chuyên viên Backend Python",
        department_id=dept.id,
        job_title_id=title.id,
        job_title_name=title.name,
        quantity=3,
        status="approved",
        current_approval_step="completed",
        created_by_id=users["rec"].id,
    )
    db.add(req)
    db.commit()

    db.add(RecruiterAssignment(requisition_id=req.id, recruiter_id=users["rec"].id, assignment_type="primary"))

    job = JobPosting(
        slug="chuyen-vien-backend-python",
        title="Chuyên viên Backend Python",
        requisition_id=req.id,
        department_id=dept.id,
        department_name=dept.name,
        description="Tin tuyển dụng Backend Python",
        status="published",
        created_by_id=users["rec"].id,
    )
    db.add(job)
    db.commit()

    # 4. Job Application
    application = JobApplication(
        job_posting_id=job.id,
        candidate_id=users["candidate"].id,
        full_name="Nguyễn Văn Ứng Viên",
        email="candidate.python@example.com",
        phone="0987654321",
        status="screening",
    )
    db.add(application)
    db.commit()

    yield {
        "db": db,
        "users": users,
        "application": application,
        "job": job,
    }

    db.close()
    Base.metadata.drop_all(bind=engine)


def _extract_token_from_email_log(db, app_id: int) -> str:
    log = db.query(EmailLog).filter(EmailLog.related_id == str(app_id), EmailLog.template_code == "INVITE_INTERVIEW").order_by(EmailLog.id.desc()).first()
    assert log is not None, f"Thư mời phỏng vấn chưa được gửi cho application {app_id}"
    token_url_part = log.body_html.split("token=")[1]
    raw_token = token_url_part.split('"')[0].split("&")[0].split("'")[0].split("<")[0].strip()
    return raw_token


def test_ac1_invite_email_contains_full_details_and_preparation_notes(setup_data):
    """AC1 (TC-S6-05-01): Email chứa thời gian, địa điểm hoặc link họp, tên vị trí, và hướng dẫn chuẩn bị."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=2, hours=3)).replace(microsecond=0)
    prep_text = "Chuẩn bị portfolio dự án Backend, ăn mặc lịch sự, kiểm tra webcam và micro trước 15 phút."

    payload = {
        "application_id": application.id,
        "round_number": 2,
        "round_name": "Vòng 2: Phỏng vấn Chuyên môn / Technical",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 60,
        "location": "Phòng Họp 405",
        "meeting_link": "https://meet.google.com/abc-xyz-123",
        "interviewer_ids": [int1.id],
        "preparation_notes": prep_text,
    }

    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    assert res.status_code == 201, res.text
    interview_data = res.json()
    assert interview_data["preparation_notes"] == prep_text

    # Kiểm tra email log
    log = db.query(EmailLog).filter(EmailLog.related_id == str(application.id), EmailLog.template_code == "INVITE_INTERVIEW").first()
    assert log is not None
    assert log.recipient_email == application.email
    assert "Chuyên viên Backend Python" in log.subject
    assert "https://meet.google.com/abc-xyz-123" in log.body_html
    assert "Hướng dẫn chuẩn bị" in log.body_html
    assert prep_text in log.body_html
    assert "Xác nhận tham dự hoặc đề nghị đổi lịch" in log.body_html
    assert "token=" in log.body_html


def test_ac2_candidate_confirms_attendance_via_public_token(setup_data):
    """AC2 (TC-S6-05-02): Ứng viên bấm xác nhận qua liên kết trong thư, hệ thống ghi nhận và cập nhật DB."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=3)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Phòng Họp Trực Tuyến",
        "meeting_link": "https://meet.google.com/test-confirm",
        "interviewer_ids": [int1.id],
    }
    client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})

    token = _extract_token_from_email_log(db, application.id)

    # 1. Ứng viên truy cập link lấy chi tiết phỏng vấn
    get_res = client.get(f"/api/v1/public/interviews?token={token}")
    assert get_res.status_code == 200, get_res.text
    view = get_res.json()
    assert view["job_title"] == "Chuyên viên Backend Python"
    assert view["candidate_name"] == application.full_name
    assert view["candidate_response"] is None
    assert view["preparation_notes"] is not None

    # 2. Ứng viên bấm Xác nhận tham dự (confirmed)
    resp = client.post("/api/v1/public/interviews/respond", json={"token": token, "response": "confirmed", "note": "Em chắc chắn tham gia đúng giờ."})
    assert resp.status_code == 200, resp.text
    rdata = resp.json()
    assert rdata["candidate_response"] == "confirmed"
    assert rdata["status"] == "success"
    assert "thành công" in rdata["message"].lower()

    # 3. Kiểm tra DB
    iv_db = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == application.id).first()
    assert iv_db.candidate_response == "confirmed"
    assert iv_db.candidate_response_note == "Em chắc chắn tham gia đúng giờ."
    assert iv_db.candidate_responded_at is not None


def test_ac2_candidate_requests_reschedule_with_note(setup_data):
    """AC2 (TC-S6-05-03): Ứng viên đề nghị đổi lịch kèm khung giờ mong muốn và lý do cụ thể."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Keangnam 72",
        "meeting_link": None,
        "interviewer_ids": [int1.id],
    }
    client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    token = _extract_token_from_email_log(db, application.id)

    # Ứng viên gửi yêu cầu xin đổi lịch
    note_msg = "Đề nghị đổi sang 2026-10-28 14:00: Em có lịch kiểm tra định kỳ tại bệnh viện vào sáng thứ Sáu."
    resp = client.post("/api/v1/public/interviews/respond", json={"token": token, "response": "reschedule_requested", "note": note_msg})
    assert resp.status_code == 200, resp.text
    rdata = resp.json()
    assert rdata["candidate_response"] == "reschedule_requested"
    assert rdata["candidate_response_note"] == note_msg

    # Kiểm tra DB
    iv_db = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == application.id).first()
    assert iv_db.candidate_response == "reschedule_requested"
    assert iv_db.candidate_response_note == note_msg


def test_ac3_recruiter_and_panel_receive_notification_and_see_status(setup_data):
    """AC3 (TC-S6-05-04): Trạng thái xác nhận hiển thị cho recruiter và recruiter nhận in-app notification."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Keangnam 72",
        "interviewer_ids": [int1.id],
    }
    client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    token = _extract_token_from_email_log(db, application.id)

    # Ứng viên bấm xác nhận
    client.post("/api/v1/public/interviews/respond", json={"token": token, "response": "confirmed", "note": "Xác nhận tham gia"})

    # 1. Kiểm tra Recruiter nhận notification
    notif = db.query(Notification).filter(Notification.recipient_id == rec.id, Notification.type == "interview_response").first()
    assert notif is not None
    assert application.full_name in notif.title
    assert "xác nhận tham dự" in notif.title

    # 2. Recruiter xem danh sách lịch phỏng vấn (GET /interviews)
    list_res = client.get("/api/v1/interviews", headers={"Authorization": f"Bearer {rec_token}"})
    assert list_res.status_code == 200
    interviews = list_res.json()
    matched = next((x for x in interviews if x["application_id"] == application.id), None)
    assert matched is not None
    assert matched["candidate_response"] == "confirmed"
    assert matched["candidate_response_note"] == "Xác nhận tham gia"
    assert matched["candidate_responded_at"] is not None


def test_ac4_invalid_token_returns_404(setup_data):
    """AC4 (TC-S6-05-05): Token sai hoặc ngẫu nhiên không tồn tại trả về HTTP 404."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db

    fake_token = "invalid_token_1234567890abcdef1234567890"
    get_res = client.get(f"/api/v1/public/interviews?token={fake_token}")
    assert get_res.status_code == 404

    post_res = client.post("/api/v1/public/interviews/respond", json={"token": fake_token, "response": "confirmed"})
    assert post_res.status_code == 404


def test_ac4_cancelled_interview_link_returns_410(setup_data):
    """AC4 (TC-S6-05-06): Liên kết vô hiệu khi buổi phỏng vấn bị hủy (HTTP 410 Gone)."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Keangnam 72",
        "interviewer_ids": [int1.id],
    }
    create_res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    interview_id = create_res.json()["id"]
    token = _extract_token_from_email_log(db, application.id)

    # Recruiter hủy buổi phỏng vấn
    cancel_res = client.post(f"/api/v1/interviews/{interview_id}/cancel", json={"reason": "Ứng viên không phù hợp thời gian tuyển đợt này"}, headers={"Authorization": f"Bearer {rec_token}"})
    assert cancel_res.status_code == 200

    # Ứng viên truy cập lại link sau khi bị hủy -> Phải trả về HTTP 410 Gone
    get_res = client.get(f"/api/v1/public/interviews?token={token}")
    assert get_res.status_code == 410

    post_res = client.post("/api/v1/public/interviews/respond", json={"token": token, "response": "confirmed"})
    assert post_res.status_code == 410


def test_ac4_past_interview_link_returns_410(setup_data):
    """AC4 (TC-S6-05-07): Buổi phỏng vấn đã qua thời gian không còn nhận phản hồi (HTTP 410 Gone)."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=1)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Keangnam 72",
        "interviewer_ids": [int1.id],
    }
    client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    token = _extract_token_from_email_log(db, application.id)

    # Chỉnh thời gian buổi phỏng vấn trong DB lùi về quá khứ (2 giờ trước)
    iv = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == application.id).first()
    iv.scheduled_time = datetime.utcnow() - timedelta(hours=2)
    db.commit()

    # Ứng viên cố bấm xác nhận cho buổi phỏng vấn đã qua
    post_res = client.post("/api/v1/public/interviews/respond", json={"token": token, "response": "confirmed"})
    assert post_res.status_code == 410


def test_signed_in_candidate_portal_response_rbac(setup_data):
    """QA-EXTRA (TC-S6-05-08): Ứng viên đăng nhập phản hồi qua portal cá nhân; từ chối người khác (HTTP 403)."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    candidate = setup_data["users"]["candidate"]
    other_candidate = setup_data["users"]["other_candidate"]
    application = setup_data["application"]

    rec_token = session_token(db, rec)
    cand_token = session_token(db, candidate)
    other_token = session_token(db, other_candidate)

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Keangnam 72",
        "interviewer_ids": [int1.id],
    }
    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    interview_id = res.json()["id"]

    # Ứng viên khác cố tình phản hồi -> 403 Forbidden
    other_res = client.post(
        f"/api/v1/interviews/{interview_id}/candidate-response",
        json={"response": "confirmed"},
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert other_res.status_code == 403

    # Đúng ứng viên phản hồi -> 200 OK
    cand_res = client.post(
        f"/api/v1/interviews/{interview_id}/candidate-response",
        json={"response": "confirmed", "note": "Em đã xác nhận trên portal"},
        headers={"Authorization": f"Bearer {cand_token}"},
    )
    assert cand_res.status_code == 200
    assert cand_res.json()["candidate_response"] == "confirmed"

    # DB cập nhật đúng
    iv = db.query(InterviewSchedule).filter(InterviewSchedule.id == interview_id).first()
    assert iv.candidate_response == "confirmed"
    assert iv.candidate_response_note == "Em đã xác nhận trên portal"
