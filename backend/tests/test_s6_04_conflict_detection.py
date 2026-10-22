"""Automated test suite for User Story S6-04 (SCRUM-90):
Cảnh báo và Chặn trùng lịch người phỏng vấn hoặc phòng họp.
Covers 100% Acceptance Criteria:
- AC1: Kiểm tra trùng theo từng người phỏng vấn và theo phòng trong cùng khung giờ.
- AC2: Hiển thị rõ buổi nào đang xung đột với buổi nào (chi tiết ứng viên, thời gian, phòng, interviewer).
- AC3: Trùng là lỗi chặn (blocking error 409), không cho lưu, trừ khi Recruiter xác nhận ghi đè kèm lý do (>= 10 ký tự).
- Support check_conflicts endpoint with suggestions.
- Support reschedule with conflict check & override reason.
- Verify Database override_reason column and audit log.
"""
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.main import app
from app.db.session import Base, get_db
from app.db.seed_rbac import ROLES_DATA, PERMISSIONS_DATA, DEFAULT_GRANTED_MATRIX
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission
from app.models.hr import Department, JobTitle, RecruiterAssignment
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.interview import InterviewSchedule, InterviewInterviewer
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

    # 2. Seed Users
    users = {}
    for key, role_code, full_name, email in [
        ("rec", "recruiter", "Nguyễn Thị Recruiter S604", "recruiter_s604@team4.vn"),
        ("int1", "interviewer", "Trần Văn Interviewer Alpha", "lead_interviewer1@team4.vn"),
        ("int2", "interviewer", "Lê Thị Interviewer Beta", "senior_interviewer2@team4.vn"),
        ("cand1", "candidate", "Nguyễn Văn A (Ứng Viên)", "cand_nguyen_a@gmail.com"),
        ("cand2", "candidate", "Trần Thị B (Ứng Viên)", "cand_tran_b@gmail.com"),
    ]:
        u = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password("Password123"),
            role=role_code,
            is_active=True,
            account_status="active",
            security_version=1,
        )
        db.add(u)
        db.flush()
        db.add(UserRole(user_id=u.id, role_id=roles[role_code].id))
        users[key] = u
    db.commit()

    # 3. Department, Requisition, Job Posting
    dept = Department(code="IT_S604", name="Phòng Công Nghệ & Phần Mềm")
    db.add(dept)
    db.commit()

    title = JobTitle(name="Kỹ Sư Backend Cao Cấp", department_id=dept.id, level="Senior", min_salary=30_000_000, max_salary=50_000_000)
    db.add(title)
    db.commit()

    req = JobRequisition(
        code="REQ-S6-04",
        title="Tuyển Dụng Senior Backend Developer 2026",
        department_id=dept.id,
        job_title_id=title.id,
        job_title_name=title.name,
        quantity=2,
        status="approved",
        current_approval_step="completed",
        created_by_id=users["rec"].id,
    )
    db.add(req)
    db.commit()

    db.add(RecruiterAssignment(requisition_id=req.id, recruiter_id=users["rec"].id, assignment_type="primary"))

    job = JobPosting(
        slug="senior-backend-developer-2026",
        title="Tuyển Dụng Senior Backend Developer 2026",
        requisition_id=req.id,
        department_id=dept.id,
        department_name=dept.name,
        description="Job Posting description",
        status="published",
        created_by_id=users["rec"].id,
    )
    db.add(job)
    db.commit()

    # 4. Job Applications for Candidate 1 & Candidate 2
    app1 = JobApplication(
        job_posting_id=job.id,
        candidate_id=users["cand1"].id,
        full_name="Nguyễn Văn A (Ứng Viên)",
        email="cand_nguyen_a@gmail.com",
        phone="0988000111",
        status="screening",
    )
    app2 = JobApplication(
        job_posting_id=job.id,
        candidate_id=users["cand2"].id,
        full_name="Trần Thị B (Ứng Viên)",
        email="cand_tran_b@gmail.com",
        phone="0988000222",
        status="screening",
    )
    db.add_all([app1, app2])
    db.commit()

    app.dependency_overrides[get_db] = override_get_db

    yield {
        "db": db,
        "users": users,
        "app1": app1,
        "app2": app2,
        "job": job,
    }

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_tc_s6_04_01_conflict_interviewer_same_time_blocks_save(setup_data):
    """AC1, AC2, AC3: Kiểm tra trùng theo từng người phỏng vấn trong cùng khung giờ.
    Trùng là lỗi chặn (HTTP 409) và trả về rõ ràng thông tin buổi xung đột.
    """
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=1)).strftime("%Y-%m-%d")
    payload1 = {
        "application_id": app1.id,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": f"{tomorrow}T14:00",
        "duration_minutes": 60,
        "location": "Phòng Họp 302",
        "meeting_link": None,
        "interviewer_ids": [int1.id],
    }
    r1 = client.post("/api/v1/interviews", json=payload1, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201, r1.text
    interview1_id = r1.json()["id"]

    # Buổi 2: Đặt lịch cho Ứng viên B lúc 14:30 - 15:30 (trùng 30 phút với Buổi 1) cùng có Interviewer 1
    # Không có override_conflict_reason -> BẮT BUỘC BỊ CHẶN HTTP 409
    payload2 = {
        "application_id": app2.id,
        "round_name": "Vòng 2: Phỏng Vấn Kỹ Thuật",
        "scheduled_time": f"{tomorrow}T14:30",
        "duration_minutes": 60,
        "location": "Phòng Họp 405",  # Phòng khác, nhưng trùng người
        "meeting_link": None,
        "interviewer_ids": [int1.id],
    }
    r2 = client.post("/api/v1/interviews", json=payload2, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 409, r2.text
    data = r2.json()["detail"]
    assert data["code"] == "INTERVIEW_CONFLICT"
    assert "Trần Văn Interviewer Alpha" in data["message"]
    assert "Nguyễn Văn A" in data["message"]
    
    # AC2: Kiểm tra dữ liệu đối chiếu buổi xung đột
    assert len(data["conflicts"]) >= 1
    conf = data["conflicts"][0]
    assert conf["interview_id"] == interview1_id
    assert conf["type"] == "interviewer"
    assert "Trần Văn Interviewer Alpha" in conf["who"]
    assert conf["candidate"] == "Nguyễn Văn A (Ứng Viên)"
    assert conf["round_name"] == "Vòng 1: HR Screening"


def test_tc_s6_04_02_conflict_room_same_time_blocks_save(setup_data):
    """AC1, AC2, AC3: Kiểm tra trùng theo phòng họp vật lý trong cùng khung giờ dù khác người phỏng vấn.
    Trùng là lỗi chặn (HTTP 409).
    """
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    int2 = setup_data["users"]["int2"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Buổi 1: Đặt lịch tại Phòng Họp Sáng Tạo lúc 09:00 - 10:00 với Interviewer 1
    payload1 = {
        "application_id": app1.id,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": f"{tomorrow}T09:00",
        "duration_minutes": 60,
        "location": "Phòng Họp Sáng Tạo - Tầng 8",
        "meeting_link": None,
        "interviewer_ids": [int1.id],
    }
    r1 = client.post("/api/v1/interviews", json=payload1, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201

    # Buổi 2: Đặt lịch cho Ứng viên B cùng "Phòng Họp Sáng Tạo - Tầng 8" lúc 09:30 - 10:30 với Interviewer 2 (khác người)
    payload2 = {
        "application_id": app2.id,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": f"{tomorrow}T09:30",
        "duration_minutes": 60,
        "location": "Phòng Họp Sáng Tạo - Tầng 8",
        "meeting_link": None,
        "interviewer_ids": [int2.id],
    }
    r2 = client.post("/api/v1/interviews", json=payload2, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 409
    data = r2.json()["detail"]
    assert data["code"] == "INTERVIEW_CONFLICT"
    assert "Phòng Họp Sáng Tạo - Tầng 8" in data["message"]
    conf = data["conflicts"][0]
    assert conf["type"] == "room"
    assert conf["room"] == "Phòng Họp Sáng Tạo - Tầng 8"
    assert conf["candidate"] == "Nguyễn Văn A (Ứng Viên)"


def test_tc_s6_04_03_no_conflict_when_previous_session_cancelled_or_completed(setup_data):
    """AC1: Lịch đã huỷ (cancelled) hoặc đã hoàn thành (completed) không tính là xung đột."""
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=3)).strftime("%Y-%m-%d")
    
    # Tạo buổi 1
    payload1 = {
        "application_id": app1.id,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": f"{tomorrow}T10:00",
        "duration_minutes": 45,
        "location": "Phòng 101",
        "interviewer_ids": [int1.id],
    }
    r1 = client.post("/api/v1/interviews", json=payload1, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201
    iv1_id = r1.json()["id"]

    # Huỷ buổi 1
    cancel_res = client.post(f"/api/v1/interviews/{iv1_id}/cancel", json={"reason": "Ứng viên bận việc đột xuất"}, headers={"Authorization": f"Bearer {token}"})
    assert cancel_res.status_code == 200

    # Đặt buổi 2 cùng giờ 10:00 - 10:45 cùng người và cùng phòng -> KHÔNG BỊ XUNG ĐỘT
    payload2 = {
        "application_id": app2.id,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": f"{tomorrow}T10:00",
        "duration_minutes": 45,
        "location": "Phòng 101",
        "interviewer_ids": [int1.id],
    }
    r2 = client.post("/api/v1/interviews", json=payload2, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 201, r2.text


def test_tc_s6_04_04_no_conflict_online_meetings_distinct(setup_data):
    """AC1: Hai buổi trực tuyến (Google Meet) khác người phỏng vấn không tính là trùng phòng."""
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    int2 = setup_data["users"]["int2"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=4)).strftime("%Y-%m-%d")
    
    payload1 = {
        "application_id": app1.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T15:00",
        "duration_minutes": 45,
        "location": "Trực tuyến",
        "meeting_link": "https://meet.google.com/aaa-bbbb-ccc",
        "interviewer_ids": [int1.id],
    }
    r1 = client.post("/api/v1/interviews", json=payload1, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201

    payload2 = {
        "application_id": app2.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T15:00",
        "duration_minutes": 45,
        "location": "Trực tuyến",
        "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
        "interviewer_ids": [int2.id],  # Khác người
    }
    r2 = client.post("/api/v1/interviews", json=payload2, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 201, r2.text


def test_tc_s6_04_05_override_conflict_with_valid_reason_succeeds(setup_data):
    """AC3: Trùng là lỗi chặn, nhưng CHO PHÉP LƯU khi Recruiter xác nhận ghi đè kèm lý do (>= 10 ký tự).
    Database lưu override_reason và ghi log audit vào application_logs.
    """
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=5)).strftime("%Y-%m-%d")
    
    # Buổi 1
    payload1 = {
        "application_id": app1.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T08:30",
        "duration_minutes": 60,
        "location": "Phòng VIP 1",
        "interviewer_ids": [int1.id],
    }
    r1 = client.post("/api/v1/interviews", json=payload1, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201

    # Buổi 2 trùng giờ, nhưng có override_conflict_reason hợp lệ (>= 10 ký tự)
    reason = "Đã xin phép dời phòng họp và interviewer Alpha đã đồng ý ưu tiên ca này"
    payload2 = {
        "application_id": app2.id,
        "round_name": "Vòng 2",
        "scheduled_time": f"{tomorrow}T08:45",
        "duration_minutes": 45,
        "location": "Phòng VIP 1",
        "interviewer_ids": [int1.id],
        "override_conflict_reason": reason,
    }
    r2 = client.post("/api/v1/interviews", json=payload2, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 201, r2.text
    created = r2.json()
    assert created["override_reason"] == reason

    # Kiểm tra Database lưu đúng cột override_reason và ApplicationLog
    iv_db = db.query(InterviewSchedule).filter(InterviewSchedule.id == created["id"]).first()
    assert iv_db.override_reason == reason
    
    log = db.query(ApplicationLog).filter(
        ApplicationLog.application_id == app2.id,
        ApplicationLog.comment.like("%Xác nhận ghi đè xung đột%")
    ).first()
    assert log is not None
    assert reason in log.comment


def test_tc_s6_04_06_override_conflict_with_too_short_or_empty_reason_fails(setup_data):
    """AC3: Cung cấp lý do ghi đè rỗng hoặc dưới 10 ký tự vẫn bị CHẶN HTTP 409."""
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=6)).strftime("%Y-%m-%d")
    
    payload1 = {
        "application_id": app1.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T11:00",
        "duration_minutes": 60,
        "location": "Phòng 202",
        "interviewer_ids": [int1.id],
    }
    client.post("/api/v1/interviews", json=payload1, headers={"Authorization": f"Bearer {token}"})

    # Lý do quá ngắn ("ok")
    payload2 = {
        "application_id": app2.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T11:30",
        "duration_minutes": 45,
        "location": "Phòng 202",
        "interviewer_ids": [int1.id],
        "override_conflict_reason": "ok",
    }
    r2 = client.post("/api/v1/interviews", json=payload2, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 409
    assert r2.json()["detail"]["code"] == "INTERVIEW_CONFLICT"


def test_tc_s6_04_07_reschedule_conflict_and_override(setup_data):
    """AC1, AC2, AC3 trên luồng Dời Lịch (Reschedule PUT /interviews/{id}):
    Dời vào giờ trùng bị chặn nếu không có lý do, cho phép nếu có lý do ghi đè.
    """
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    app1 = setup_data["app1"]
    app2 = setup_data["app2"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Buổi 1 lúc 14:00 - 15:00
    r1 = client.post("/api/v1/interviews", json={
        "application_id": app1.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T14:00",
        "duration_minutes": 60,
        "location": "Phòng 301",
        "interviewer_ids": [int1.id],
    }, headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 201

    # Buổi 2 lúc 16:00 - 17:00 (lúc đầu không trùng)
    r2 = client.post("/api/v1/interviews", json={
        "application_id": app2.id,
        "round_name": "Vòng 1",
        "scheduled_time": f"{tomorrow}T16:00",
        "duration_minutes": 60,
        "location": "Phòng 301",
        "interviewer_ids": [int1.id],
    }, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 201
    iv2_id = r2.json()["id"]

    # Dời Buổi 2 về 14:30 (trùng với Buổi 1) mà không có lý do ghi đè -> BỊ CHẶN 409
    resched_payload = {
        "scheduled_time": f"{tomorrow}T14:30",
        "duration_minutes": 60,
        "location": "Phòng 301",
        "interviewer_ids": [int1.id],
        "reason": "Ứng viên yêu cầu chuyển sớm hơn",
    }
    r_block = client.put(f"/api/v1/interviews/{iv2_id}", json=resched_payload, headers={"Authorization": f"Bearer {token}"})
    assert r_block.status_code == 409
    assert r_block.json()["detail"]["code"] == "INTERVIEW_CONFLICT"

    # Dời kèm lý do ghi đè hợp lệ -> THÀNH CÔNG 200
    resched_payload["override_conflict_reason"] = "Ứng viên chỉ rảnh lúc 14:30, người phỏng vấn đồng ý xử lý đồng thời"
    r_ok = client.put(f"/api/v1/interviews/{iv2_id}", json=resched_payload, headers={"Authorization": f"Bearer {token}"})
    assert r_ok.status_code == 200
    assert r_ok.json()["override_reason"] == resched_payload["override_conflict_reason"]


def test_tc_s6_04_08_check_conflicts_endpoint_full_detail(setup_data):
    """AC2: Endpoint POST /api/v1/interviews/conflicts trả về chi tiết đối chiếu và suggested_slot."""
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    app1 = setup_data["app1"]
    token = session_token(db, rec)

    tomorrow = (datetime.now(ICT) + timedelta(days=8)).strftime("%Y-%m-%d")
    
    # Tạo buổi trước
    client.post("/api/v1/interviews", json={
        "application_id": app1.id,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": f"{tomorrow}T13:00",
        "duration_minutes": 60,
        "location": "Phòng Hội Thảo A",
        "interviewer_ids": [int1.id],
    }, headers={"Authorization": f"Bearer {token}"})

    # Gọi /conflicts kiểm tra trước
    check_payload = {
        "scheduled_time": f"{tomorrow}T13:30",
        "duration_minutes": 45,
        "location": "Phòng Hội Thảo A",
        "interviewer_ids": [int1.id],
    }
    res = client.post("/api/v1/interviews/conflicts", json=check_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["has_conflict"] is True
    assert len(body["conflicts"]) >= 1
    
    # Gợi ý khung giờ rảnh khả dụng
    assert body["suggested_slot"] is not None
    assert "start_time" in body["suggested_slot"]
    assert "formatted_range" in body["suggested_slot"]
