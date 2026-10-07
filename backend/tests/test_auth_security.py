import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db, SessionLocal
from app.db.init_db import init_db, SYSTEM_ROLES
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db_users():
    db = SessionLocal()
    try:
        # Reset all users' lock status, failed attempts, and reset default password
        users = db.query(User).all()
        for u in users:
            u.failed_login_attempts = 0
            u.locked_until = None
            u.account_status = "active"
            u.is_active = True
            u.password_changed_at = None
            u.hashed_password = hash_password("company123")
        db.commit()
    finally:
        db.close()
    init_db()

def test_system_roles_seeded():
    for role_info in SYSTEM_ROLES:
        res = client.post("/api/v1/auth/login", json={
            "email": role_info["email"],
            "password": role_info["password"]
        })
        assert res.status_code == 200, f"Failed login for seeded user: {role_info['email']} - {res.json()}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == role_info["role"]
        assert "redirect_route" in data["user"]

def test_case_insensitive_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "TRUONGPHONG@COMPANY.COM",
        "password": "company123"
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "hr_manager"

def test_brute_force_lockout():
    email = "nhanvien@company.com"
    # Attempt 4 wrong logins
    for _ in range(4):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "wrongpassword"})
        assert res.status_code == 400
        assert "Cảnh báo" in res.json()["detail"]

    # Attempt 5th wrong login -> Lockout
    res5 = client.post("/api/v1/auth/login", json={"email": email, "password": "wrongpassword"})
    assert res5.status_code == 400
    assert "tạm khóa" in res5.json()["detail"].lower()

    # Even with correct password, login is blocked during lockout
    res_correct = client.post("/api/v1/auth/login", json={"email": email, "password": "company123"})
    assert res_correct.status_code == 400
    assert "tạm khóa" in res_correct.json()["detail"].lower()

def test_profile_update_and_avatar():
    # Login as admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@company.com",
        "password": "company123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile & base64 avatar
    b64_avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    update_res = client.put("/api/v1/auth/me", headers=headers, json={
        "full_name": "Admin System Updated",
        "phone": "0999888777",
        "bio": "Updated bio text",
        "avatar_base64": b64_avatar
    })
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["full_name"] == "Admin System Updated"
    assert data["phone"] == "0999888777"
    assert data["avatar_base64"] == b64_avatar

    # Verify GET /me returns updated info
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Admin System Updated"

def test_change_password_policy_and_invalidation():
    # Login as recruiter
    login_res = client.post("/api/v1/auth/login", json={
        "email": "tuyendung@company.com",
        "password": "company123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test weak new password -> 400
    weak_res = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "company123",
        "new_password": "simplepassword",
        "confirm_password": "simplepassword"
    })
    assert weak_res.status_code == 400

    # Test valid strong new password -> 200
    strong_pwd = "NewSecurePassword123!"
    change_res = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "company123",
        "new_password": strong_pwd,
        "confirm_password": strong_pwd
    })
    assert change_res.status_code == 200

    # Verify old password no longer works
    old_login = client.post("/api/v1/auth/login", json={
        "email": "tuyendung@company.com",
        "password": "company123"
    })
    assert old_login.status_code == 400

    # Verify new password works
    new_login = client.post("/api/v1/auth/login", json={
        "email": "tuyendung@company.com",
        "password": strong_pwd
    })
    assert new_login.status_code == 200
