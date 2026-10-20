"""Tests for User Story SCRUM-69 (S4-02):
Là Ứng viên, tôi muốn xem chi tiết một tin tuyển dụng, để biết đủ thông tin để quyết định có nộp hồ sơ hay không.

Subtasks covered:
- SCRUM-532 [S4-02][BE-01] API & nghiệp vụ chính — xem chi tiết một tin tuyển dụng
- SCRUM-533 [S4-02][BE-02] Rule & edge case (hết hạn is_expired, slug lookup)
- SCRUM-536 [S4-02][QA-01] Test chức năng chính (tăng views_count, cấu trúc dữ liệu đầy đủ)
- SCRUM-537 [S4-02][QA-02] Negative & regression (404 khi không tồn tại, RBAC cho tin chưa xuất bản)
"""
from datetime import date, timedelta
import json
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
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.hr import Department
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


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # 1. Seed RBAC roles & permissions
    roles = {r["code"]: Role(code=r["code"], name=r["name"]) for r in ROLES_DATA}
    db.add_all(roles.values())
    for p in PERMISSIONS_DATA:
        db.add(Permission(code=p["code"], name=p["name"], module=p["module"]))
    for role_code, granted in DEFAULT_GRANTED_MATRIX.items():
        for p in PERMISSIONS_DATA:
            db.add(RolePermission(role_code=role_code, permission_code=p["code"], is_granted=p["code"] in granted))
    db.commit()

    # 2. Seed HR Manager User
    hr_user = User(
        email="hrmanager@company.com",
        hashed_password=hash_password("password123"),
        full_name="Nguyễn Văn HR",
        account_status="active",
        is_active=True,
        security_version=1
    )
    db.add(hr_user)
    db.flush()
    db.add(UserRole(user_id=hr_user.id, role_id=roles["hr_manager"].id))

    # 3. Seed Candidate User
    cand_user = User(
        email="candidate@gmail.com",
        hashed_password=hash_password("password123"),
        full_name="Ứng Viên Demo",
        account_status="active",
        is_active=True,
        security_version=1
    )
    db.add(cand_user)
    db.flush()
    db.add(UserRole(user_id=cand_user.id, role_id=roles["candidate"].id))

    # 4. Seed Department & Requisition
    dept = Department(name="Khối Công Nghệ", code="IT", is_active=True)
    db.add(dept)
    db.flush()

    req = JobRequisition(
        code="REQ-2026-001",
        title="Senior Python Backend Engineer",
        department_id=dept.id,
        created_by_id=hr_user.id,
        quantity=3,
        status="approved"
    )
    db.add(req)
    db.flush()

    today = date.today()
    future_date = (today + timedelta(days=30)).isoformat()
    past_date = (today - timedelta(days=5)).isoformat()

    # 5. Active Published Job
    active_job = JobPosting(
        title="Senior Python Backend Engineer",
        slug="senior-python-backend-engineer",
        requisition_id=req.id,
        department_id=dept.id,
        department_name="Khối Công Nghệ",
        created_by_id=hr_user.id,
        location="Hà Nội",
        type="Full-time",
        level="Senior",
        salary_range="25 - 35 Triệu",
        deadline=future_date,
        description="Mô tả công việc: Thiết kế microservices bằng FastAPI và PostgreSQL.",
        requirements="Yêu cầu: Ít nhất 3 năm kinh nghiệm Python, Docker, CI/CD.",
        benefits="Quyền lợi: Thưởng tháng 13, bảo hiểm sức khỏe VIP, du lịch hàng năm.",
        status="published",
        views_count=10,
        min_years_experience=3,
        required_skills_json=json.dumps(["Python", "FastAPI", "PostgreSQL", "Docker"])
    )
    db.add(active_job)

    # 6. Expired Published Job
    expired_job = JobPosting(
        title="Frontend React Developer (Hết hạn)",
        slug="frontend-react-developer-expired",
        requisition_id=req.id,
        department_id=dept.id,
        department_name="Khối Công Nghệ",
        created_by_id=hr_user.id,
        location="Đà Nẵng",
        type="Full-time",
        level="Mid-Level",
        salary_range="15 - 22 Triệu",
        deadline=past_date,
        description="Mô tả công việc: Phát triển ứng dụng Next.js.",
        requirements="Yêu cầu: Thành thạo React, TypeScript.",
        benefits="Quyền lợi: Môi trường năng động.",
        status="published",
        views_count=50,
        min_years_experience=2,
        required_skills_json=json.dumps(["React", "TypeScript"])
    )
    db.add(expired_job)

    # 7. Draft/Unpublished Job
    draft_job = JobPosting(
        title="AI Engineer (Nháp)",
        slug="ai-engineer-draft",
        requisition_id=req.id,
        department_id=dept.id,
        department_name="Khối Công Nghệ",
        created_by_id=hr_user.id,
        location="Hà Nội",
        type="Full-time",
        level="Senior",
        salary_range="30 - 45 Triệu",
        deadline=future_date,
        description="Nghiên cứu mô hình LLM.",
        requirements="Yêu cầu: Kinh nghiệm PyTorch.",
        benefits="Quyền lợi: Hấp dẫn.",
        status="pending_review",
        views_count=0
    )
    db.add(draft_job)
    db.commit()

    hr_tok = session_token(db, hr_user)
    cand_tok = session_token(db, cand_user)
    db.close()

    yield {
        "hr_token": hr_tok,
        "cand_token": cand_tok
    }
    Base.metadata.drop_all(bind=engine)


