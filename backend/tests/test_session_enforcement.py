"""Regression tests: every protected endpoint must validate the server-side session.

Covers audit findings on the legacy ``require_admin`` / ``require_roles`` helpers (admin.py, hr.py,
legacy /auth/users routes) that only verified the JWT signature, and on access tokens without a
``sid`` claim bypassing session validation in ``get_current_session_user``.
"""
from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

import app.models  # noqa: F401  register models
from app.main import app
from app.db.session import Base
from app.models.user import User
from app.models.auth_session import AuthSession
from app.core.security import hash_password, create_access_token

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
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _create_user(email: str, role: str) -> int:
    db = TestingSessionLocal()
    user = User(email=email, hashed_password=hash_password("Password123"), full_name=email,
                role=role, is_active=True, account_status="active", security_version=1)
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()
    return user_id


def _login(email: str) -> str:
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


PROTECTED_LEGACY_ENDPOINTS = [
    ("admin@example.com", "admin", "/api/v1/admin/users"),
    ("admin@example.com", "admin", "/api/v1/auth/users"),
    ("hrm@example.com", "hr_manager", "/api/v1/hr/departments"),
]


@pytest.mark.parametrize("email,role,path", PROTECTED_LEGACY_ENDPOINTS)
def test_logged_out_session_rejected_on_legacy_guarded_endpoints(email, role, path):
    _create_user(email, role)
    token = _login(email)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get(path, headers=headers).status_code == 200

    assert client.post("/api/v1/auth/logout", headers=headers).status_code == 200

    resp = client.get(path, headers=headers)
    assert resp.status_code == 401, resp.text


@pytest.mark.parametrize("email,role,path", PROTECTED_LEGACY_ENDPOINTS)
def test_admin_revoked_session_rejected_on_legacy_guarded_endpoints(email, role, path):
    user_id = _create_user(email, role)
    token = _login(email)

    db = TestingSessionLocal()
    db.query(AuthSession).filter(AuthSession.user_id == user_id).update({"revoked_at": datetime.utcnow()})
    db.commit()
    db.close()

    resp = client.get(path, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401, resp.text


@pytest.mark.parametrize("path", ["/api/v1/auth/me", "/api/v1/admin/users", "/api/v1/hr/departments"])
def test_access_token_without_session_id_rejected(path):
    user_id = _create_user("nosid@example.com", "admin")
    token = create_access_token(subject=user_id, session_id=None, security_version=1)
    resp = client.get(path, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401, resp.text


def test_permission_failure_is_403_not_401():
    _create_user("emp@example.com", "employee")
    token = _login("emp@example.com")
    resp = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403, resp.text


def test_admin_lock_revokes_sessions_and_unlock_does_not_revive_them():
    _create_user("admin@example.com", "admin")
    target_id = _create_user("victim@example.com", "employee")
    admin_headers = {"Authorization": f"Bearer {_login('admin@example.com')}"}
    victim_token = _login("victim@example.com")
    victim_headers = {"Authorization": f"Bearer {victim_token}"}
    assert client.get("/api/v1/auth/me", headers=victim_headers).status_code == 200

    lock = client.post(f"/api/v1/admin/users/{target_id}/lock", headers=admin_headers, json={"reason": "Vi phạm chính sách"})
    assert lock.status_code == 200, lock.text
    db = TestingSessionLocal()
    sessions = db.query(AuthSession).filter(AuthSession.user_id == target_id).all()
    assert sessions and all(s.revoked_at is not None for s in sessions)
    db.close()

    assert client.post(f"/api/v1/admin/users/{target_id}/unlock", headers=admin_headers).status_code == 200
    assert client.get("/api/v1/auth/me", headers=victim_headers).status_code == 401


def test_admin_password_reset_revokes_existing_sessions():
    _create_user("admin@example.com", "admin")
    target_id = _create_user("victim@example.com", "employee")
    admin_headers = {"Authorization": f"Bearer {_login('admin@example.com')}"}
    victim_headers = {"Authorization": f"Bearer {_login('victim@example.com')}"}
    resp = client.post(f"/api/v1/admin/users/{target_id}/reset-password", headers=admin_headers, json={})
    assert resp.status_code == 200, resp.text
    assert client.get("/api/v1/auth/me", headers=victim_headers).status_code == 401


def test_role_update_is_validated_and_effective_on_next_request():
    _create_user("admin@example.com", "admin")
    target_id = _create_user("worker@example.com", "employee")
    admin_headers = {"Authorization": f"Bearer {_login('admin@example.com')}"}
    worker_headers = {"Authorization": f"Bearer {_login('worker@example.com')}"}
    assert client.get("/api/v1/hr/headcounts", headers=worker_headers).status_code == 403

    ok = client.put(f"/api/v1/admin/users/{target_id}/roles", headers=admin_headers, json={"roles": ["employee", "hr_manager"]})
    assert ok.status_code == 200, ok.text
    assert client.get("/api/v1/hr/headcounts", headers=worker_headers).status_code == 200

    client.put(f"/api/v1/admin/users/{target_id}/roles", headers=admin_headers, json={"roles": ["employee"]})
    assert client.get("/api/v1/hr/headcounts", headers=worker_headers).status_code == 403


def test_cors_rejects_untrusted_origin_and_allows_frontend():
    evil = client.options("/api/v1/auth/login", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
    assert evil.headers.get("access-control-allow-origin") is None
    ok = client.options("/api/v1/auth/login", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_unhandled_errors_do_not_leak_exception_text():
    from fastapi.testclient import TestClient as _TC

    @app.get("/__boom_for_test")
    def _boom():
        raise RuntimeError("secret-internal-detail /etc/passwd")

    resp = _TC(app, raise_server_exceptions=False).get("/__boom_for_test")
    assert resp.status_code == 500
    assert "secret-internal-detail" not in resp.text
    body = resp.json()
    assert body["error"]["code"] == "INTERNAL_ERROR" and body["request_id"]


def test_error_envelope_keeps_detail_and_adds_code():
    resp = client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "NOT_FOUND" and body["detail"] and resp.headers.get("X-Request-ID")


def test_lock_handover_warning_and_role_filter_uses_user_roles():
    from app.models.hr import Department
    from app.models.requisition import JobRequisition
    _create_user("admin@example.com", "admin")
    hm_id = _create_user("owner@example.com", "hiring_manager")
    admin_headers = {"Authorization": f"Bearer {_login('admin@example.com')}"}
    _login("owner@example.com")  # links legacy role into user_roles via first read
    db = TestingSessionLocal()
    dept = Department(code="D1", name="IT"); db.add(dept); db.commit()
    db.add(JobRequisition(code="REQ-H-1", title="Dev", department_id=dept.id, status="approved", current_approval_step="completed", created_by_id=hm_id))
    db.commit(); db.close()
    check = client.get(f"/api/v1/admin/users/{hm_id}/handover-check", headers=admin_headers).json()
    assert check["needs_handover"] is True and check["positions"][0]["code"] == "REQ-H-1"
    listed = client.get("/api/v1/admin/users?role=hiring_manager", headers=admin_headers).json()["items"]
    assert [u["email"] for u in listed] == ["owner@example.com"]
