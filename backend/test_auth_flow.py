import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
import json

client = TestClient(app)

def run_tests():
    print("==================================================")
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

    # 6. Login with Non-Existent Email
    res = client.post("/api/v1/auth/login", json={"email": "nonexistent@company.com", "password": "anypassword"})
    print("\n[TEST 5] Login Non-Existent Email (Detailed Error Report):")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 400
    assert "email" in data.get("field_errors", {})
    assert "không tồn tại" in data["detail"]

    # 7. Login with Wrong Password
    res = client.post("/api/v1/auth/login", json={"email": "tranthib@company.com", "password": "WrongPassword!"})
    print("\n[TEST 6] Login Wrong Password (Detailed Error Report):")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 400
    assert "password" in data.get("field_errors", {})
    assert "không chính xác" in data["detail"]

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
        admin = User(email="admin@company.com", hashed_password=hash_password("Admin12345"), full_name="System Admin", role="admin", is_active=True)
        db.add(admin)
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

    # 10. Get Me Profile with Token
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("\n[TEST 8] Get Me Profile with Token:")
    print("Status code:", res.status_code)
    data = res.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
    assert res.status_code == 200
    assert data["email"] == "tranthib@company.com"

    print("\n==================================================")
    print("ALL AUTHENTICATION, APPROVAL & ERROR REPORTING TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
