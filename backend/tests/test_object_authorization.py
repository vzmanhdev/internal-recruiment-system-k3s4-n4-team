"""Regression tests for object-level authorization and workflow guards on the recruitment routers.

Every test goes through the real API (TestClient), uses the production RBAC seed matrix and checks
persisted rows with an independent DB session where state changes are asserted.
"""
from datetime import datetime, timedelta, date

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
from app.models.hr import Department
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.offer_onboarding import JobOffer
from app.models.referral_eval import CandidateEvaluation
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
def world():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    roles = {}
    for r in ROLES_DATA:
        role = Role(code=r["code"], name=r["name"])
        db.add(role)
        roles[r["code"]] = role
    for p in PERMISSIONS_DATA:
        db.add(Permission(code=p["code"], name=p["name"], module=p["module"]))
    for role_code, granted in DEFAULT_GRANTED_MATRIX.items():
        for p in PERMISSIONS_DATA:
            db.add(RolePermission(role_code=role_code, permission_code=p["code"], is_granted=p["code"] in granted))
    db.commit()

    def mk(email, *role_codes):
        u = User(email=email, full_name=email.split("@")[0], hashed_password=hash_password("Password123"),
                 role=",".join(role_codes), is_active=True, account_status="active", security_version=1)
        db.add(u)
        db.flush()
        for code in role_codes:
            db.add(UserRole(user_id=u.id, role_id=roles[code].id))
        db.commit()
        return u

    users = {
        "hrm": mk("hrm@example.com", "hr_manager"),
        "rec_a": mk("reca@example.com", "recruiter"),
        "rec_b": mk("recb@example.com", "recruiter"),
        "hm_a": mk("hma@example.com", "hiring_manager"),
        "int_a": mk("inta@example.com", "interviewer"),
        "int_b": mk("intb@example.com", "interviewer"),
        "approver": mk("approver@example.com", "approver"),
        "emp": mk("emp@example.com", "employee"),
        "cand": mk("cand@example.com", "employee"),
    }
    dept = Department(code="IT", name="Công nghệ")
    db.add(dept)
    db.commit()
    req = JobRequisition(code="REQ-T-001", title="Backend", department_id=dept.id, quantity=1, status="approved",
                         current_approval_step="completed", created_by_id=users["hm_a"].id,
                         min_salary=20_000_000, max_salary=30_000_000)
    db.add(req)
    db.commit()
    job = JobPosting(slug="backend", title="Backend", requisition_id=req.id, department_id=dept.id,
                     department_name=dept.name, description="d", status="published", created_by_id=users["hrm"].id)
    draft_job = JobPosting(slug="secret-draft", title="Secret", requisition_id=req.id, department_id=dept.id,
                           department_name=dept.name, description="d", status="pending_review", created_by_id=users["hrm"].id)
    db.add_all([job, draft_job])
    db.commit()

    tokens = {k: session_token(db, u) for k, u in users.items()}
    ids = {k: u.id for k, u in users.items()}
    ctx = {"tokens": tokens, "ids": ids, "dept": dept.id, "req": req.id, "job": job.id, "draft_job": draft_job.id}
    db.close()
    yield ctx
    Base.metadata.drop_all(bind=engine)


def H(ctx, who):
    return {"Authorization": f"Bearer {ctx['tokens'][who]}"}


def _apply(ctx, who="cand", email="cand@example.com"):
    resp = client.post("/api/v1/applications", headers=H(ctx, who), json={
        "job_posting_id": ctx["job"], "full_name": "Ứng viên A", "email": email, "phone": "0900000000"})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _assign(ctx, recruiter="rec_a"):
    resp = client.post(f"/api/v1/requisitions/{ctx['req']}/assign-recruiters", headers=H(ctx, "hrm"),
                       json={"recruiter_id": ctx["ids"][recruiter], "assignment_type": "primary"})
    assert resp.status_code == 200, resp.text


# ---------------------------------------------------------------- unauthenticated endpoints
@pytest.mark.parametrize("path", ["/api/v1/interviews", "/api/v1/analytics/overview"])
def test_previously_public_endpoints_now_require_authentication(path):
    assert client.get(path).status_code == 401


def test_analytics_has_no_fabricated_values_on_empty_pipeline(world):
    data = client.get("/api/v1/analytics/overview", headers=H(world, "hrm")).json()
    assert data["kpis"]["total_applications"] == 0
    assert data["kpis"]["hired_count"] == 0
    assert data["kpis"]["new_candidates_this_week"] == 0
    assert data["overdue_requisitions"] == []
    assert all(v == 0 for v in data["application_pipeline"].values())


