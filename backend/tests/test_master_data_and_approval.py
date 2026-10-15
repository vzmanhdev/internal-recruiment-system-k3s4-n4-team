"""EP-02 master data and EP-03 approval configuration: real API + independent DB reads."""
from datetime import date, timedelta

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
from app.models.hr import Department, JobTitle
from app.models.requisition import JobRequisition
from app.models.master_data import CompetencyCriterion
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
def ctx():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    roles = {r["code"]: Role(code=r["code"], name=r["name"]) for r in ROLES_DATA}
    db.add_all(roles.values())
    for p in PERMISSIONS_DATA:
        db.add(Permission(code=p["code"], name=p["name"], module=p["module"]))
    for role_code, granted in DEFAULT_GRANTED_MATRIX.items():
        for p in PERMISSIONS_DATA:
            db.add(RolePermission(role_code=role_code, permission_code=p["code"], is_granted=p["code"] in granted))
    db.commit()
    users = {}
    for key, role in [("hrm", "hr_manager"), ("hm", "hiring_manager"), ("approver", "approver"), ("emp", "employee")]:
        u = User(email=f"{key}@example.com", full_name=key, hashed_password=hash_password("Password123"), role=role,
                 is_active=True, account_status="active", security_version=1)
        db.add(u); db.flush()
        db.add(UserRole(user_id=u.id, role_id=roles[role].id))
        users[key] = u
    dept = Department(code="ENG", name="Kỹ thuật")
    db.add(dept); db.commit()
    title = JobTitle(name="Kỹ sư Backend", department_id=dept.id, level="Senior", min_salary=20_000_000, max_salary=30_000_000)
    db.add(title); db.commit()
    out = {"h": {k: {"Authorization": f"Bearer {session_token(db, u)}"} for k, u in users.items()},
           "ids": {k: u.id for k, u in users.items()}, "dept": dept.id, "title": title.id}
    db.close()
    yield out
    Base.metadata.drop_all(bind=engine)


def _req(ctx, **extra):
    body = {"title": "Backend", "department_id": ctx["dept"], "quantity": 1,
            "target_onboard_date": (date.today() + timedelta(days=40)).isoformat()}
    body.update(extra)
    return client.post("/api/v1/requisitions", headers=ctx["h"]["hm"], json=body)


def test_salary_band_hidden_from_non_hr(ctx):
    hr = client.get("/api/v1/hr/job-titles", headers=ctx["h"]["hrm"]).json()[0]
    hm = client.get("/api/v1/hr/job-titles", headers=ctx["h"]["hm"]).json()[0]
    assert "min_salary" in hr and "min_salary" not in hm and "max_salary" not in hm


def test_framework_weights_must_total_100_and_questions_link_criteria(ctx):
    bad = client.post("/api/v1/hr/competency-frameworks", headers=ctx["h"]["hrm"], json={
        "code": "CF-1", "name": "Khung BE", "criteria": [{"code": "A", "name": "Thiết kế", "weight": 60}, {"code": "B", "name": "Code", "weight": 30}]})
    assert bad.status_code == 422
    ok = client.post("/api/v1/hr/competency-frameworks", headers=ctx["h"]["hrm"], json={
        "code": "CF-1", "name": "Khung BE", "applied_job_titles": ["Kỹ sư Backend"],
        "criteria": [{"code": "A", "name": "Thiết kế", "weight": 60}, {"code": "B", "name": "Code", "weight": 40}]})
    assert ok.status_code == 201 and ok.json()["total_weight"] == 100
    crit_id = ok.json()["criteria"][0]["id"]
    assert client.post("/api/v1/hr/interview-questions", headers=ctx["h"]["hrm"], json={
        "code": "Q1", "content": "Thiết kế hệ thống chịu tải?", "criteria_id": "missing"}).status_code == 422
    q = client.post("/api/v1/hr/interview-questions", headers=ctx["h"]["hrm"], json={
        "code": "Q1", "content": "Thiết kế hệ thống chịu tải?", "criteria_id": crit_id, "job_title": "Kỹ sư Backend",
        "difficulty": "hard", "suggested_answer": "Cache, queue"})
    assert q.status_code == 201
    found = client.get("/api/v1/hr/interview-questions?job_title=Backend&difficulty=hard", headers=ctx["h"]["hm"]).json()
    assert [x["code"] for x in found] == ["Q1"]
    db = TestingSessionLocal()
    assert db.query(CompetencyCriterion).count() == 2
    db.close()


def test_department_with_requisitions_cannot_be_deleted_only_deactivated(ctx):
    assert _req(ctx, save_as_draft=True).status_code == 201
    assert client.delete(f"/api/v1/hr/departments/{ctx['dept']}", headers=ctx["h"]["hrm"]).status_code == 409
    assert client.post(f"/api/v1/hr/departments/{ctx['dept']}/deactivate", headers=ctx["h"]["hrm"]).json()["is_active"] is False
    assert client.get("/api/v1/hr/departments", headers=ctx["h"]["hm"]).json() == []


