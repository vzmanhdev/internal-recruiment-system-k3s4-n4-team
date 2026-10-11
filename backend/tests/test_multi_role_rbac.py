import pytest
from fastapi.testclient import TestClient
from tests.conftest import session_token
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission
from app.core.security import hash_password, create_access_token
from app.services.rbac_service import get_effective_permissions, get_user_roles

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


def seed_rbac_data(db):
    if db.query(Role).count() == 0:
        roles = [
            Role(code="admin", name="Quản trị hệ thống"),
            Role(code="hr_manager", name="Trưởng phòng Nhân sự"),
            Role(code="recruiter", name="Chuyên viên Tuyển dụng"),
            Role(code="hiring_manager", name="Trưởng bộ phận chuyên môn"),
            Role(code="interviewer", name="Người phỏng vấn"),
            Role(code="approver", name="Người phê duyệt"),
            Role(code="employee", name="Nhân sự nội bộ"),
        ]
        db.add_all(roles)
        db.commit()

    if db.query(Permission).count() == 0:
        perms = [
            Permission(code="user:view", name="Xem người dùng", module="users"),
            Permission(code="requisition:view", name="Xem yêu cầu", module="requisition"),
            Permission(code="candidate:view", name="Xem ứng viên", module="candidate"),
        ]
        db.add_all(perms)
        db.commit()

        grants = [
            RolePermission(role_code="admin", permission_code="user:view", is_granted=True),
            RolePermission(role_code="hiring_manager", permission_code="requisition:view", is_granted=True),
            RolePermission(role_code="interviewer", permission_code="candidate:view", is_granted=True),
        ]
        db.add_all(grants)
        db.commit()


def setup_admin_user():
    db = TestingSessionLocal()
    seed_rbac_data(db)
    admin = db.query(User).filter(User.email == "admin_rbac@example.com").first()
    if not admin:
        admin = User(
            email="admin_rbac@example.com",
            full_name="Super Admin RBAC",
            hashed_password=hash_password("AdminPass123"),
            role="admin",
            is_active=True,
            account_status="active",
            security_version=1
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    else:
        admin.role = "admin"
        admin.is_active = True
        admin.account_status = "active"
        db.commit()

    role_obj = db.query(Role).filter(Role.code == "admin").first()
    if role_obj and db.query(UserRole).filter_by(user_id=admin.id, role_id=role_obj.id).count() == 0:
        db.add(UserRole(user_id=admin.id, role_id=role_obj.id))
        db.commit()

    token = session_token(db, admin)
    db.close()
    return admin.id, f"Bearer {token}"


def test_auth_me_returns_roles_and_permissions():
    admin_id, auth_header = setup_admin_user()
    resp = client.get("/api/v1/auth/me", headers={"Authorization": auth_header})
    assert resp.status_code == 200
    data = resp.json()

    assert "roles" in data
    assert isinstance(data["roles"], list)
    assert any(r["code"] == "admin" for r in data["roles"])

    assert "permissions" in data
    assert isinstance(data["permissions"], list)
    assert "user:view" in data["permissions"]


def test_admin_permission_immutable_rejection():
    _, auth_header = setup_admin_user()
    # Try revoking permission from admin
    payload = {
        "role_code": "admin",
        "permission_code": "user:view",
        "is_granted": False
    }
    resp = client.put("/api/v1/admin/permissions/matrix", json=payload, headers={"Authorization": auth_header})
    assert resp.status_code == 400
    assert resp.headers.get("X-Error-Code") == "ADMIN_PERMISSION_IMMUTABLE"


def test_self_admin_role_remove_rejection():
    admin_id, auth_header = setup_admin_user()
    # Try removing admin role from self
    payload = {"roles": ["hiring_manager", "interviewer"]}
    resp = client.put(f"/api/v1/admin/users/{admin_id}/roles", json=payload, headers={"Authorization": auth_header})
    assert resp.status_code == 409
    assert resp.headers.get("X-Error-Code") == "SELF_ADMIN_ROLE_REMOVE_DENIED"


def test_multi_role_union_effective_permissions():
    db = TestingSessionLocal()
    seed_rbac_data(db)

    # Create a user with both hiring_manager and interviewer roles
    user = User(
        email="multi_role@example.com",
        full_name="Multi Role Employee",
        hashed_password=hash_password("Pass123"),
        role="hiring_manager,interviewer",
        is_active=True,
        account_status="active",
        security_version=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    hm_role = db.query(Role).filter(Role.code == "hiring_manager").first()
    it_role = db.query(Role).filter(Role.code == "interviewer").first()

    db.add_all([
        UserRole(user_id=user.id, role_id=hm_role.id),
        UserRole(user_id=user.id, role_id=it_role.id)
    ])
    db.commit()

    effective_perms = get_effective_permissions(db, user)
    roles = get_user_roles(db, user)
    db.close()

    role_codes = [r["code"] for r in roles]
    assert "hiring_manager" in role_codes
    assert "interviewer" in role_codes

    # UNION result contains both requisition:view and candidate:view
    assert "requisition:view" in effective_perms
    assert "candidate:view" in effective_perms