def test_analytics_forbidden_for_employee(world):
    assert client.get("/api/v1/analytics/overview", headers=H(world, "emp")).status_code == 403


# ---------------------------------------------------------------- applications scope
def test_employee_only_sees_own_applications(world):
    own = _apply(world, "cand", "cand@example.com")
    other = _apply(world, "emp", "emp@example.com")
    listed = {a["id"] for a in client.get("/api/v1/applications", headers=H(world, "cand")).json()}
    assert listed == {own}
    assert client.get(f"/api/v1/applications/{other}", headers=H(world, "cand")).status_code == 403


def test_recruiter_scope_follows_assignment(world):
    app_id = _apply(world)
    assert client.get(f"/api/v1/applications/{app_id}", headers=H(world, "rec_a")).status_code == 403
    _assign(world, "rec_a")
    assert client.get(f"/api/v1/applications/{app_id}", headers=H(world, "rec_a")).status_code == 200
    assert client.get(f"/api/v1/applications/{app_id}", headers=H(world, "rec_b")).status_code == 403
    resp = client.put(f"/api/v1/applications/{app_id}/status", headers=H(world, "rec_b"), json={"status": "screening"})
    assert resp.status_code == 403


def test_duplicate_application_rejected_and_count_persisted(world):
    _apply(world)
    resp = client.post("/api/v1/applications", json={
        "job_posting_id": world["job"], "full_name": "x", "email": "CAND@example.com", "phone": "1"})
    assert resp.status_code == 409
    db = TestingSessionLocal()
    assert db.query(JobApplication).count() == 1
    assert db.query(JobPosting).get(world["job"]).applications_count == 1
    db.close()


def test_cannot_apply_to_unpublished_job(world):
    resp = client.post("/api/v1/applications", json={
        "job_posting_id": world["draft_job"], "full_name": "x", "email": "x@example.com", "phone": "1"})
    assert resp.status_code == 404


def test_rejection_requires_reason(world):
    app_id = _apply(world)
    resp = client.put(f"/api/v1/applications/{app_id}/status", headers=H(world, "hrm"), json={"status": "rejected"})
    assert resp.status_code == 422


# ---------------------------------------------------------------- jobs
def test_public_portal_hides_unpublished_postings(world):
    slugs = {j["slug"] for j in client.get("/api/v1/jobs").json()}
    assert "secret-draft" not in slugs
    assert client.get(f"/api/v1/jobs/{world['draft_job']}").status_code == 404
    assert client.get(f"/api/v1/jobs/{world['draft_job']}", headers=H(world, "rec_a")).status_code == 200


