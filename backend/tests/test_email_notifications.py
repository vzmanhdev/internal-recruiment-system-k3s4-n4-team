"""Email delivery status must reflect the real outcome; notifications are persisted, private and preference-aware."""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.main import app
from app.db.session import Base
from app.core.config import settings
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission
from app.models.hr import Department
from app.models.requisition import JobRequisition
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.email_automation import EmailLog
from app.models.notification import Notification
from app.core.security import hash_password
from app.services import email_service
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
    roles = {}
    for code in ["admin", "hr_manager", "recruiter", "interviewer", "employee"]:
        roles[code] = Role(code=code, name=code)
        db.add(roles[code])
    db.add(Permission(code="interview:schedule", name="Lên lịch phỏng vấn", module="Phỏng Vấn"))
    db.add(RolePermission(role_code="hr_manager", permission_code="interview:schedule", is_granted=True))
    db.commit()

    def mk(email, code):
        u = User(email=email, full_name=email.split("@")[0], hashed_password=hash_password("Password123"), role=code,
                 is_active=True, account_status="active", security_version=1)
        db.add(u)
        db.flush()
        db.add(UserRole(user_id=u.id, role_id=roles[code].id))
        db.commit()
        return u

    users = {k: mk(f"{k}@example.com", r) for k, r in
             [("hrm", "hr_manager"), ("int_a", "interviewer"), ("int_b", "interviewer"), ("emp", "employee")]}
    dept = Department(code="IT", name="IT")
    db.add(dept)
    db.commit()
    req = JobRequisition(code="REQ-E-1", title="Dev", department_id=dept.id, status="approved", current_approval_step="completed",
                         created_by_id=users["hrm"].id)
    db.add(req)
    db.commit()
    job = JobPosting(slug="dev", title="Dev", requisition_id=req.id, department_id=dept.id, department_name="IT", description="d",
                     status="published", created_by_id=users["hrm"].id)
    db.add(job)
    db.commit()
    application = JobApplication(job_posting_id=job.id, full_name="Ứng viên B", email="b@example.com", phone="1", status="submitted")
    db.add(application)
    db.commit()
    out = {"tokens": {k: session_token(db, u) for k, u in users.items()}, "ids": {k: u.id for k, u in users.items()}, "app": application.id}
    db.close()
    yield out
    Base.metadata.drop_all(bind=engine)


def H(ctx, who):
    return {"Authorization": f"Bearer {ctx['tokens'][who]}"}


@pytest.mark.parametrize("method,path", [
    ("get", "/api/v1/email-automation/templates"),
    ("get", "/api/v1/email-automation/logs"),
    ("post", "/api/v1/email-automation/logs/1/retry"),
    ("delete", "/api/v1/email-automation/templates/1"),
])
def test_email_automation_requires_authentication_and_role(ctx, method, path):
    assert getattr(client, method)(path).status_code == 401
    assert getattr(client, method)(path, headers=H(ctx, "emp")).status_code == 403


def test_email_logs_are_not_seeded_with_fake_rows(ctx):
    assert client.get("/api/v1/email-automation/logs", headers=H(ctx, "hrm")).json() == []


def _queued_log(db, body="<p>x</p>"):
    log = EmailLog(recipient_name="B", recipient_email="b@example.com", subject="s", body_html=body, status="queued")
    db.add(log)
    db.commit()
    return log.id


def test_delivery_without_smtp_is_skipped_not_sent(ctx, monkeypatch):
    monkeypatch.setattr(settings, "SMTP_USERNAME", "")
    db = TestingSessionLocal()
    log_id = _queued_log(db)
    assert email_service.deliver_email_log(log_id, "<p>x</p>", db=db) == "skipped"
    db.close()
    db = TestingSessionLocal()
    assert db.query(EmailLog).get(log_id).status == "skipped"
    db.close()


def test_delivery_failure_is_recorded_and_retry_reports_real_outcome(ctx, monkeypatch):
    monkeypatch.setattr(settings, "SMTP_HOST", "127.0.0.1")
    monkeypatch.setattr(settings, "SMTP_PORT", 1)
    monkeypatch.setattr(settings, "SMTP_USERNAME", "sender@example.com")
    monkeypatch.setattr(settings, "SMTP_APP_PASSWORD", "not-a-real-password")
    db = TestingSessionLocal()
    log_id = _queued_log(db)
    assert email_service.deliver_email_log(log_id, "<p>x</p>", db=db) == "failed"
    db.close()

    resp = client.post(f"/api/v1/email-automation/logs/{log_id}/retry", headers=H(ctx, "hrm"))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "failed" and resp.json()["attempts"] == 2
    client.post(f"/api/v1/email-automation/logs/{log_id}/retry", headers=H(ctx, "hrm"))
    assert client.post(f"/api/v1/email-automation/logs/{log_id}/retry", headers=H(ctx, "hrm")).status_code == 409  # bounded


def test_sensitive_email_body_not_stored_and_not_retryable(ctx):
    db = TestingSessionLocal()
    log_id = _queued_log(db, body=email_service.SENSITIVE_BODY_PLACEHOLDER)
    db.query(EmailLog).filter(EmailLog.id == log_id).update({"status": "failed"})
    db.commit()
    db.close()
    assert client.post(f"/api/v1/email-automation/logs/{log_id}/retry", headers=H(ctx, "hrm")).status_code == 409


def test_otp_is_never_printed_outside_development(ctx, capsys, monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "test")
    monkeypatch.setattr(email_service, "send_smtp_email", lambda *a, **k: None)
    email_service.send_otp_email("someone@example.com", "987654")
    assert "987654" not in capsys.readouterr().out


def test_interview_invitation_creates_private_persistent_notification(ctx):
    when = (datetime.now() + timedelta(days=2)).replace(microsecond=0).isoformat()
    resp = client.post("/api/v1/interviews", headers=H(ctx, "hrm"), json={
        "application_id": ctx["app"], "scheduled_time": when, "interviewer_ids": [ctx["ids"]["int_a"]]})
    assert resp.status_code == 201, resp.text

    mine = client.get("/api/v1/notifications", headers=H(ctx, "int_a")).json()
    assert mine["unread_count"] == 1 and mine["items"][0]["type"] == "interview_invited"
    assert client.get("/api/v1/notifications", headers=H(ctx, "int_b")).json()["items"] == []

    nid = mine["items"][0]["id"]
    assert client.post(f"/api/v1/notifications/{nid}/read", headers=H(ctx, "int_b")).status_code == 404
    assert client.post(f"/api/v1/notifications/{nid}/read", headers=H(ctx, "int_a")).json()["is_read"] is True
    db = TestingSessionLocal()
    assert db.query(Notification).get(nid).is_read is True
    db.close()
    assert client.get("/api/v1/notifications/unread-count", headers=H(ctx, "int_a")).json()["unread_count"] == 0


def test_mandatory_notifications_cannot_be_disabled(ctx):
    bad = client.put("/api/v1/notifications/preferences", headers=H(ctx, "emp"),
                     json={"items": [{"type": "interview_invited", "in_app_enabled": False}]})
    assert bad.status_code == 422
    ok = client.put("/api/v1/notifications/preferences", headers=H(ctx, "emp"),
                    json={"items": [{"type": "offer_response", "in_app_enabled": False, "email_enabled": False}]})
    assert ok.status_code == 200
    pref = {p["type"]: p for p in ok.json()}["offer_response"]
    assert pref["in_app_enabled"] is False
