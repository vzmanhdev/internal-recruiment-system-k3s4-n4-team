import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.login_guard import LoginAttemptGuard
from app.core.security import hash_password

client = TestClient(app)

def test_attempt_counter_and_session_lock():
    print("==================================================")
    print("TESTING LOGIN ATTEMPT COUNTER (x/5) & SESSION LOCK")
    print("==================================================")

    db = SessionLocal()
    # Clean up any previous test user and guards
    existing_u = db.query(User).filter(User.email == "attempt_test@company.com").first()
    if existing_u:
        from app.models.auth_session import AuthSession
        from app.models.audit import AuditLog
        db.query(AuthSession).filter(AuthSession.user_id == existing_u.id).delete(synchronize_session=False)
        db.query(AuditLog).filter(AuditLog.actor_id == existing_u.id).delete(synchronize_session=False)
        db.delete(existing_u)
    db.query(LoginAttemptGuard).delete(synchronize_session=False)
    db.commit()
    test_user = User(
        email="attempt_test@company.com",
        hashed_password=hash_password("CorrectPassword123!"),
        full_name="Attempt Test User",
        role="employee",
        is_active=True,
        account_status="active",
        security_version=1
    )
    db.add(test_user)
    db.commit()
    user_id = test_user.id
    db.close()

    browser = TestClient(app)

    # Attempts 1 to 4: should return 400 and show x/5
    for attempt in range(1, 5):
        res = browser.post("/api/v1/auth/login", json={"email": "attempt_test@company.com", "password": "WrongPassword"})
        print(f"\n[Attempt {attempt}] Status: {res.status_code}")
        data = res.json()
        print("Detail:", data.get("detail"))
        assert res.status_code == 400
        assert f"{attempt}/5 lần" in data["detail"], f"Expected '{attempt}/5 lần' in {data['detail']}"

        # Verify DB user account is NOT locked
        db = SessionLocal()
        u = db.query(User).filter(User.id == user_id).first()
        assert u.locked_until is None, "User account must NOT have locked_until set!"
        assert u.is_active is True, "User account must remain active!"
        db.close()

    # 5th Attempt: should lock the session for 15 mins (HTTP 429)
    res5 = browser.post("/api/v1/auth/login", json={"email": "attempt_test@company.com", "password": "WrongPassword"})
    print(f"\n[Attempt 5] Status: {res5.status_code}")
    data5 = res5.json()
    print("Detail:", data5.get("detail"))
    assert res5.status_code == 429
    assert "5/5 lần" in data5["detail"]
    assert "15 phút" in data5["detail"]
    assert int(res5.headers.get("Retry-After", 0)) > 0

    # Even with correct password, this locked browser session is refused (429)
    res_locked_correct = browser.post("/api/v1/auth/login", json={"email": "attempt_test@company.com", "password": "CorrectPassword123!"})
    print(f"\n[Locked Browser - Correct Password] Status: {res_locked_correct.status_code}")
    assert res_locked_correct.status_code == 429

    # CRITICAL: An incognito window / other browser can still sign in successfully!
    # (Proves account is NOT locked, preventing DoS attacks against real owners)
    incognito = TestClient(app)
    res_incognito = incognito.post("/api/v1/auth/login", json={"email": "attempt_test@company.com", "password": "CorrectPassword123!"})
    print(f"\n[Incognito Browser - Correct Password] Status: {res_incognito.status_code}")
    assert res_incognito.status_code == 200
    assert "access_token" in res_incognito.json()

    # Verify DB user is still unlocked
    db = SessionLocal()
    u = db.query(User).filter(User.id == user_id).first()
    assert u.locked_until is None
    assert u.is_active is True
    # Clean up test user & related records
    from app.models.auth_session import AuthSession
    from app.models.audit import AuditLog
    db.query(AuthSession).filter(AuthSession.user_id == user_id).delete(synchronize_session=False)
    db.query(AuditLog).filter(AuditLog.actor_id == user_id).delete(synchronize_session=False)
    db.delete(u)
    db.commit()
    db.close()

    print("\n==================================================")
    print("SUCCESS: ALL ATTEMPT COUNTER & SESSION LOCK TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_attempt_counter_and_session_lock()
