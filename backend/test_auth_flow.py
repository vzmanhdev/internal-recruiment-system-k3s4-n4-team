import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
import json

client = TestClient(app)

def run_tests():
    print("==================================================")

    db = SessionLocal()
    db.query(User).filter(User.email.in_(["tranthib@company.com", "managed.user@company.com"])).delete(synchronize_session=False)
    db.commit()
    db.close()
    print("RUNNING AUTHENTICATION & ERROR REPORTING TESTS")
    print("==================================================")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("[PASS] Health Check OK:", res.json())

    # 2. Test Invalid Email format on Register
    bad_email_req = {
        "full_name": "Nguyen Van A",
        "email": "not-an-email",
        "password": "password123"
    }
    res = client.post("/api/v1/auth/register", json=bad_email_req)
    print("\n[TEST 1] Invalid Email Format on Register:")
    print("Status code:", res.status_code)
    print("Response JSON:", json.dumps(res.json(), ensure_ascii=False, indent=2))
    assert res.status_code == 422
    assert "email" in res.json().get("field_errors", {})

    # 3. Test Short Password on Register
    short_pwd_req = {
        "full_name": "Nguyen Van A",
        "email": "testuser@company.com",
        "password": "123"
    }
    res = client.post("/api/v1/auth/register", json=short_pwd_req)
    print("\n[TEST 2] Short Password (< 6 chars) on Register:")
    print("Status code:", res.status_code)
    print("Response JSON:", json.dumps(res.json(), ensure_ascii=False, indent=2))
    assert res.status_code == 422
    assert "password" in res.json().get("field_errors", {})

    # 4. Successful Registration
    valid_user_req = {
        "full_name": "Trần Thị B",
        "email": "tranthib@company.com",
        "password": "SecurePassword123!",
        "phone": "0987654321"
    }
    res = client.post("/api/v1/auth/register", json=valid_user_req)
    print("\n[TEST 3] Successful User Registration:")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 201
    assert "message" in data
    assert data["user"]["email"] == "tranthib@company.com"
    assert data["user"]["is_active"] is False

    # 5. Duplicate Email Registration
    res = client.post("/api/v1/auth/register", json=valid_user_req)
    print("\n[TEST 4] Duplicate Email Registration (Detailed Error Report):")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 400
    assert "email" in data.get("field_errors", {})
    assert "đã được đăng ký" in data["detail"]

    # 6. Login with Non-Existent Email (S1-01: generic error message, no email leakage)
    res = client.post("/api/v1/auth/login", json={"email": "nonexistent@company.com", "password": "anypassword"})
    print("\n[TEST 5] Login Non-Existent Email (S1-01 Generic Error):")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 400
    assert "Email hoặc mật khẩu không chính xác" in data["detail"]

    # 7. Login with Wrong Password (S1-01: identical generic error message)
    res = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "WrongPassword!"})
    print("\n[TEST 6] Login Wrong Password (S1-01 Generic Error):")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 400
    assert "Email hoặc mật khẩu không chính xác" in data["detail"]

    # 8. Login is blocked until an Admin approves the account
    res = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "SecurePassword123!"})
    print("\n[TEST 7] Login Before Approval:")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 400
    assert "chờ" in data["detail"]

    # 9. Create an Admin, approve the pending user, then login normally
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@company.com").first()
    if not admin:
        admin = User(email="admin@company.com", hashed_password=hash_password("Admin12345"), full_name="System Admin", role="admin", is_active=True, account_status="active")
        db.add(admin)
    else:
        admin.hashed_password = hash_password("Admin12345")
        admin.role = "admin"
        admin.is_active = True
        admin.account_status = "active"
    db.commit()
    db.close()

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@company.com", "password": "Admin12345"})
    admin_token = admin_login.json()["access_token"]
    pending = client.get("/api/v1/auth/pending-users", headers={"Authorization": f"Bearer {admin_token}"})
    pending_user = next(item for item in pending.json() if item["email"] == "tranthib@company.com")
    approved = client.post(f"/api/v1/auth/users/{pending_user['id']}/approve", headers={"Authorization": f"Bearer {admin_token}"})
    assert approved.status_code == 200
    assert approved.json()["is_active"] is True

    res = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "SecurePassword123!"})
    print("\n[TEST 8] Successful Login After Approval:")
    data = res.json()
    assert res.status_code == 200
    assert "access_token" in data
    token = data["access_token"]

    # 9b. S1-01: Test Lockout after 5 failed login attempts
    print("\n[TEST 8b] 5 Consecutive Failed Logins -> 15-Minute Temporary Lockout (S1-01):")
    # We do 5 wrong password attempts on an approved user
    for attempt in range(1, 6):
        fail_res = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": f"WrongPwd{attempt}"})
        assert fail_res.status_code == 400
        if attempt < 5:
            assert "Email hoặc mật khẩu không chính xác" in fail_res.json()["detail"]
        else:
            assert "15 phút" in fail_res.json()["detail"] or "khóa tạm thời" in fail_res.json()["detail"]
            print(f" -> Attempt {attempt}: Successfully locked out! Response: {fail_res.json()['detail']}")

    # 6th attempt should also be locked out immediately even with correct password
    locked_attempt = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "SecurePassword123!"})
    assert locked_attempt.status_code == 400
    assert "15 phút" in locked_attempt.json()["detail"] or "khóa tạm thời" in locked_attempt.json()["detail"]
    print(" -> 6th attempt (even with correct pwd) rejected due to temporary lockout: PASS")

    # Reset locked_until and failed_login_attempts in DB to continue testing
    db = SessionLocal()
    user_obj = db.query(User).filter(User.email == "tranthib@company.com").first()
    user_obj.locked_until = None
    user_obj.failed_login_attempts = 0
    db.commit()
    db.close()

    # Re-login successfully
    res = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "SecurePassword123!"})
    assert res.status_code == 200
    token = res.json()["access_token"]

    # 10. Get Me Profile with Token
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("\n[TEST 9] Get Me Profile with Token:")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 200
    assert data["email"] == "tranthib@company.com"

    # 10b. S1-02: Refresh active session
    print("\n[TEST 9b] Session Refresh (S1-02):")
    refresh_res = client.post("/api/v1/auth/refresh-session", headers={"Authorization": f"Bearer {token}"})
    assert refresh_res.status_code == 200
    new_token = refresh_res.json()["access_token"]
    assert new_token != ""
    print(" -> Session Refresh OK, received new token")

    # 10c. S1-02: Safe Logout & Server-Side Token Revocation
    print("\n[TEST 9c] Safe Logout & Server-Side Token Revocation (S1-02):")
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    print(" -> Logout Response:", logout_res.json())

    # After logout, old token must be rejected (401)
    revoked_check = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert revoked_check.status_code == 401
    assert "hết hạn" in revoked_check.json()["detail"] or "không hợp lệ" in revoked_check.json()["detail"]
    print(" -> Access with revoked token rejected (401): PASS")

    # Use the refreshed token to log back in or login fresh
    relogin = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "SecurePassword123!"})
    assert relogin.status_code == 200
    token = relogin.json()["access_token"]

    # 11. Test OTP Password Reset Request (S1-03) and Authenticated Password Change (S1-04)
    print("\n[TEST 10] OTP Password Reset Request & Authenticated Password Change:")
    reset_init = client.post("/api/v1/auth/password-reset/request", json={"email": "tranthib@company.com"})
    assert reset_init.status_code == 202
    session_id = reset_init.json()["reset_session_id"]
    assert session_id is not None
    print(" -> OTP Request initiated (202): PASS")

    # Verify wrong OTP rejected
    wrong_otp_res = client.post("/api/v1/auth/password-reset/verify", json={"reset_session_id": session_id, "otp": "000000"})
    assert wrong_otp_res.status_code == 400
    assert "không chính xác" in wrong_otp_res.json()["detail"]
    print(" -> Wrong OTP rejected (400): PASS")

    # Change password while authenticated (S1-04)
    change_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "SecurePassword123!", "new_password": "NewSecure123!"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert change_res.status_code == 200
    print(" -> Change Password OK (200): PASS")

    # Old password fails
    old_login = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "SecurePassword123!"})
    assert old_login.status_code == 400

    # New password succeeds
    login_with_new_password = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "NewSecure123!"})
    assert login_with_new_password.status_code == 200
    print(" -> Login with new password OK (200): PASS")

    # 12. Admin account management: create, search, roles, lock and unlock
    headers = {"Authorization": f"Bearer {admin_token}"}
    managed_payload = {
        "full_name": "Managed User",
        "email": "managed.user@company.com",
        "password": "Managed123",
        "roles": ["employee", "manager"]
    }
    created = client.post("/api/v1/admin/users", json=managed_payload, headers=headers)
    assert created.status_code == 201
    managed_id = created.json()["id"]
    listed = client.get("/api/v1/admin/users?search=managed.user&page=1&page_size=20", headers=headers)
    assert listed.status_code == 200 and listed.json()["total"] == 1
    changed = client.put(f"/api/v1/admin/users/{managed_id}/roles", json={"roles": ["employee", "hr_manager"]}, headers=headers)
    assert changed.status_code == 200 and "hr_manager" in changed.json()["roles"]
    invalid_lock = client.post(f"/api/v1/admin/users/{managed_id}/lock", json={"reason": ""}, headers=headers)
    assert invalid_lock.status_code == 422
    locked = client.post(f"/api/v1/admin/users/{managed_id}/lock", json={"reason": "Tạm khóa để kiểm tra tài khoản"}, headers=headers)
    assert locked.status_code == 200 and locked.json()["account_status"] == "locked"
    unlocked = client.post(f"/api/v1/admin/users/{managed_id}/unlock", headers=headers)
    assert unlocked.status_code == 200 and unlocked.json()["account_status"] == "active"

    print("\n==================================================")
    print("ALL AUTHENTICATION, APPROVAL & ERROR REPORTING TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