def test_referenced_category_cannot_be_deleted(ctx):
    cat = client.post("/api/v1/hr/categories", headers=ctx["h"]["hrm"], json={"category_type": "work_location", "name": "Đà Nẵng"}).json()
    _req(ctx, work_location="Đà Nẵng", save_as_draft=True)
    assert client.delete(f"/api/v1/hr/categories/{cat['id']}", headers=ctx["h"]["hrm"]).status_code == 409


def test_out_of_band_salary_requires_justification(ctx):
    assert _req(ctx, job_title_id=ctx["title"], min_salary=25_000_000, max_salary=40_000_000).status_code == 422
    resp = _req(ctx, job_title_id=ctx["title"], min_salary=25_000_000, max_salary=40_000_000, salary_justification="Thị trường khan hiếm")
    assert resp.status_code == 201 and resp.json()["job_title_name"] == "Kỹ sư Backend"


def test_headcount_budget_blocks_until_hr_override(ctx):
    year = date.today().year
    client.post("/api/v1/hr/headcounts", headers=ctx["h"]["hrm"], json={"department_id": ctx["dept"], "year": year, "budget_quantity": 2})
    assert _req(ctx, quantity=2).status_code == 201
    st = client.get(f"/api/v1/hr/headcounts/status?department_id={ctx['dept']}", headers=ctx["h"]["hm"]).json()
    assert st["remaining"] == 0
    blocked = _req(ctx, quantity=1)
    assert blocked.status_code == 409 and blocked.json()["error"]["code"] == "HEADCOUNT_EXCEEDED"
    draft = _req(ctx, quantity=1, save_as_draft=True).json()
    assert client.post(f"/api/v1/requisitions/{draft['id']}/submit", headers=ctx["h"]["hm"]).status_code == 409
    client.post(f"/api/v1/requisitions/{draft['id']}/headcount-override", headers=ctx["h"]["hrm"], json={"reason": "Mở rộng dự án"})
    assert client.post(f"/api/v1/requisitions/{draft['id']}/submit", headers=ctx["h"]["hm"]).json()["status"] == "pending_manager"


def test_high_salary_escalates_to_executive_and_snapshot_survives_config_change(ctx):
    client.post("/api/v1/hr/approval-flows", headers=ctx["h"]["hrm"], json={
        "name": "Lương cao", "steps": ["manager", "hr", "executive"], "min_salary_threshold": 50_000_000})
    assert client.post("/api/v1/hr/approval-flows", headers=ctx["h"]["hrm"], json={
        "name": "Sai", "steps": [], "min_salary_threshold": 0}).status_code == 422  # S3-01 AC3
    rid = _req(ctx, min_salary=55_000_000, max_salary=70_000_000).json()["id"]
    flows = client.get("/api/v1/hr/approval-flows", headers=ctx["h"]["hrm"]).json()
    client.put(f"/api/v1/hr/approval-flows/{flows[0]['id']}", headers=ctx["h"]["hrm"], json={
        "name": "Lương cao", "steps": ["hr"], "min_salary_threshold": 50_000_000})
    assert client.post(f"/api/v1/requisitions/{rid}/approve", headers=ctx["h"]["approver"], json={"action": "approved"}).json()["status"] == "pending_hr"
    assert client.post(f"/api/v1/requisitions/{rid}/approve", headers=ctx["h"]["hrm"], json={"action": "approved"}).json()["status"] == "pending_executive"
    assert client.post(f"/api/v1/requisitions/{rid}/approve", headers=ctx["h"]["hrm"], json={"action": "approved"}).status_code == 403
    final = client.post(f"/api/v1/requisitions/{rid}/approve", headers=ctx["h"]["approver"], json={"action": "approved"})
    assert final.json()["status"] == "approved"
    low = _req(ctx, min_salary=10_000_000, max_salary=20_000_000).json()
    assert low["approval_chain"] == ["manager", "hr"]


def test_copy_creates_clean_draft(ctx):
    src = _req(ctx, job_description="JD gốc", requirements="Python").json()
    copy = client.post(f"/api/v1/requisitions/{src['id']}/copy", headers=ctx["h"]["hm"])
    assert copy.status_code == 201
    data = client.get(f"/api/v1/requisitions/{copy.json()['id']}", headers=ctx["h"]["hm"]).json()
    assert data["status"] == "draft" and data["job_description"] == "JD gốc" and data["approval_logs"] == []
    db = TestingSessionLocal()
    assert db.query(JobRequisition).count() == 2
    db.close()


def test_only_unsubmitted_drafts_can_be_deleted_by_creator(ctx):
    draft = _req(ctx, save_as_draft=True).json()
    submitted = _req(ctx).json()
    assert client.delete(f"/api/v1/requisitions/{draft['id']}", headers=ctx["h"]["emp"]).status_code == 403
    assert client.delete(f"/api/v1/requisitions/{submitted['id']}", headers=ctx["h"]["hm"]).status_code == 409
    assert client.delete(f"/api/v1/requisitions/{draft['id']}", headers=ctx["h"]["hm"]).status_code == 200
    db = TestingSessionLocal()
    assert db.query(JobRequisition).count() == 1
    db.close()
