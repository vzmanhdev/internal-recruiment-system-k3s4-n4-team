import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.security import verify_password, hash_password, hash_otp, email_fingerprint
from app.models.user import User
from app.models.password_reset import PasswordResetSession
from app.core.config import settings

TEST_DB_FILE = os.path.join(os.environ.get("TEST_TMP_DIR", "."), "test_otp_reset.db").replace("\\", "/")
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
    # Seed a standard user
    user = User(
        email="testuser@company.com",
        hashed_password=hash_password("OldPassword123!"),
        full_name="Test OTP User",
        role="employee",
        is_active=True,
        account_status="active"
    )
    db.add(user)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

# -------------------------------------------------------------------------
# TEST CASES
# -------------------------------------------------------------------------

def test_email_existence_check():
    client = TestClient(app)

    # Request reset for EXISTING email -> Should return 202 ACCEPTED
    resp1 = client.post("/api/v1/auth/password-reset/request", json={"email": "testuser@company.com"})
    assert resp1.status_code == 202
    data1 = resp1.json()
    assert "reset_session_id" in data1

    # Non-existent email -> Must return 400 Bad Request with generic invalid email error
    resp2 = client.post("/api/v1/auth/password-reset/request", json={"email": "nonexistent@company.com"})
    assert resp2.status_code == 400
    data2 = resp2.json()
    assert "detail" in data2
    assert "Email không hợp lệ" in data2["detail"]

def test_otp_digest_not_stored_as_plaintext():
    client = TestClient(app)
    resp = client.post("/api/v1/auth/password-reset/request", json={"email": "testuser@company.com"})
    session_id = resp.json()["reset_session_id"]

    db = TestingSessionLocal()
    session_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    assert session_rec is not None
    # Ensure digest is present and not 6 digits plaintext
    assert session_rec.otp_digest is not None
    assert len(session_rec.otp_digest) == 64 # HMAC-SHA256 hex string length
    assert not session_rec.otp_digest.isdigit()
    db.close()

def test_wrong_otp_increments_attempts_and_locks_on_5th_failure():
    client = TestClient(app)
    req_resp = client.post("/api/v1/auth/password-reset/request", json={"email": "testuser@company.com"})
    session_id = req_resp.json()["reset_session_id"]

    # Wrong OTP attempts 1 to 4
    for attempt in range(1, 5):
        verify_resp = client.post("/api/v1/auth/password-reset/verify", json={
            "reset_session_id": session_id,
            "otp": "000000"
        })
        assert verify_resp.status_code == 400
        assert f"Bạn còn {5 - attempt} lần thử" in verify_resp.json()["detail"]

    # 5th Wrong OTP Attempt -> Session should lock
    lock_resp = client.post("/api/v1/auth/password-reset/verify", json={
        "reset_session_id": session_id,
        "otp": "000000"
    })
    assert lock_resp.status_code == 400
    assert "bị khóa do nhập sai quá 5 lần" in lock_resp.json()["detail"]

    # Check DB status = locked
    db = TestingSessionLocal()
    sess_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    assert sess_rec.status == "locked"
    assert sess_rec.attempts_used == 5
    assert sess_rec.otp_digest is None # Invalidated immediately
    db.close()

def test_full_successful_otp_verify_and_login_with_new_password():
    client = TestClient(app)

    # 1. Request Reset Session
    req_resp = client.post("/api/v1/auth/password-reset/request", json={"email": "testuser@company.com"})
    session_id = req_resp.json()["reset_session_id"]

    # Retrieve valid OTP digest from DB for testing verification
    db = TestingSessionLocal()
    sess_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    # Set a known OTP digest: e.g. OTP = 654321
    sess_rec.otp_digest = hash_otp("654321")
    db.commit()
    db.close()

    # 2. Verify with correct OTP
    verify_resp = client.post("/api/v1/auth/password-reset/verify", json={
        "reset_session_id": session_id,
        "otp": "654321"
    })
    assert verify_resp.status_code == 200
    assert verify_resp.json()["success"] is True

    # 3. Check DB that session is used and user password has changed
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "testuser@company.com").first()
    sess_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    
    assert sess_rec.status == "used"
    assert sess_rec.otp_digest is None
    assert not verify_password("OldPassword123!", user.hashed_password) # Old password invalidated!
    db.close()

    # 4. Old password login MUST fail
    login_old = client.post("/api/v1/auth/login", json={"email": "testuser@company.com", "password": "OldPassword123!"})
    assert login_old.status_code in (400, 401)

def test_expired_otp_fails():
    client = TestClient(app)
    req_resp = client.post("/api/v1/auth/password-reset/request", json={"email": "testuser@company.com"})
    session_id = req_resp.json()["reset_session_id"]

    # Artificially expire the session OTP in DB
    db = TestingSessionLocal()
    sess_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    sess_rec.otp_expires_at = datetime.utcnow() - timedelta(minutes=1)
    sess_rec.otp_digest = hash_otp("123456")
    db.commit()
    db.close()

    # Try verifying expired OTP
    verify_resp = client.post("/api/v1/auth/password-reset/verify", json={
        "reset_session_id": session_id,
        "otp": "123456"
    })
    assert verify_resp.status_code == 400
    assert "Mã OTP đã hết hạn" in verify_resp.json()["detail"]

