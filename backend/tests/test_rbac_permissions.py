import pytest
from fastapi.testclient import TestClient
from tests.conftest import session_token
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.models.user import User
from app.models.audit import Permission, RolePermission
from app.core.security import hash_password, create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db
client = TestClient(fastapi_app)


def create_admin_token():
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.email == "admin_test@example.com").first()
    if not admin:
        admin = User(
            email="admin_test@example.com",
            full_name="Admin Test User",
            hashed_password=hash_password("Password123"),
            role="admin",
            is_active=True,
            account_status="active",
            security_version=1
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    token = session_token(db, admin)
    db.close()
    return f"Bearer {token}"



def test_get_rbac_matrix_autoseeds_permissions():
    headers = {"Authorization": create_admin_token()}
    resp = client.get("/api/v1/admin/permissions/matrix", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 5 # 5 modules: users, requisition, candidate, offer, audit

    modules_ids = [m["id"] for m in data]
    assert "users" in modules_ids
    assert "requisition" in modules_ids
    assert "candidate" in modules_ids
    assert "offer" in modules_ids
    assert "audit" in modules_ids

    # Check admin role permissions in 'users' module
    users_mod = next(m for m in data if m["id"] == "users")
    assert "user:view" in users_mod["permissions"]["admin"]
    assert "user:create" in users_mod["permissions"]["admin"]


def test_update_rbac_matrix_single_toggle():
    headers = {"Authorization": create_admin_token()}

    # Grant 'recruiter' permission 'user:view'
    payload = {
        "role_code": "recruiter",
        "permission_code": "user:view",
        "is_granted": True
    }
    put_resp = client.put("/api/v1/admin/permissions/matrix", json=payload, headers=headers)
    assert put_resp.status_code == 200

    # Verify persistence via GET
    get_resp = client.get("/api/v1/admin/permissions/matrix", headers=headers)
    data = get_resp.json()
    users_mod = next(m for m in data if m["id"] == "users")
    assert "user:view" in users_mod["permissions"]["recruiter"]


def test_update_rbac_matrix_revoke_permission():
    headers = {"Authorization": create_admin_token()}

    # Revoke 'recruiter' permission 'user:view'
    payload = {
        "role_code": "recruiter",
        "permission_code": "user:view",
        "is_granted": False
    }
    put_resp = client.put("/api/v1/admin/permissions/matrix", json=payload, headers=headers)
    assert put_resp.status_code == 200

    # Verify revocation in GET
    get_resp = client.get("/api/v1/admin/permissions/matrix", headers=headers)
    data = get_resp.json()
    users_mod = next(m for m in data if m["id"] == "users")
    assert "user:view" not in users_mod["permissions"]["recruiter"]
