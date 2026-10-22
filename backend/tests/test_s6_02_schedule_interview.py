"""Automated test suite for User Story S6-02:
Schedule interview for a candidate (Đặt lịch phỏng vấn cho một ứng viên).
Covers 100% Acceptance Criteria:
- TC-S6-02-01 (S6-02-AC01): Round, date/time, duration, format (online/offline), room/meeting link.
- TC-S6-02-02 (S6-02-AC02): Schedule with 1 or multiple interviewers.
- TC-S6-02-03 (S6-02-AC03): Disallow scheduling in the past (HTTP 422).
- TC-S6-02-04 (S6-02-AC04): Immediately visible on candidate profile and interviewer schedule.
- TC-S6-02-X01 (Boundary QA-EXTRA): Boundary test 1 minute before now vs future.
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
    for key, role in [
        ("rec", "recruiter"),
        ("int1", "interviewer"),
        ("int2", "interviewer"),
        ("candidate", "candidate"),
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
    dept = Department(code="IT", name="Bộ phận Công nghệ")
    db.add(dept)
    db.commit()

    title = JobTitle(name="Senior Fullstack Engineer", department_id=dept.id, level="Senior", min_salary=30_000_000, max_salary=50_000_000)
    db.add(title)
    db.commit()

    req = JobRequisition(
        code="REQ-S6-02",
        title="Senior Fullstack Engineer",
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
        slug="senior-fullstack-engineer",
        title="Senior Fullstack Engineer",
        requisition_id=req.id,
        department_id=dept.id,
        department_name=dept.name,
        description="Senior Fullstack Engineer Job Posting",
        status="published",
        created_by_id=users["rec"].id,
    )
    db.add(job)
    db.commit()

    # 4. Job Application
    application = JobApplication(
        job_posting_id=job.id,
        candidate_id=users["candidate"].id,
        full_name="Nguyễn Văn A",
        email="candidate.a@company.com",
        phone="0912345678",
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


def test_tc_s6_02_01_schedule_interview_valid_full_details(setup_data):
    """TC-S6-02-01 (AC01): Set round, date/time, duration, format (offline room), interviewers."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    iso_time = future_time.isoformat()

    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": iso_time,
        "duration_minutes": 60,
        "location": "Phòng Họp 302 - Keangnam Tower",
        "meeting_link": None,
        "interviewer_ids": [int1.id],
    }

    response = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201, response.text
    data = response.json()

    assert data["application_id"] == application.id
    assert data["round_number"] == 1
    assert data["round_name"] == "Vòng 1: HR Screening"
    assert data["duration_minutes"] == 60
    assert data["location"] == "Phòng Họp 302 - Keangnam Tower"
    assert data["meeting_link"] is None
    assert data["status"] == "scheduled"
    assert len(data["interviewers"]) == 1
    assert data["interviewers"][0]["interviewer_id"] == int1.id
    assert data["candidate_name"] == "Nguyễn Văn A"


def test_tc_s6_02_02_schedule_with_multiple_interviewers(setup_data):
    """TC-S6-02-02 (AC02): Schedule with multiple interviewers, both see it on their schedules."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    int2 = setup_data["users"]["int2"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)
    int1_token = session_token(db, int1)
    int2_token = session_token(db, int2)

    future_time = (datetime.now(ICT) + timedelta(days=3)).replace(microsecond=0)

    payload = {
        "application_id": application.id,
        "round_number": 2,
        "round_name": "Vòng 2: Phỏng Vấn Chuyên Môn & Kỹ Thuật",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 90,
        "location": "Google Meet",
        "meeting_link": "https://meet.google.com/abc-defg-hij",
        "interviewer_ids": [int1.id, int2.id],
    }

    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    assert res.status_code == 201, res.text
    created = res.json()
    assert len(created["interviewers"]) == 2
    assigned_ids = {i["interviewer_id"] for i in created["interviewers"]}
    assert assigned_ids == {int1.id, int2.id}

    # Verify both interviewers see this interview on their personal schedule
    res1 = client.get("/api/v1/interviews?mine=true", headers={"Authorization": f"Bearer {int1_token}"})
    assert res1.status_code == 200
    interviews1 = res1.json()
    assert any(i["id"] == created["id"] for i in interviews1)

    res2 = client.get("/api/v1/interviews?mine=true", headers={"Authorization": f"Bearer {int2_token}"})
    assert res2.status_code == 200
    interviews2 = res2.json()
    assert any(i["id"] == created["id"] for i in interviews2)


def test_tc_s6_02_03_cannot_schedule_in_past(setup_data):
    """TC-S6-02-03 (AC03): Reject schedule with past time with HTTP 422."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    token = session_token(db, rec)

    past_time = (datetime.now(ICT) - timedelta(days=1)).replace(microsecond=0)

    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": past_time.isoformat(),
        "duration_minutes": 45,
        "location": "Phòng Họp 302",
        "interviewer_ids": [int1.id],
    }

    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422
    assert "quá khứ" in res.json()["detail"].lower()


