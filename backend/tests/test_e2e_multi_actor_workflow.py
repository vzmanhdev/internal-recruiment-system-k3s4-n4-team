"""Phase 11 end-to-end workflows with distinct real accounts, the production RBAC matrix and DB assertions.

Workflow A: admin creates user -> assigns roles -> user logs in -> effective permissions -> role removal revokes access.
Workflow B: HM drafts & submits requisition -> approver -> HR approves -> HR assigns recruiter -> recruiter drafts
            posting -> HR publishes -> public portal shows it.
Workflow C: candidate applies -> recruiter screens -> interview -> interviewer evaluation -> offer -> HR approval ->
            send -> candidate accepts -> onboarding checklist -> onboarded.
Workflow D: notifications + audit rows are produced for the business events above.
"""
from datetime import date, datetime, timedelta

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
from app.models.hr import Department, RecruiterAssignment
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.offer_onboarding import JobOffer, OfferApprovalLog, OnboardingChecklist
from app.models.referral_eval import CandidateEvaluation
from app.models.notification import Notification
from app.core.security import hash_password

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
def seeded():
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
    admin = User(email="admin@example.com", full_name="Admin", hashed_password=hash_password("Password123"), role="admin",
                 is_active=True, account_status="active", security_version=1)
    db.add(admin)
    db.flush()
    db.add(UserRole(user_id=admin.id, role_id=roles["admin"].id))
    db.add(Department(code="ENG", name="Khối Kỹ thuật"))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def login(email: str) -> dict:
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def create_user(admin_h, email, roles):
    resp = client.post("/api/v1/admin/users", headers=admin_h, json={
        "full_name": email.split("@")[0], "email": email, "password": "Password123", "roles": roles})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def db_one(model, **filters):
    db = TestingSessionLocal()
    try:
        return db.query(model).filter_by(**filters).one()
    finally:
        db.close()