def test_resend_cooldown_and_old_otp_invalidation():
    client = TestClient(app)
    req_resp = client.post("/api/v1/auth/password-reset/request", json={"email": "testuser@company.com"})
    session_id = req_resp.json()["reset_session_id"]

    # Try resending immediately (cooldown active) -> Should FAIL
    early_resend = client.post("/api/v1/auth/password-reset/resend", json={"reset_session_id": session_id})
    assert early_resend.status_code == 400
    assert "Vui lòng chờ" in early_resend.json()["detail"]

    # Fast forward resend_available_at timestamp in DB
    db = TestingSessionLocal()
    sess_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    sess_rec.resend_available_at = datetime.utcnow() - timedelta(seconds=1)
    old_digest = hash_otp("111111")
    sess_rec.otp_digest = old_digest
    db.commit()
    db.close()

    # Resend after cooldown -> Should SUCCESS
    resend_resp = client.post("/api/v1/auth/password-reset/resend", json={"reset_session_id": session_id})
    assert resend_resp.status_code == 200

    # Verify old OTP digest was invalidated and replaced with new OTP digest
    db = TestingSessionLocal()
    sess_rec = db.query(PasswordResetSession).filter(PasswordResetSession.id == session_id).first()
    assert sess_rec.otp_digest != old_digest # Old OTP invalidated!
    sess_rec.otp_digest = hash_otp("222222") # Set new OTP digest = 222222
    db.commit()
    db.close()

    # Old OTP (111111) MUST FAIL
    old_verify = client.post("/api/v1/auth/password-reset/verify", json={
        "reset_session_id": session_id,
        "otp": "111111"
    })
    assert old_verify.status_code == 400

    # New OTP (222222) MUST SUCCESS
    new_verify = client.post("/api/v1/auth/password-reset/verify", json={
        "reset_session_id": session_id,
        "otp": "222222"
    })
    assert new_verify.status_code == 200

def test_rate_limit_exceeded():
    client = TestClient(app)
    email = "testuser@company.com"

    # Make 5 requests (EMAIL_LIMIT = 5)
    for _ in range(settings.PASSWORD_RESET_EMAIL_LIMIT):
        resp = client.post("/api/v1/auth/password-reset/request", json={"email": email})
        assert resp.status_code == 202

    # 6th Request MUST fail with HTTP 429 Too Many Requests
    blocked_resp = client.post("/api/v1/auth/password-reset/request", json={"email": email})
    assert blocked_resp.status_code == 429
    assert "nhiều yêu cầu đặt lại mật khẩu" in blocked_resp.json()["detail"]

def test_change_password_endpoint_flow():
    client = TestClient(app)
    
    # 1. Login to get Access Token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testuser@company.com",
        "password": "OldPassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Try Change Password with WRONG current password -> Should FAIL 400
    bad_change = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "WrongCurrentPassword123!",
        "new_password": "NewSecretPassword456!"
    })
    assert bad_change.status_code == 400
    assert "Mật khẩu hiện tại không chính xác" in bad_change.json()["detail"]

    # 3. Change Password with CORRECT current password -> Should SUCCESS
    good_change = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "OldPassword123!",
        "new_password": "NewSecretPassword456!"
    })
    assert good_change.status_code == 200

    # 4. Try Login with OLD Password -> MUST FAIL 400
    old_login = client.post("/api/v1/auth/login", json={
        "email": "testuser@company.com",
        "password": "OldPassword123!"
    })
    assert old_login.status_code == 400

    # 5. Login with NEW Password -> MUST SUCCESS 200
    new_login = client.post("/api/v1/auth/login", json={
        "email": "testuser@company.com",
        "password": "NewSecretPassword456!"
    })
    assert new_login.status_code == 200

def test_profile_update_and_fetch_flow():
    client = TestClient(app)

    # 1. Login to obtain access token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testuser@company.com",
        "password": "OldPassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch current profile GET /api/v1/auth/me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "testuser@company.com"
    assert me_data["full_name"] == "Test OTP User"

    # 3. Update profile PUT /api/v1/auth/me with full details
    update_payload = {
        "full_name": "Test User Updated",
        "phone": "0912345678",
        "date_of_birth": "1995-05-15",
        "gender": "Nam",
        "job_title": "Chuyên viên Kiểm thử",
        "department": "Nhân sự",
        "bio": "Mô tả cá nhân kiểm thử"
    }
    update_res = client.put("/api/v1/auth/me", headers=headers, json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()

    assert updated_data["full_name"] == "Test User Updated"
    assert updated_data["phone"] == "0912345678"
    assert updated_data["date_of_birth"] == "1995-05-15"
    assert updated_data["gender"] == "Nam"
    assert updated_data["job_title"] == "Chuyên viên Kiểm thử"
    assert updated_data["department"] == "Nhân sự"
    assert updated_data["bio"] == "Mô tả cá nhân kiểm thử"

    # 4. Fetch profile again to confirm DB persistence
    me_refetched = client.get("/api/v1/auth/me", headers=headers)
    assert me_refetched.status_code == 200
    refetched_data = me_refetched.json()
    assert refetched_data["full_name"] == "Test User Updated"
    assert refetched_data["phone"] == "0912345678"
    assert refetched_data["date_of_birth"] == "1995-05-15"
    assert refetched_data["job_title"] == "Chuyên viên Kiểm thử"