def test_tc_s6_02_04_schedule_visible_on_candidate_and_interviewer(setup_data):
    """TC-S6-02-04 (AC04): Interview is visible on candidate profile and interviewer schedule."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    rec_token = session_token(db, rec)
    int1_token = session_token(db, int1)

    future_time = (datetime.now(ICT) + timedelta(days=4)).replace(microsecond=0)

    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Phòng Họp VIP",
        "interviewer_ids": [int1.id],
    }

    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {rec_token}"})
    assert res.status_code == 201
    created_id = res.json()["id"]

    # 1. Check candidate profile endpoint contains the interview
    res_prof = client.get(f"/api/v1/applications/{application.id}/profile", headers={"Authorization": f"Bearer {rec_token}"})
    assert res_prof.status_code == 200
    prof_data = res_prof.json()
    assert "interviews" in prof_data
    assert any(i["id"] == created_id for i in prof_data["interviews"])

    # 2. Check candidate status automatically changed to interviewing
    assert prof_data["application"]["status"] == "interviewing"

    # 3. Check interviewer personal schedule
    res_mine = client.get("/api/v1/interviews?mine=true", headers={"Authorization": f"Bearer {int1_token}"})
    assert res_mine.status_code == 200
    assert any(i["id"] == created_id for i in res_mine.json())


def test_tc_s6_02_x01_boundary_one_minute_past_and_future(setup_data):
    """TC-S6-02-X01 (QA-EXTRA): 1 minute in the past is rejected (422), future time is accepted (201)."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    token = session_token(db, rec)

    # 1 minute past
    one_min_ago = (datetime.now(ICT) - timedelta(minutes=1)).replace(microsecond=0)
    payload_past = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": one_min_ago.isoformat(),
        "duration_minutes": 30,
        "location": "Phòng Họp 101",
        "interviewer_ids": [int1.id],
    }
    res_past = client.post("/api/v1/interviews", json=payload_past, headers={"Authorization": f"Bearer {token}"})
    assert res_past.status_code == 422
    assert "quá khứ" in res_past.json()["detail"].lower()

    # 1 hour future
    one_hour_future = (datetime.now(ICT) + timedelta(hours=1)).replace(microsecond=0)
    payload_future = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": one_hour_future.isoformat(),
        "duration_minutes": 30,
        "location": "Phòng Họp 101",
        "interviewer_ids": [int1.id],
    }
    res_future = client.post("/api/v1/interviews", json=payload_future, headers={"Authorization": f"Bearer {token}"})
    assert res_future.status_code == 201


def test_tc_s6_02_05_schedule_empty_interviewers_blocked_422(setup_data):
    """TC-S6-02-05 (AC02): Scheduling with empty interviewer list is rejected with HTTP 422."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    application = setup_data["application"]
    token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Phòng Họp 302",
        "interviewer_ids": [],
    }
    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422
    assert "người phỏng vấn" in res.json()["detail"].lower()


def test_tc_s6_02_06_schedule_online_format_with_meet_link(setup_data):
    """TC-S6-02-06 (AC01): Online interview with meeting link and Vòng 2 round_number."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    token = session_token(db, rec)

    future_time = (datetime.now(ICT) + timedelta(days=3)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 2,
        "round_name": "Vòng 2: Phỏng vấn Chuyên môn / Technical",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 60,
        "location": "Trực tuyến",
        "meeting_link": "https://meet.google.com/abc-xyz-123",
        "interviewer_ids": [int1.id],
    }
    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["round_number"] == 2
    assert data["round_name"] == "Vòng 2: Phỏng vấn Chuyên môn / Technical"
    assert data["meeting_link"] == "https://meet.google.com/abc-xyz-123"
    assert data["location"] == "Trực tuyến"
    assert data["duration_minutes"] == 60


def test_tc_s6_02_07_cannot_schedule_for_terminal_status_applications(setup_data):
    """TC-S6-02-07 (Integrity): Reject scheduling for applications in terminal status (rejected/hired/withdrawn)."""
    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or override_get_db] = override_get_db
    db = setup_data["db"]
    rec = setup_data["users"]["rec"]
    int1 = setup_data["users"]["int1"]
    application = setup_data["application"]
    token = session_token(db, rec)

    application.status = "rejected"
    db.commit()

    future_time = (datetime.now(ICT) + timedelta(days=2)).replace(microsecond=0)
    payload = {
        "application_id": application.id,
        "round_number": 1,
        "round_name": "Vòng 1: HR Screening",
        "scheduled_time": future_time.isoformat(),
        "duration_minutes": 45,
        "location": "Phòng Họp 302",
        "interviewer_ids": [int1.id],
    }
    res = client.post("/api/v1/interviews", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 409
    assert "rejected" in res.json()["detail"].lower()