def test_workflows_a_b_c_d_across_real_role_accounts():
    admin_h = login("admin@example.com")

    # ---------------- Workflow A: user administration + multi-role RBAC
    ids = {
        "hm": create_user(admin_h, "hm@example.com", ["hiring_manager", "interviewer"]),
        "approver": create_user(admin_h, "approver@example.com", ["approver"]),
        "hrm": create_user(admin_h, "hrm@example.com", ["hr_manager"]),
        "rec": create_user(admin_h, "rec@example.com", ["recruiter"]),
        "int": create_user(admin_h, "int@example.com", ["interviewer"]),
        "cand": create_user(admin_h, "cand@example.com", ["employee"]),
    }
    db = TestingSessionLocal()
    assert db.query(UserRole).filter(UserRole.user_id == ids["hm"]).count() == 2  # normalized rows, not only legacy string
    db.close()
    hm_h, appr_h, hrm_h, rec_h, int_h, cand_h = (login(f"{k}@example.com") for k in ["hm", "approver", "hrm", "rec", "int", "cand"])
    me = client.get("/api/v1/auth/me", headers=hm_h).json()
    assert {"requisition:create", "interview:evaluate"} <= set(me["permissions"])  # UNION of both roles
    assert client.get("/api/v1/admin/users", headers=hm_h).status_code == 403

    # ---------------- Workflow B: requisition -> approvals -> recruiter -> posting -> publication
    target = (date.today() + timedelta(days=45)).isoformat()
    dept_id = client.get("/api/v1/hr/departments", headers=hrm_h).json()[0]["id"]
    draft = client.post("/api/v1/requisitions", headers=hm_h, json={
        "title": "Kỹ sư Backend", "department_id": dept_id, "quantity": 1, "min_salary": 20_000_000, "max_salary": 30_000_000,
        "target_onboard_date": target, "job_description": "Phát triển API", "requirements": "Python", "save_as_draft": True})
    assert draft.status_code == 201 and draft.json()["status"] == "draft"
    req_id = draft.json()["id"]
    assert client.post(f"/api/v1/requisitions/{req_id}/submit", headers=hm_h).json()["status"] == "pending_manager"
    assert client.post(f"/api/v1/requisitions/{req_id}/approve", headers=appr_h, json={"action": "approved"}).json()["status"] == "pending_hr"
    assert client.post(f"/api/v1/requisitions/{req_id}/approve", headers=hrm_h, json={"action": "approved"}).json()["status"] == "approved"
    assert client.post(f"/api/v1/requisitions/{req_id}/assign-recruiters", headers=hrm_h,
                       json={"recruiter_id": ids["rec"], "assignment_type": "primary"}).status_code == 200
    assert db_one(JobRequisition, id=req_id).status == "approved"
    assert db_one(RecruiterAssignment, requisition_id=req_id).recruiter_id == ids["rec"]

    posting = client.post("/api/v1/jobs", headers=rec_h, json={
        "title": "Kỹ sư Backend Python", "requisition_id": req_id, "department_id": dept_id, "department_name": "Khối Kỹ thuật",
        "description": "Phát triển API", "status": "published"})
    assert posting.status_code == 201 and posting.json()["status"] == "pending_review"
    job_id = posting.json()["id"]
    assert job_id not in [j["id"] for j in client.get("/api/v1/jobs").json()]
    assert client.post(f"/api/v1/jobs/{job_id}/publish", headers=hrm_h).status_code == 200
    assert job_id in [j["id"] for j in client.get("/api/v1/jobs").json()]
    assert db_one(JobPosting, id=job_id).published_by_id == ids["hrm"]

    # ---------------- Workflow C: candidate pipeline -> interview -> evaluation -> offer -> onboarding
    applied = client.post("/api/v1/applications", headers=cand_h, json={
        "job_posting_id": job_id, "full_name": "Ứng viên Cand", "email": "cand@example.com", "phone": "0900000001"})
    assert applied.status_code == 201
    app_id = applied.json()["id"]
    assert db_one(JobApplication, id=app_id).candidate_id == ids["cand"]
    assert client.put(f"/api/v1/applications/{app_id}/status", headers=rec_h, json={"status": "screening"}).status_code == 200

    when = (datetime.now() + timedelta(days=2)).replace(microsecond=0).isoformat()
    interview = client.post("/api/v1/interviews", headers=rec_h, json={
        "application_id": app_id, "scheduled_time": when, "duration_minutes": 60, "interviewer_ids": [ids["int"], ids["hm"]]})
    assert interview.status_code == 201, interview.text
    assert db_one(JobApplication, id=app_id).status == "interviewing"

    evaluation = {"application_id": app_id, "technical_score": 9, "culture_fit_score": 8, "communication_score": 8,
                  "overall_score": 9, "recommendation": "hire"}
    assert client.get(f"/api/v1/referrals/evaluations?application_id={app_id}", headers=int_h).json() == []
    assert client.post("/api/v1/referrals/evaluations", headers=int_h, json=evaluation).status_code == 201
    assert len(client.get(f"/api/v1/referrals/evaluations?application_id={app_id}", headers=hm_h).json()) == 1

    start = (date.today() + timedelta(days=30)).isoformat()
    offer = client.post("/api/v1/offers", headers=rec_h, json={"application_id": app_id, "offered_salary": 28_000_000, "start_date": start})
    assert offer.status_code == 201 and offer.json()["status"] == "pending_approval" and offer.json()["requires_escalation"] is False
    offer_id = offer.json()["id"]
    assert client.post(f"/api/v1/offers/{offer_id}/decision", headers=hrm_h, json={"action": "approved"}).json()["status"] == "approved"
    assert client.post(f"/api/v1/offers/{offer_id}/send", headers=rec_h).json()["status"] == "sent"
    accepted = client.post(f"/api/v1/offers/{offer_id}/respond", headers=cand_h, json={"decision": "accepted"})
    assert accepted.status_code == 200 and accepted.json()["status"] == "accepted"
    assert db_one(JobApplication, id=app_id).status == "hired"

    items = accepted.json()["onboarding"]
    assert len(items) == 5
    last = None
    for item in items:
        last = client.put(f"/api/v1/offers/{offer_id}/onboarding/{item['id']}", headers=hrm_h, json={"is_completed": True})
        assert last.status_code == 200
    assert last.json()["onboarding_progress"] == 100
    assert db_one(JobApplication, id=app_id).status == "onboarded"

    # ---------------- persisted history + Workflow D (notifications / audit)
    db = TestingSessionLocal()
    try:
        assert [l.action for l in db.query(RequisitionApprovalLog).filter_by(requisition_id=req_id).order_by(RequisitionApprovalLog.id)] == [
            "submitted", "approved", "approved", "recruiter_assigned"]
        assert [l.to_status for l in db.query(ApplicationLog).filter_by(application_id=app_id).order_by(ApplicationLog.id)] == [
            "screening", "interviewing", "offered", "hired", "onboarded"]
        assert [l.action for l in db.query(OfferApprovalLog).filter_by(offer_id=offer_id).order_by(OfferApprovalLog.id)] == [
            "submitted", "approved", "sent", "accepted"]
        assert db.query(OnboardingChecklist).filter_by(offer_id=offer_id, is_completed=True).count() == 5
        assert db.query(CandidateEvaluation).filter_by(application_id=app_id).count() == 1

        notif = {(n.recipient_id, n.type) for n in db.query(Notification).all()}
        assert (ids["approver"], "approval_pending") in notif      # requisition waiting for approver
        assert (ids["hrm"], "approval_pending") in notif           # step 2 + offer approval
        assert (ids["hm"], "requisition_decision") in notif        # creator informed of decisions
        assert (ids["rec"], "recruiter_assigned") in notif
        assert (ids["int"], "interview_invited") in notif and (ids["hm"], "interview_invited") in notif
        assert (ids["rec"], "offer_response") in notif
        assert all(rid != ids["cand"] for rid, t in notif if t == "approval_pending")  # no leakage to unrelated users

        actions = {a.action for a in db.query(AuditLog).all()}
        assert {"LOGIN_SUCCESS", "CREATE_USER", "REQUISITION_SUBMIT", "REQUISITION_DECISION",
                "REQUISITION_ASSIGN_RECRUITER", "OFFER_DECISION", "OFFER_ACCEPTED"} <= actions
    finally:
        db.close()

    # ---------------- Workflow A (cont.): removing a role revokes access on the next request
    assert client.put(f"/api/v1/admin/users/{ids['hm']}/roles", headers=admin_h, json={"roles": ["interviewer"]}).status_code == 200
    resp = client.post("/api/v1/requisitions", headers=hm_h, json={"title": "x", "department_id": dept_id})
    assert resp.status_code == 403