def test_job_detail_happy_path(setup_database):
    """SCRUM-532 (BE-01) & SCRUM-536 (QA-01): Xem chi tiết tin hợp lệ, kiểm tra tăng views_count và cấu trúc trường."""
    # 1. Fetch job by ID
    res = client.get("/api/v1/jobs/1")
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["id"] == 1
    assert data["title"] == "Senior Python Backend Engineer"
    assert data["slug"] == "senior-python-backend-engineer"
    assert "Mô tả công việc" in data["description"]
    assert "Yêu cầu" in data["requirements"]
    assert "Quyền lợi" in data["benefits"]
    assert data["salary_range"] == "25 - 35 Triệu"
    assert data["min_years_experience"] == 3
    assert data["required_skills"] == ["Python", "FastAPI", "PostgreSQL", "Docker"]
    assert data["openings"] == 3
    assert data["is_expired"] is False
    assert data["views_count"] == 11  # Automatically incremented from 10 to 11

    # 2. Fetch again to verify views_count keeps incrementing
    res2 = client.get("/api/v1/jobs/1")
    assert res2.status_code == 200
    assert res2.json()["views_count"] == 12


def test_job_detail_by_slug(setup_database):
    """SCRUM-533 (BE-02): Tra cứu chi tiết tin tuyển dụng bằng Slug thay vì ID số."""
    res = client.get("/api/v1/jobs/senior-python-backend-engineer")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["id"] == 1
    assert data["slug"] == "senior-python-backend-engineer"
    assert data["title"] == "Senior Python Backend Engineer"


def test_job_detail_expired_status(setup_database):
    """SCRUM-533 (BE-02): Tin có deadline trong quá khứ phải trả về is_expired = True."""
    res = client.get("/api/v1/jobs/2")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["id"] == 2
    assert data["is_expired"] is True
    assert data["title"] == "Frontend React Developer (Hết hạn)"
    assert data["required_skills"] == ["React", "TypeScript"]


def test_job_detail_not_found(setup_database):
    """SCRUM-537 (QA-02): Tra cứu ID hoặc slug không tồn tại phải trả về đúng 404."""
    res_id = client.get("/api/v1/jobs/99999")
    assert res_id.status_code == 404
    assert "Không tìm thấy" in res_id.json().get("detail", "")

    res_slug = client.get("/api/v1/jobs/non-existent-job-slug")
    assert res_slug.status_code == 404
    assert "Không tìm thấy" in res_slug.json().get("detail", "")


def test_job_detail_draft_rbac(setup_database):
    """SCRUM-537 (QA-02): Khách vãng lai / ứng viên không được xem tin chưa xuất bản (404), nhân sự HR xem được (200)."""
    tokens = setup_database

    # 1. Public guest request for draft job (ID 3) -> 404 Not Found
    res_guest = client.get("/api/v1/jobs/3")
    assert res_guest.status_code == 404

    # 2. Candidate request for draft job -> 404 Not Found
    res_cand = client.get("/api/v1/jobs/3", headers={"Authorization": f"Bearer {tokens['cand_token']}"})
    assert res_cand.status_code == 404

    # 3. HR Manager request for draft job -> 200 OK
    res_hr = client.get("/api/v1/jobs/3", headers={"Authorization": f"Bearer {tokens['hr_token']}"})
    assert res_hr.status_code == 200
    assert res_hr.json()["title"] == "AI Engineer (Nháp)"
    assert res_hr.json()["status"] == "pending_review"
