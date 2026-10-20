"""Tests for User Story SCRUM-81 (S3-10):
Là Trưởng phòng Nhân sự, tôi muốn duyệt và xuất bản tin tuyển dụng, để tin đăng ra ngoài luôn đúng chuẩn thương hiệu công ty.

Subtasks covered:
- SCRUM-490 [S3-10][BE-01] API & nghiệp vụ chính — duyệt và xuất bản tin tuyển dụng
- SCRUM-491 [S3-10][BE-02] Rule & edge case (chặn hết hạn, request changes, RBAC, audit log)
- SCRUM-494 [S3-10][QA-01] Test chức năng chính (Duyệt tin, ghi nhận publisher, public API visibility)
- SCRUM-519 [S3-10][QA-02] Negative & regression (403 RBAC, 422 expired, 404 unapproved on public API)
"""
from datetime import date, datetime, timedelta
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
from app.models.audit import Permission, RolePermission, AuditLog
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

    # 2. Seed Users: HR Manager, Recruiter, Candidate
    pw = hash_password("password123")
    hrm = User(id=1, email="hrmanager@company.com", hashed_password=pw, full_name="Nguyễn Văn Trưởng HR", role="hr_manager", is_active=True)
    rec = User(id=2, email="recruiter@company.com", hashed_password=pw, full_name="Lê Tuyển Dụng", role="recruiter", is_active=True)
    can = User(id=3, email="candidate@company.com", hashed_password=pw, full_name="Trần Ứng Viên", role="candidate", is_active=True)
    db.add_all([hrm, rec, can])
    db.commit()

    db.add_all([
        UserRole(user_id=hrm.id, role_id=roles["hr_manager"].id),
        UserRole(user_id=rec.id, role_id=roles["recruiter"].id),
        UserRole(user_id=can.id, role_id=roles["candidate"].id),
    ])
    db.commit()

    # 3. Department & Approved Requisition
    dept = Department(id=1, name="Khối Công Nghệ Thông Tin", code="IT")
    db.add(dept)
    db.commit()

    req = JobRequisition(
        id=1,
        code="REQ-2026-001",
        title="Kỹ Sư Backend Python",
        department_id=dept.id,
        quantity=2,
        status="approved",
        created_by_id=hrm.id
    )
    db.add(req)
    db.commit()

    # 4. Job Postings in different states
    job_pending = JobPosting(
        id=1,
        slug="ky-su-backend-python-pending",
        title="Kỹ Sư Backend Python",
        requisition_id=req.id,
        department_id=dept.id,
        department_name=dept.name,
        salary_range="25 - 35 Triệu",
        type="Full-time",
        level="Senior",
        location="Hà Nội",
        deadline=(date.today() + timedelta(days=30)).isoformat(),
        description="Mô tả công việc chi tiết cho backend engineer.",
        requirements="Python, FastAPI, PostgreSQL.",
        benefits="Macbook Pro, Thưởng quý.",
        status="pending_review",
        created_by_id=rec.id
    )
    job_published = JobPosting(
        id=2,
        slug="frontend-react-lead-published",
        title="Frontend React Lead",
        requisition_id=req.id,
        department_id=dept.id,
        department_name=dept.name,
        salary_range="30 - 45 Triệu",
        type="Full-time",
        level="Lead",
        location="Hà Nội",
        deadline=(date.today() + timedelta(days=20)).isoformat(),
        description="Dẫn dắt đội ngũ Frontend React & Next.js.",
        requirements="5+ năm React, TypeScript.",
        benefits="Bảo hiểm sức khỏe VIP.",
        status="published",
        created_by_id=rec.id,
        published_by_id=hrm.id,
        published_at=datetime.utcnow()
    )
    job_draft = JobPosting(
        id=3,
        slug="devops-engineer-draft",
        title="DevOps Engineer",
        requisition_id=req.id,
        department_id=dept.id,
        department_name=dept.name,
        salary_range="20 - 30 Triệu",
        type="Full-time",
        level="Mid-Level",
        location="Hà Nội",
        deadline=(date.today() + timedelta(days=15)).isoformat(),
        description="Vận hành hạ tầng AWS & Kubernetes.",
        requirements="Docker, K8s, Terraform.",
        benefits="Phụ cấp ăn trưa.",
        status="draft",
        created_by_id=rec.id
    )
    db.add_all([job_pending, job_published, job_draft])
    db.commit()
    db.close()

    app.dependency_overrides[app.dependency_overrides.get("get_db", None) or app.dependency_overrides.setdefault("get_db", override_get_db)] = override_get_db
    yield
    app.dependency_overrides.clear()


