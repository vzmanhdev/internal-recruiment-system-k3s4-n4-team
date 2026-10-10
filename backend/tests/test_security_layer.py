import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # Register all SQLAlchemy models
from app.main import app as fastapi_app
import app.db.session as db_session_module
from app.db.session import Base
from app.models.user import User
from app.models.auth_session import AuthSession
from app.core.security import hash_password, create_access_token, hash_token, generate_refresh_token

# In-memory SQLite database for testing with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override engine and SessionLocal in db.session module
db_session_module.engine = engine
db_session_module.SessionLocal = TestingSessionLocal

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[db_session_module.get_db] = override_get_db
client = TestClient(fastapi_app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def create_test_user(email="security_test@example.com", password="Password123", role="employee", is_active=True, account_status="active"):
    db = TestingSessionLocal()
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name="Security Test User",
        role=role,
        is_active=is_active,
        account_status=account_status,
        security_version=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user

def test_login_creates_server_side_session():
    create_test_user()
    response = client.post("/api/v1/auth/login", json={"email": "security_test@example.com", "password": "Password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # Verify session recorded in CSDL
    db = TestingSessionLocal()
    session_rec = db.query(AuthSession).first()
    assert session_rec is not None
    assert session_rec.revoked_at is None
    db.close()

def test_multi_device_login_creates_separate_sessions():
    user = create_test_user()
    
    # Session 1
    resp1 = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"}, headers={"User-Agent": "DeviceA Browser"})
    assert resp1.status_code == 200

    # Session 2
    resp2 = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"}, headers={"User-Agent": "DeviceB Mobile"})
    assert resp2.status_code == 200

    db = TestingSessionLocal()
    sessions = db.query(AuthSession).filter(AuthSession.user_id == user.id).all()
    assert len(sessions) == 2
    db.close()

def test_logout_revokes_server_side_session():
    user = create_test_user()
    resp = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"})
    token = resp.json()["access_token"]

    # Logout
    logout_resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    # Try calling /me with revoked session token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 401

def test_refresh_token_rotation():
    user = create_test_user()
    login_resp = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"})
    refresh_token = login_resp.json()["refresh_token"]

    # Call /refresh
    ref_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_resp.status_code == 200
    ref_data = ref_resp.json()
    new_access = ref_data["access_token"]
    new_refresh = ref_data["refresh_token"]

    assert new_refresh != refresh_token
    assert new_access is not None

def test_refresh_token_reuse_detection_revokes_family():
    user = create_test_user()
    login_resp = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"})
    old_refresh_token = login_resp.json()["refresh_token"]

    # Legitimate refresh 1
    client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh_token})

    # Attacker tries reusing old_refresh_token
    reuse_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh_token})
    assert reuse_resp.status_code == 401
    assert reuse_resp.json()["detail"]["code"] == "REFRESH_TOKEN_REUSED"



def test_account_lockout_after_5_failed_attempts():
    user = create_test_user()
    for _ in range(5):
        client.post("/api/v1/auth/login", json={"email": user.email, "password": "WrongPassword"})

    # 6th attempt should return temporary lockout error
    lock_resp = client.post("/api/v1/auth/login", json={"email": user.email, "password": "WrongPassword"})
    assert lock_resp.status_code == 400
    assert "tạm khóa" in lock_resp.json()["detail"].lower()

def test_admin_lock_revokes_user_sessions():
    user = create_test_user()
    resp = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"})
    token = resp.json()["access_token"]

    # Admin locks user
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == user.id).first()
    u.is_active = False
    u.account_status = "locked"
    u.security_version += 1
    db.query(AuthSession).filter(AuthSession.user_id == user.id).update({"revoked_at": datetime.utcnow()})
    db.commit()
    db.close()

    # User token must now fail with 401
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 401

def test_change_password_increments_security_version():
    user = create_test_user()
    resp = client.post("/api/v1/auth/login", json={"email": user.email, "password": "Password123"})
    token = resp.json()["access_token"]

    # Change password
    cp_resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "Password123",
        "new_password": "NewPassword456"
    }, headers={"Authorization": f"Bearer {token}"})
    assert cp_resp.status_code == 200

    # Verify user's security version increased in CSDL
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == user.id).first()
    assert u.security_version == 2
    db.close()