def test_recruiter_cannot_publish_directly_and_hr_publish_is_recorded(world):
    resp = client.post("/api/v1/jobs", headers=H(world, "rec_a"), json={
        "title": "Data", "requisition_id": world["req"], "department_id": world["dept"],
        "department_name": "Công nghệ", "description": "d", "status": "published"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending_review"
    job_id = resp.json()["id"]
    assert client.post(f"/api/v1/jobs/{job_id}/publish", headers=H(world, "rec_a")).status_code == 403
    pub = client.post(f"/api/v1/jobs/{job_id}/publish", headers=H(world, "hrm"))
    assert pub.status_code == 200
    db = TestingSessionLocal()
    job = db.query(JobPosting).get(job_id)
    assert job.status == "published" and job.published_by_id == world["ids"]["hrm"] and job.published_at is not None
    db.close()


# ---------------------------------------------------------------- requisitions
def test_requisition_assignment_requires_hr_manager(world):
    resp = client.post(f"/api/v1/requisitions/{world['req']}/assign-recruiters", headers=H(world, "emp"),
                       json={"recruiter_id": world["ids"]["rec_a"]})
    assert resp.status_code == 403
    resp = client.post(f"/api/v1/requisitions/{world['req']}/assign-recruiters", headers=H(world, "hrm"),
                       json={"recruiter_id": world["ids"]["emp"]})
    assert resp.status_code == 422  # not a recruiter


def test_employee_cannot_create_or_see_requisitions(world):
    resp = client.post("/api/v1/requisitions", headers=H(world, "emp"), json={"title": "x", "department_id": world["dept"]})
    assert resp.status_code == 403
    assert client.get("/api/v1/requisitions", headers=H(world, "emp")).json() == []
    assert client.get(f"/api/v1/requisitions/{world['req']}", headers=H(world, "emp")).status_code == 403


def test_requisition_draft_request_changes_and_resubmit(world):
    future = (date.today() + timedelta(days=30)).isoformat()
    resp = client.post("/api/v1/requisitions", headers=H(world, "hm_a"), json={
        "title": "QA", "department_id": world["dept"], "target_onboard_date": future, "save_as_draft": True})
    assert resp.status_code == 201 and resp.json()["status"] == "draft"
    rid = resp.json()["id"]
    assert client.post(f"/api/v1/requisitions/{rid}/submit", headers=H(world, "hm_a")).json()["status"] == "pending_manager"
    no_comment = client.post(f"/api/v1/requisitions/{rid}/approve", headers=H(world, "approver"), json={"action": "changes_requested"})
    assert no_comment.status_code == 422
    back = client.post(f"/api/v1/requisitions/{rid}/approve", headers=H(world, "approver"),
                       json={"action": "changes_requested", "comment": "Bổ sung JD"})
    assert back.status_code == 200 and back.json()["status"] == "changes_requested"
    assert client.post(f"/api/v1/requisitions/{rid}/submit", headers=H(world, "hm_a")).json()["status"] == "pending_manager"
    logs = client.get(f"/api/v1/requisitions/{rid}", headers=H(world, "hm_a")).json()["approval_logs"]
    assert [l["action"] for l in logs] == ["submitted", "changes_requested", "submitted"]


def test_requisition_validation_rejects_past_date_and_inverted_salary(world):
    past = (date.today() - timedelta(days=1)).isoformat()
    r1 = client.post("/api/v1/requisitions", headers=H(world, "hm_a"), json={"title": "x", "department_id": world["dept"], "target_onboard_date": past})
    r2 = client.post("/api/v1/requisitions", headers=H(world, "hm_a"), json={"title": "x", "department_id": world["dept"], "min_salary": 9, "max_salary": 1})
    assert r1.status_code == 422 and r2.status_code == 422


def test_close_requisition_unpublishes_postings(world):
    resp = client.post(f"/api/v1/requisitions/{world['req']}/close", headers=H(world, "hrm"), json={"status": "filled", "reason": "Đủ người"})
    assert resp.status_code == 200 and resp.json()["status"] == "filled"
    db = TestingSessionLocal()
    assert db.query(JobPosting).get(world["job"]).status == "closed"
    db.close()


# ---------------------------------------------------------------- interviews & evaluations
def _schedule(world, app_id, interviewer="int_a", hours=24):
    when = (datetime.now() + timedelta(hours=hours)).replace(microsecond=0).isoformat()
    return client.post("/api/v1/interviews", headers=H(world, "hrm"), json={
        "application_id": app_id, "scheduled_time": when, "duration_minutes": 60, "interviewer_ids": [world["ids"][interviewer]]})


def test_interview_conflict_and_past_time_blocked(world):
    app_id = _apply(world)
    assert _schedule(world, app_id).status_code == 201
    assert _schedule(world, app_id).status_code == 409
    assert _schedule(world, app_id, hours=-2).status_code == 422
    resp = client.post("/api/v1/interviews", headers=H(world, "hrm"), json={
        "application_id": app_id, "scheduled_time": "not-a-date", "interviewer_ids": [world["ids"]["int_a"]]})
    assert resp.status_code == 422


def test_interviewer_scope_feedback_and_evaluation(world):
    app_id = _apply(world)
    interview_id = _schedule(world, app_id, "int_a").json()["id"]
    assert [i["id"] for i in client.get("/api/v1/interviews", headers=H(world, "int_b")).json()] == []
    assert [i["id"] for i in client.get("/api/v1/interviews", headers=H(world, "int_a")).json()] == [interview_id]
    fb = client.put(f"/api/v1/interviews/{interview_id}/feedback", headers=H(world, "int_b"), json={"status": "completed"})
    assert fb.status_code == 403

    payload = {"application_id": app_id, "technical_score": 8, "culture_fit_score": 7, "communication_score": 9,
               "overall_score": 8, "recommendation": "hire"}
    assert client.post("/api/v1/referrals/evaluations", headers=H(world, "int_b"), json=payload).status_code == 403
    assert client.post("/api/v1/referrals/evaluations", headers=H(world, "int_a"), json=payload).status_code == 201
    assert client.post("/api/v1/referrals/evaluations", headers=H(world, "int_a"), json=payload).status_code == 409
    db = TestingSessionLocal()
    assert db.query(CandidateEvaluation).filter_by(application_id=app_id).count() == 1
    db.close()


# ---------------------------------------------------------------- offers
def _offer(world, app_id, salary=25_000_000, who="hrm", **extra):
    start = (date.today() + timedelta(days=20)).isoformat()
    return client.post("/api/v1/offers", headers=H(world, who), json={
        "application_id": app_id, "offered_salary": salary, "start_date": start, **extra})


def test_offer_cannot_be_created_or_accepted_by_unrelated_users(world):
    app_id = _apply(world, "emp", "emp@example.com")
    assert _offer(world, app_id, who="cand").status_code == 403
    offer_id = _offer(world, app_id).json()["id"]
    assert client.get("/api/v1/offers", headers=H(world, "cand")).json() == []
    assert client.get(f"/api/v1/offers/{offer_id}", headers=H(world, "cand")).status_code == 403
    assert client.put(f"/api/v1/offers/{offer_id}/status", headers=H(world, "cand"), json={"status": "accepted"}).status_code in (403, 409)
    db = TestingSessionLocal()
    assert db.query(JobOffer).get(offer_id).status == "pending_approval"
    assert db.query(JobApplication).get(app_id).status != "hired"
    db.close()


def test_over_band_offer_requires_justification_and_escalates_to_approver(world):
    app_id = _apply(world)
    _assign(world, "rec_a")
    assert _offer(world, app_id, salary=40_000_000, who="rec_a").status_code == 422
    resp = _offer(world, app_id, salary=40_000_000, who="rec_a", salary_justification="Ứng viên hiếm")
    assert resp.status_code == 201 and resp.json()["requires_escalation"] is True
    oid = resp.json()["id"]
    assert client.post(f"/api/v1/offers/{oid}/decision", headers=H(world, "approver"), json={"action": "approved"}).status_code == 403
    step1 = client.post(f"/api/v1/offers/{oid}/decision", headers=H(world, "hrm"), json={"action": "approved"})
    assert step1.json()["status"] == "pending_approval" and step1.json()["approval_level"] == "approver"
    step2 = client.post(f"/api/v1/offers/{oid}/decision", headers=H(world, "approver"), json={"action": "approved"})
    assert step2.status_code == 200 and step2.json()["status"] == "approved"
    assert [l["action"] for l in step2.json()["approval_logs"]] == ["submitted", "approved", "approved"]


# ---------------------------------------------------------------- candidate privacy / conflict of interest
def test_candidate_never_sees_panel_feedback_or_evaluations(world):
    app_id = _apply(world)
    interview_id = _schedule(world, app_id, "int_a").json()["id"]
    fb = client.put(f"/api/v1/interviews/{interview_id}/feedback", headers=H(world, "int_a"),
                    json={"status": "completed", "feedback_notes": "Nội bộ: yếu thuật toán", "score": 4})
    assert fb.status_code == 200, fb.text
    payload = {"application_id": app_id, "technical_score": 4, "culture_fit_score": 6, "communication_score": 6,
               "overall_score": 5, "recommendation": "reject"}
    assert client.post("/api/v1/referrals/evaluations", headers=H(world, "int_a"), json=payload).status_code == 201

    mine = client.get("/api/v1/interviews", headers=H(world, "cand")).json()
    assert [i["id"] for i in mine] == [interview_id]
    assert not {"feedback_notes", "score", "passed", "interviewers", "cv_url"} & set(mine[0])
    assert client.get(f"/api/v1/referrals/evaluations?application_id={app_id}", headers=H(world, "cand")).json() == []


def test_staff_cannot_manage_or_inspect_their_own_application(world):
    _assign(world, "rec_a")
    own_id = _apply(world, who="rec_a", email="reca@example.com")
    detail = client.get(f"/api/v1/applications/{own_id}", headers=H(world, "rec_a")).json()
    assert "logs" not in detail and "offer" not in detail
    listed = {a["id"]: a for a in client.get("/api/v1/applications", headers=H(world, "rec_a")).json()}
    assert "hr_notes" not in listed[own_id]
    move = client.put(f"/api/v1/applications/{own_id}/status", headers=H(world, "rec_a"), json={"status": "screening"})
    assert move.status_code == 403
    # HR still manages it normally.
    assert client.put(f"/api/v1/applications/{own_id}/status", headers=H(world, "hrm"),
                      json={"status": "screening"}).status_code == 200


def test_requisition_list_shows_assigned_recruiters(world):
    _assign(world, "rec_a")
    rows = {r["id"]: r for r in client.get("/api/v1/requisitions", headers=H(world, "hrm")).json()}
    assert rows[world["req"]]["recruiters"] == [
        {"recruiter_id": world["ids"]["rec_a"], "full_name": "reca", "assignment_type": "primary"}]


def test_public_posting_reports_real_openings_from_requisition(world):
    job = next(j for j in client.get("/api/v1/jobs").json() if j["id"] == world["job"])
    assert job["openings"] == 1 and job["is_expired"] is False
