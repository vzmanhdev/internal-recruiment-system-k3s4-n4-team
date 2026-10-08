import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.security import verify_password, hash_password
from app.models.user import User
from app.models.hr import Department
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.referral_eval import InternalReferral, CandidateEvaluation

TEST_DB_FILE = "./test_recruitment.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed Department
    dept = Department(name="Khối Công Nghệ", code="IT_DEPT")
    db.add(dept)
    # Seed Admin Account with Bcrypt password
    admin = User(
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        full_name="System Admin",
        role="admin,hr_manager,manager",
        is_active=True,
        account_status="active"
    )
    db.add(admin)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

def test_full_e2e_recruitment_lifecycle():
    client = TestClient(app)

    # 1. Admin Login & Token Retrieval
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    assert login_resp.status_code == 200, login_resp.text
    admin_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify Bcrypt password security
    db = TestingSessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@test.com").first()
    assert admin_user.hashed_password.startswith("$2b$") or admin_user.hashed_password.startswith("$2a$")
    assert verify_password("admin123", admin_user.hashed_password)
    db.close()

    # 2. Register candidate user account
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "candidate@test.com",
        "password": "candidate123",
        "full_name": "Nguyễn Văn Candidate",
        "phone": "0912345678"
    })
    assert reg_resp.status_code == 201
    cand_id = reg_resp.json()["user"]["id"]

    # Approve candidate account as Admin
    appr_resp = client.post(f"/api/v1/auth/users/{cand_id}/approve", headers=headers)
    assert appr_resp.status_code == 200

    # 3. Create Job Requisition
    req_payload = {
        "title": "Backend Python Engineer",
        "department_id": 1,
        "quantity": 2,
        "reason": "expansion",
        "priority": "high",
        "employment_type": "Full-time",
        "work_location": "Hà Nội",
        "min_salary": 25000000,
        "max_salary": 35000000,
        "job_description": "Xây dựng hệ thống microservices tuyển dụng.",
        "requirements": "Python, FastAPI, PostgreSQL"
    }
    req_resp = client.post("/api/v1/requisitions", json=req_payload, headers=headers)
    assert req_resp.status_code == 201
    req_id = req_resp.json()["id"]
    assert req_resp.json()["status"] == "pending_manager"

    # Step 3a: Step 1 Approval (pending_manager -> pending_hr)
    appr1_resp = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"action": "approved", "comment": "Duyệt cấp 1"}, headers=headers)
    assert appr1_resp.status_code == 200
    assert appr1_resp.json()["status"] == "pending_hr"

    # Step 3b: Step 2 Approval (pending_hr -> approved)
    appr2_resp = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"action": "approved", "comment": "Duyệt cấp 2 HR"}, headers=headers)
    assert appr2_resp.status_code == 200
    assert appr2_resp.json()["status"] == "approved"

    # 4. Create Job Posting
    job_payload = {
        "title": "Kỹ Sư Backend Python Senior",
        "requisition_id": req_id,
        "department_id": 1,
        "department_name": "Khối Công Nghệ",
        "location": "Hà Nội",
        "type": "Full-time",
        "level": "Senior",
        "salary_range": "25 - 35 Triệu",
        "description": "Lập trình backend bằng Python FastAPI",
        "requirements": "FastAPI, PostgreSQL, Docker",
        "status": "published"
    }
    job_resp = client.post("/api/v1/jobs", json=job_payload, headers=headers)
    assert job_resp.status_code == 201
    job_id = job_resp.json()["id"]
    assert job_resp.json()["slug"] is not None

    # 5. Candidate Login & Application Submission
    cand_login = client.post("/api/v1/auth/login", json={"email": "candidate@test.com", "password": "candidate123"})
    cand_token = cand_login.json()["access_token"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    app_payload = {
        "job_posting_id": job_id,
        "full_name": "Nguyễn Văn Candidate",
        "email": "candidate@test.com",
        "phone": "0912345678",
        "years_of_experience": 3,
        "cv_url": "https://storage.example.com/cv.pdf"
    }
    app_resp = client.post("/api/v1/applications", json=app_payload, headers=cand_headers)
    assert app_resp.status_code == 201
    app_id = app_resp.json()["id"]
    assert app_resp.json()["status"] == "submitted"

    # 6. Update Application Status to Screening & Interviewing
    st1 = client.put(f"/api/v1/applications/{app_id}/status", json={"status": "screening", "hr_notes": "Hồ sơ phù hợp"}, headers=headers)
    assert st1.status_code == 200
    assert st1.json()["status"] == "screening"

    st2 = client.put(f"/api/v1/applications/{app_id}/status", json={"status": "interviewing", "hr_notes": "Chuyển sang phỏng vấn"}, headers=headers)
    assert st2.status_code == 200

    # 7. Schedule Interview
    int_payload = {
        "application_id": app_id,
        "round_number": 1,
        "round_name": "Vòng Phỏng Vấn Chuyên Môn",
        "scheduled_time": "2026-10-10T09:00:00",
        "duration_minutes": 60,
        "location": "Google Meet",
        "meeting_link": "https://meet.google.com/test-meet",
        "interviewer_ids": [1]
    }
    int_resp = client.post("/api/v1/interviews", json=int_payload, headers=headers)
    assert int_resp.status_code == 201, int_resp.text
    int_id = int_resp.json()["id"]

    # 8. Submit Interview Evaluation
    eval_resp = client.put(f"/api/v1/interviews/{int_id}/feedback", json={
        "status": "completed",
        "score": 9,
        "passed": True,
        "feedback_notes": "Ứng viên trả lời xuất sắc kiến thức Python & FastAPI."
    }, headers=headers)
    assert eval_resp.status_code == 200
    assert eval_resp.json()["status"] == "completed"

    # 9. Create Offer & Accept
    offer_payload = {
        "application_id": app_id,
        "job_title": "Kỹ Sư Backend Python Senior",
        "offered_salary": 30000000,
        "start_date": "2026-11-01"
    }
    off_resp = client.post("/api/v1/offers", json=offer_payload, headers=headers)
    assert off_resp.status_code == 201
    off_id = off_resp.json()["id"]

    off_accept = client.put(f"/api/v1/offers/{off_id}/status", json={"status": "accepted"}, headers=headers)
    assert off_accept.status_code == 200
    assert off_accept.json()["status"] == "accepted"

    # 10. Analytics Dashboard Audit
    analytics_resp = client.get("/api/v1/analytics/overview", headers=headers)
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert "kpis" in data
    assert "active_jobs" in data["kpis"]
    assert data["kpis"]["total_applications"] >= 1

def test_rbac_security_enforcement():
    client = TestClient(app)

    # 1. Admin creates a requisition first
    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    req_payload = {
        "title": "Security Audit Test Requisition",
        "department_id": 1,
        "quantity": 1
    }
    req_resp = client.post("/api/v1/requisitions", json=req_payload, headers=admin_headers)
    assert req_resp.status_code == 201
    req_id = req_resp.json()["id"]

    # 2. Unauthenticated Request (Missing Authorization Header)
    resp = client.post("/api/v1/requisitions", json=req_payload)
    assert resp.status_code == 401

    # 3. Unauthorized Role Attempting Admin Actions
    db = TestingSessionLocal()
    emp = User(
        email="emp@test.com",
        hashed_password=hash_password("emp123"),
        full_name="Employee Normal",
        role="employee",
        is_active=True,
        account_status="active"
    )
    db.add(emp)
    db.commit()
    db.close()

    emp_login = client.post("/api/v1/auth/login", json={"email": "emp@test.com", "password": "emp123"})
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Normal employee trying to list pending users or approve users must get 403 Forbidden
    forbidden_resp = client.get("/api/v1/auth/pending-users", headers=emp_headers)
    assert forbidden_resp.status_code == 403

    # Normal employee trying to approve requisition must get 403 Forbidden
    req_appr_resp = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"action": "approved"}, headers=emp_headers)
    assert req_appr_resp.status_code == 403