def test_recruiter_cannot_publish_job_without_permission():
    """SCRUM-491 / TC-S3-10-X01: Recruiter has no job:publish permission -> 403 Forbidden."""
    db = TestingSessionLocal()
    rec_user = db.query(User).filter(User.id == 2).first()
    rec_token = session_token(db, rec_user)
    db.close()

    res = client.post("/api/v1/jobs/1/publish", headers={"Authorization": f"Bearer {rec_token}"})
    assert res.status_code == 403
    assert "Chỉ Trưởng phòng Nhân sự" in res.json()["detail"]


def test_candidate_cannot_publish_job():
    """Negative: Candidate cannot publish -> 403 Forbidden."""
    db = TestingSessionLocal()
    can_user = db.query(User).filter(User.id == 3).first()
    can_token = session_token(db, can_user)
    db.close()

    res = client.post("/api/v1/jobs/1/publish", headers={"Authorization": f"Bearer {can_token}"})
    assert res.status_code == 403


def test_hr_manager_can_publish_pending_job_and_record_audit():
    """SCRUM-490 & AC1, AC3: HR Manager publishes pending job -> status published, publisher & timestamp recorded, audit log added."""
    db = TestingSessionLocal()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    res = client.post("/api/v1/jobs/1/publish", headers={"Authorization": f"Bearer {hrm_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "published"
    assert data["published_by_id"] == 1
    assert data["published_by_name"] == "Nguyễn Văn Trưởng HR"
    assert data["published_at"] is not None

    # Verify database persistence
    db = TestingSessionLocal()
    job = db.query(JobPosting).filter(JobPosting.id == 1).first()
    assert job.status == "published"
    assert job.published_by_id == 1
    assert job.published_at is not None

    # Verify AuditLog entry
    audit = db.query(AuditLog).filter(AuditLog.action == "job_posting:publish", AuditLog.target_id == "1").first()
    assert audit is not None
    assert audit.actor_id == 1
    assert audit.actor_email == "hrmanager@company.com"
    db.close()


def test_public_api_does_not_show_draft_or_pending_job():
    """SCRUM-490 / TC-S3-10-01 AC1: Public API only returns published jobs, never draft or pending."""
    res = client.get("/api/v1/jobs")
    assert res.status_code == 200
    items = res.json()
    ids = [item["id"] for item in items]
    assert 2 in ids  # published job
    assert 1 not in ids  # pending job
    assert 3 not in ids  # draft job

    # Direct access to pending job from public without staff token -> 404
    res_direct = client.get("/api/v1/jobs/ky-su-backend-python-pending")
    assert res_direct.status_code == 404


def test_public_api_shows_job_immediately_after_publish():
    """AC1: Once published by HR Manager, public API immediately reveals the job."""
    db = TestingSessionLocal()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    # Before publish: 404
    assert client.get("/api/v1/jobs/1").status_code == 404

    # Publish
    res_pub = client.post("/api/v1/jobs/1/publish", headers={"Authorization": f"Bearer {hrm_token}"})
    assert res_pub.status_code == 200

    # After publish: 200 with full details
    res_public = client.get("/api/v1/jobs/1")
    assert res_public.status_code == 200
    assert res_public.json()["title"] == "Kỹ Sư Backend Python"


def test_cannot_publish_expired_job():
    """SCRUM-491 Edge Case: Cannot publish a posting whose deadline has passed -> 422."""
    db = TestingSessionLocal()
    expired_job = JobPosting(
        id=99,
        slug="expired-job-test",
        title="Expired Job Test",
        requisition_id=1,
        department_id=1,
        department_name="Khối Công Nghệ Thông Tin",
        salary_range="10 - 15 Triệu",
        type="Full-time",
        level="Junior",
        location="Hà Nội",
        deadline=(date.today() - timedelta(days=5)).isoformat(),  # in past!
        description="Expired job description.",
        status="pending_review",
        created_by_id=2
    )
    db.add(expired_job)
    db.commit()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    res = client.post("/api/v1/jobs/99/publish", headers={"Authorization": f"Bearer {hrm_token}"})
    assert res.status_code == 422
    assert "quá hạn" in res.json()["detail"]


def test_cannot_publish_job_without_approved_requisition():
    """SCRUM-491 Rule: Cannot publish job if parent requisition is not approved -> 409."""
    db = TestingSessionLocal()
    draft_req = JobRequisition(
        id=2, code="REQ-DRAFT", title="Draft Requisition", department_id=1, quantity=1, status="draft", created_by_id=1
    )
    db.add(draft_req)
    db.commit()

    job_no_req = JobPosting(
        id=98, slug="job-no-approved-req", title="Job No Req", requisition_id=2,
        department_id=1, department_name="IT", salary_range="10M", type="Full-time", level="Mid",
        location="HN", deadline=(date.today() + timedelta(days=10)).isoformat(),
        description="Desc", status="pending_review", created_by_id=2
    )
    db.add(job_no_req)
    db.commit()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    res = client.post("/api/v1/jobs/98/publish", headers={"Authorization": f"Bearer {hrm_token}"})
    assert res.status_code == 409
    assert "Tờ trình gốc" in res.json()["detail"]


def test_hr_manager_can_request_changes_with_reason():
    """SCRUM-491 / AC1: HR Manager requests revision -> status becomes draft with review_note."""
    db = TestingSessionLocal()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    payload = {"reason": "Cần điều chỉnh dải lương và cập nhật yêu cầu chứng chỉ AWS."}
    res = client.post("/api/v1/jobs/1/request-changes", json=payload, headers={"Authorization": f"Bearer {hrm_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "draft"
    assert data["review_note"] == payload["reason"]

    # Verify database
    db = TestingSessionLocal()
    job = db.query(JobPosting).filter(JobPosting.id == 1).first()
    assert job.status == "draft"
    assert job.review_note == payload["reason"]

    # Verify AuditLog
    audit = db.query(AuditLog).filter(AuditLog.action == "job_posting:request_changes", AuditLog.target_id == "1").first()
    assert audit is not None
    db.close()


def test_request_changes_without_reason_fails():
    """Negative: Requesting revision without reason fails with 422."""
    db = TestingSessionLocal()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    res = client.post("/api/v1/jobs/1/request-changes", json={"reason": "  "}, headers={"Authorization": f"Bearer {hrm_token}"})
    assert res.status_code in (400, 422)


def test_unpublish_or_close_job_removes_from_public_portal():
    """SCRUM-491 / AC1: Closing/unpublishing a job removes it from the public portal immediately."""
    db = TestingSessionLocal()
    hrm_user = db.query(User).filter(User.id == 1).first()
    hrm_token = session_token(db, hrm_user)
    db.close()

    # Job 2 is currently published and visible
    res_pub = client.get("/api/v1/jobs/2")
    assert res_pub.status_code == 200

    # Close job 2
    res_close = client.post("/api/v1/jobs/2/close", headers={"Authorization": f"Bearer {hrm_token}"})
    assert res_close.status_code == 200
    assert res_close.json()["status"] == "closed"

    # Now public endpoint returns 404 for job 2
    assert client.get("/api/v1/jobs/2").status_code == 404

    # Public list no longer includes job 2
    res_list = client.get("/api/v1/jobs")
    ids = [item["id"] for item in res_list.json()]
    assert 2 not in ids
