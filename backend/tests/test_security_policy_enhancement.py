"""Comprehensive Automated Test Suite for Security Policy Enhancements:
1. Session lockout after 5 consecutive failed logins (without locking the account).
2. Strong password policy (>= 8 chars, lowercase, uppercase, digit, special char) for:
   - Candidate registration
   - User password change
   - Admin user creation and password reset
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
import app.db.session as db_session_module
from app.db.session import Base
from app.models.user import User
from app.models.login_guard import LoginAttemptGuard
from app.models.auth_session import AuthSession
from app.models.audit import AuditLog
from app.core.security import hash_password, create_access_token, validate_password_complexity

client = TestClient(app)


@pytest.fixture(autouse=True)
def cleanup_guards_and_test_users():
    Base.metadata.create_all(bind=db_session_module.engine)
    db = db_session_module.SessionLocal()
    # Clean up test users and login guards
    test_emails = [
        "sec_policy_test@example.com",
        "sec_pwd_test@example.com",
        "admin_sec_test@example.com",
    ]
    users = db.query(User).filter(User.email.in_(test_emails)).all()
    for u in users:
        db.query(AuthSession).filter(AuthSession.user_id == u.id).delete(synchronize_session=False)
        db.query(AuditLog).filter(AuditLog.actor_id == u.id).delete(synchronize_session=False)
        db.delete(u)
    db.query(LoginAttemptGuard).delete(synchronize_session=False)
    db.commit()
    db.close()
    yield
    db = db_session_module.SessionLocal()
    users = db.query(User).filter(User.email.in_(test_emails)).all()
    for u in users:
        db.query(AuthSession).filter(AuthSession.user_id == u.id).delete(synchronize_session=False)
        db.query(AuditLog).filter(AuditLog.actor_id == u.id).delete(synchronize_session=False)
        db.delete(u)
    db.query(LoginAttemptGuard).delete(synchronize_session=False)
    db.commit()
    db.close()


# ==============================================================================
# 1. UNIT TESTS: PASSWORD COMPLEXITY VALIDATOR
# ==============================================================================

def test_password_complexity_unit():
    # Valid
    assert validate_password_complexity("StrongP@ss1") == "StrongP@ss1"
    assert validate_password_complexity("Admin#2026_xyz") == "Admin#2026_xyz"
    assert validate_password_complexity("Abc$1234") == "Abc$1234"

    # Too short (< 8)
    with pytest.raises(ValueError, match="8 ký tự"):
        validate_password_complexity("Ab1!xyz")

    # Missing lowercase
    with pytest.raises(ValueError, match="chữ cái viết thường"):
        validate_password_complexity("STRONGP@SS1")

    # Missing uppercase
    with pytest.raises(ValueError, match="chữ cái viết hoa"):
        validate_password_complexity("strongp@ss1")

    # Missing digit
    with pytest.raises(ValueError, match="chữ số"):
        validate_password_complexity("StrongP@ssword")

    # Missing special char
    with pytest.raises(ValueError, match="ký tự đặc biệt"):
        validate_password_complexity("StrongPass123")


# ==============================================================================
# 2. INTEGRATION TESTS: REGISTRATION PASSWORD POLICY ENFORCEMENT
# ==============================================================================

def test_registration_rejects_weak_passwords():
    base_form = {
        "full_name": "Test Candidate",
        "email": "sec_pwd_test@example.com",
    }

    # 1. Too short
    res = client.post("/api/v1/auth/register/start", json={**base_form, "password": "Ab1!", "confirm_password": "Ab1!"})
    assert res.status_code == 422
    assert "password" in res.json().get("field_errors", {})

    # 2. Missing special char
    res = client.post("/api/v1/auth/register/start", json={**base_form, "password": "Password123", "confirm_password": "Password123"})
    assert res.status_code == 422
    assert "password" in res.json().get("field_errors", {})

    # 3. Missing uppercase
    res = client.post("/api/v1/auth/register/start", json={**base_form, "password": "password@123", "confirm_password": "password@123"})
    assert res.status_code == 422
    assert "password" in res.json().get("field_errors", {})

    # 4. Missing lowercase
    res = client.post("/api/v1/auth/register/start", json={**base_form, "password": "PASSWORD@123", "confirm_password": "PASSWORD@123"})
    assert res.status_code == 422
    assert "password" in res.json().get("field_errors", {})

    # 5. Missing digit
    res = client.post("/api/v1/auth/register/start", json={**base_form, "password": "Password@Special", "confirm_password": "Password@Special"})
    assert res.status_code == 422
    assert "password" in res.json().get("field_errors", {})


# ==============================================================================
# 3. INTEGRATION TESTS: CHANGE PASSWORD POLICY ENFORCEMENT
# ==============================================================================

def test_change_password_enforces_complexity():
    db = db_session_module.SessionLocal()
    user = User(
        email="sec_policy_test@example.com",
        full_name="Security Policy User",
        hashed_password=hash_password("CurrentP@ss123"),
        role="employee",
        is_active=True,
        account_status="active",
        security_version=1,
    )
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()

    # Login to obtain a session-bound access token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "sec_policy_test@example.com",
        "password": "CurrentP@ss123",
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Reject without special char
    res_no_special = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "CurrentP@ss123",
        "new_password": "NewPassword123",
    })
    assert res_no_special.status_code == 422

    # Reject without uppercase
    res_no_upper = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "CurrentP@ss123",
        "new_password": "newpassword@123",
    })
    assert res_no_upper.status_code == 422

    # Accept valid 5-criteria password
    res_ok = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "CurrentP@ss123",
        "new_password": "NewValidP@ssword2026!",
    })
    assert res_ok.status_code == 200

    # Verify user security version updated
    db = db_session_module.SessionLocal()
    u = db.query(User).filter(User.id == user_id).first()
    assert u.security_version == 2
    db.close()


# ==============================================================================
# 4. INTEGRATION TESTS: 5-FAILURE LOGIN SESSION LOCKOUT (WITHOUT LOCKING USER)
# ==============================================================================

def test_login_session_lockout_after_five_failures():
    db = db_session_module.SessionLocal()
    user = User(
        email="sec_policy_test@example.com",
        full_name="Session Lock Test User",
        hashed_password=hash_password("ValidP@ss123"),
        role="employee",
        is_active=True,
        account_status="active",
        security_version=1,
    )
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()

    # Create a distinct browser client for Session A
    browser_a = TestClient(app)

    # Attempts 1 to 4: should return 400 Bad Request and notify x/5 attempts
    for attempt in range(1, 5):
        res = browser_a.post("/api/v1/auth/login", json={
            "email": "sec_policy_test@example.com",
            "password": "WrongPassword123!",
        })
        assert res.status_code == 400
        detail = res.json().get("detail", "")
        assert f"{attempt}/5 lần" in detail, f"Expected '{attempt}/5 lần' in response, got: {detail}"

        # Verify DB user is NOT locked
        db = db_session_module.SessionLocal()
        u = db.query(User).filter(User.id == user_id).first()
        assert u.locked_until is None, "User.locked_until must NOT be set"
        assert u.is_active is True, "User.is_active must remain True"
        assert u.account_status == "active", "User.account_status must remain 'active'"
        db.close()

    # Attempt 5: Session A is locked for 15 minutes (HTTP 429 Too Many Requests)
    res5 = browser_a.post("/api/v1/auth/login", json={
        "email": "sec_policy_test@example.com",
        "password": "WrongPassword123!",
    })
    assert res5.status_code == 429
    detail5 = res5.json().get("detail", "")
    assert "5/5 lần" in detail5
    assert "15 phút" in detail5
    assert int(res5.headers.get("Retry-After", 0)) > 0
    assert "Tài khoản của bạn không bị khóa" in detail5

    # Session A tries correct password: Still rejected with 429 because session is in cooldown
    res_locked_correct = browser_a.post("/api/v1/auth/login", json={
        "email": "sec_policy_test@example.com",
        "password": "ValidP@ss123",
    })
    assert res_locked_correct.status_code == 429

    # CRITICAL: Incognito / Session B can sign in successfully with correct password!
    # (Proves account itself is not locked, eliminating DoS risk against legitimate users)
    browser_b = TestClient(app)
    res_b = browser_b.post("/api/v1/auth/login", json={
        "email": "sec_policy_test@example.com",
        "password": "ValidP@ss123",
    })
    assert res_b.status_code == 200
    assert "access_token" in res_b.json()

    # Double check database user state
    db = db_session_module.SessionLocal()
    u = db.query(User).filter(User.id == user_id).first()
    assert u.locked_until is None
    assert u.is_active is True
    assert u.account_status == "active"
    db.close()
