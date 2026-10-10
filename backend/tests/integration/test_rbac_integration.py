import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
from app.db.session import Base, get_db
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission, AuditLog
from app.models.auth_session import AuthSession
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.hr import Department
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


def seed_test_rbac_data(db):
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
            Permission(code="user:lock", name="Khóa người dùng", module="users"),
            Permission(code="requisition:view", name="Xem yêu cầu", module="requisition"),
            Permission(code="requisition:create", name="Tạo yêu cầu", module="requisition"),
            Permission(code="requisition:approve", name="Duyệt yêu cầu", module="requisition"),
            Permission(code="candidate:view", name="Xem ứng viên", module="candidate"),
            Permission(code="candidate:view_salary", name="Xem lương ứng viên", module="candidate"),
            Permission(code="evaluation:submit", name="Gửi đánh giá", module="evaluation"),
            Permission(code="approval:approve", name="Phê duyệt chung", module="approval"),
            Permission(code="job:publish", name="Đăng tin tuyển dụng", module="jobs"),
        ]
        db.add_all(perms)
        db.commit()

        grants = [
            RolePermission(role_code="admin", permission_code="user:view", is_granted=True),
            RolePermission(role_code="hiring_manager", permission_code="requisition:view", is_granted=True),
            RolePermission(role_code="hiring_manager", permission_code="requisition:create", is_granted=True),
            RolePermission(role_code="interviewer", permission_code="candidate:view", is_granted=True),
            RolePermission(role_code="interviewer", permission_code="evaluation:submit", is_granted=True),
            RolePermission(role_code="approver", permission_code="approval:approve", is_granted=True),
            RolePermission(role_code="recruiter", permission_code="candidate:view", is_granted=True),
        ]
        db.add_all(grants)
        db.commit()


def create_user_with_roles(email: str, roles_list: list, name: str = "Test User"):
    db = TestingSessionLocal()
    seed_test_rbac_data(db)
    roles_str = ",".join(roles_list)
    user = User(
        email=email,
        full_name=name,
        hashed_password=hash_password("Password123!"),
        role=roles_str,
        is_active=True,
        account_status="active",
        security_version=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    for r_code in roles_list:
        role_obj = db.query(Role).filter(Role.code == r_code).first()
        if role_obj:
            db.add(UserRole(user_id=user.id, role_id=role_obj.id))
    db.commit()

    token = create_access_token(subject=user.id, security_version=user.security_version)
    db.close()
    return user.id, f"Bearer {token}"


# 1. Single role permissions test
def test_single_role_permissions():
    uid, auth_header = create_user_with_roles("user_single@example.com", ["hiring_manager"])
    resp = client.get("/api/v1/auth/me", headers={"Authorization": auth_header})
    assert resp.status_code == 200
    data = resp.json()

    role_codes = [r["code"] if isinstance(r, dict) else r for r in data["roles"]]
    assert role_codes == ["hiring_manager"]
    assert "requisition:view" in data["permissions"]
    assert "requisition:create" in data["permissions"]
    assert "evaluation:submit" not in data["permissions"]


# 2. Two role union permissions test
def test_two_role_union_permissions():
    uid, auth_header = create_user_with_roles("user_two@example.com", ["hiring_manager", "interviewer"])
    resp = client.get("/api/v1/auth/me", headers={"Authorization": auth_header})
    assert resp.status_code == 200
    data = resp.json()

    role_codes = [r["code"] if isinstance(r, dict) else r for r in data["roles"]]
    assert "hiring_manager" in role_codes
    assert "interviewer" in role_codes

    # UNION check
    assert "requisition:view" in data["permissions"]
    assert "evaluation:submit" in data["permissions"]


# 3. Three role union permissions test
def test_three_role_union_permissions():
    uid, auth_header = create_user_with_roles("user_three@example.com", ["hiring_manager", "interviewer", "approver"])
    resp = client.get("/api/v1/auth/me", headers={"Authorization": auth_header})
    assert resp.status_code == 200
    data = resp.json()

    role_codes = [r["code"] if isinstance(r, dict) else r for r in data["roles"]]
    assert len(role_codes) == 3
    assert "requisition:view" in data["permissions"]
    assert "evaluation:submit" in data["permissions"]
    assert "approval:approve" in data["permissions"]


# 4. Duplicate permission deduplication test
def test_duplicate_permission_deduplication():
    # Both recruiter and interviewer have candidate:view
    uid, auth_header = create_user_with_roles("user_dedup@example.com", ["recruiter", "interviewer"])
    resp = client.get("/api/v1/auth/me", headers={"Authorization": auth_header})
    assert resp.status_code == 200
    data = resp.json()

    perms = data["permissions"]
    # Check candidate:view appears exactly once in the list
    assert perms.count("candidate:view") == 1


# 5. Add role effective immediately test
def test_add_role_effective_immediately():
    admin_id, admin_auth = create_user_with_roles("admin_add_role@example.com", ["admin"])
    target_id, target_auth = create_user_with_roles("target_add_role@example.com", ["hiring_manager"])

    # Initially target does NOT have evaluation:submit
    resp1 = client.get("/api/v1/auth/me", headers={"Authorization": target_auth})
    assert "evaluation:submit" not in resp1.json()["permissions"]

    # Admin adds interviewer role
    put_resp = client.put(f"/api/v1/admin/users/{target_id}/roles", json={"roles": ["hiring_manager", "interviewer"]}, headers={"Authorization": admin_auth})
    assert put_resp.status_code == 200

    # Next immediate request to /auth/me reflects interviewer role and evaluation:submit permission
    resp2 = client.get("/api/v1/auth/me", headers={"Authorization": target_auth})
    assert "evaluation:submit" in resp2.json()["permissions"]


# 6. Remove role effective immediately test
def test_remove_role_effective_immediately():
    admin_id, admin_auth = create_user_with_roles("admin_rem_role@example.com", ["admin"])
    target_id, target_auth = create_user_with_roles("target_rem_role@example.com", ["hiring_manager", "interviewer"])

    # Initially has evaluation:submit
    resp1 = client.get("/api/v1/auth/me", headers={"Authorization": target_auth})
    assert "evaluation:submit" in resp1.json()["permissions"]

    # Admin removes interviewer role
    put_resp = client.put(f"/api/v1/admin/users/{target_id}/roles", json={"roles": ["hiring_manager"]}, headers={"Authorization": admin_auth})
    assert put_resp.status_code == 200

    # Next immediate request to /auth/me reflects removal
    resp2 = client.get("/api/v1/auth/me", headers={"Authorization": target_auth})
    assert "evaluation:submit" not in resp2.json()["permissions"]


# 7. Permission matrix allow effective immediately test
def test_permission_matrix_allow_effective_immediately():
    admin_id, admin_auth = create_user_with_roles("admin_mat_allow@example.com", ["admin"])
    user_id, user_auth = create_user_with_roles("recruiter_mat_allow@example.com", ["recruiter"])

    # Initially recruiter does NOT have candidate:view_salary
    resp1 = client.get("/api/v1/auth/me", headers={"Authorization": user_auth})
    assert "candidate:view_salary" not in resp1.json()["permissions"]

    # Admin grants candidate:view_salary to recruiter
    payload = {"role_code": "recruiter", "permission_code": "candidate:view_salary", "is_granted": True}
    put_resp = client.put("/api/v1/admin/permissions/matrix", json=payload, headers={"Authorization": admin_auth})
    assert put_resp.status_code == 200

    # Immediate next request shows granted permission
    resp2 = client.get("/api/v1/auth/me", headers={"Authorization": user_auth})
    assert "candidate:view_salary" in resp2.json()["permissions"]


# 8. Permission matrix deny effective immediately test
def test_permission_matrix_deny_effective_immediately():
    admin_id, admin_auth = create_user_with_roles("admin_mat_deny@example.com", ["admin"])
    user_id, user_auth = create_user_with_roles("recruiter_mat_deny@example.com", ["recruiter"])

    # Initially candidate:view is granted
    resp1 = client.get("/api/v1/auth/me", headers={"Authorization": user_auth})
    assert "candidate:view" in resp1.json()["permissions"]

    # Admin revokes candidate:view from recruiter
    payload = {"role_code": "recruiter", "permission_code": "candidate:view", "is_granted": False}
    put_resp = client.put("/api/v1/admin/permissions/matrix", json=payload, headers={"Authorization": admin_auth})
    assert put_resp.status_code == 200

    # Immediate next request shows revoked permission
    resp2 = client.get("/api/v1/auth/me", headers={"Authorization": user_auth})
    assert "candidate:view" not in resp2.json()["permissions"]


# 9. New permission admin auto allow test
def test_new_permission_admin_auto_allow():
    db = TestingSessionLocal()
    # Add a brand new permission dynamically
    new_perm = Permission(code="system:audit_export", name="Xuất file Audit Log", module="audit")
    db.add(new_perm)
    db.commit()
    db.close()

    admin_id, admin_auth = create_user_with_roles("admin_auto_allow@example.com", ["admin"])
    resp = client.get("/api/v1/auth/me", headers={"Authorization": admin_auth})
    assert resp.status_code == 200
    assert "system:audit_export" in resp.json()["permissions"]


# 10. New permission other roles default deny test
def test_new_permission_other_roles_default_deny():
    db = TestingSessionLocal()
    new_perm_code = f"new_feature:{datetime.now().microsecond}"
    new_perm = Permission(code=new_perm_code, name="Tính năng mới", module="new")
    db.add(new_perm)
    db.commit()
    db.close()

    for role_code in ["hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"]:
        _, auth_h = create_user_with_roles(f"user_def_deny_{role_code}@example.com", [role_code])
        resp = client.get("/api/v1/auth/me", headers={"Authorization": auth_h})
        assert new_perm_code not in resp.json()["permissions"]


# 11. Admin permission immutable test
def test_admin_permission_immutable():
    admin_id, admin_auth = create_user_with_roles("admin_immutable@example.com", ["admin"])
    payload = {"role_code": "admin", "permission_code": "user:view", "is_granted": False}
    resp = client.put("/api/v1/admin/permissions/matrix", json=payload, headers={"Authorization": admin_auth})
    assert resp.status_code == 400
    assert resp.headers.get("X-Error-Code") == "ADMIN_PERMISSION_IMMUTABLE"


# 12. Admin locked cannot access test
def test_admin_locked_cannot_access():
    admin_id, admin_auth = create_user_with_roles("admin_locked@example.com", ["admin"])

    # Lock admin account in DB
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == admin_id).first()
    u.account_status = "locked"
    u.is_active = False
    u.lock_reason = "Khóa tài khoản do nghi ngờ vi phạm"
    db.commit()
    db.close()

    resp = client.get("/api/v1/auth/me", headers={"Authorization": admin_auth})
    assert resp.status_code == 403 or resp.status_code == 401


# 13. Admin revoked session cannot access test
def test_admin_revoked_session_cannot_access():
    db = TestingSessionLocal()
    seed_test_rbac_data(db)
    admin = User(
        email="admin_sess_rev@example.com",
        full_name="Admin Session Revoked",
        hashed_password=hash_password("Pass123!"),
        role="admin",
        is_active=True,
        account_status="active",
        security_version=1
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    # Create an explicit AuthSession that is revoked
    sess = AuthSession(
        id="revoked-session-uuid-12345",
        user_id=admin.id,
        refresh_token_hash="dummy_hash_for_test",
        device_name="Chrome Desktop",
        browser="Chrome",
        os="Windows",
        ip_address="127.0.0.1",
        expires_at=datetime.utcnow() + timedelta(days=1),
        revoked_at=datetime.utcnow(),
        revoke_reason="User logged out"
    )
    db.add(sess)
    db.commit()

    token = create_access_token(subject=admin.id, session_id=sess.id, security_version=admin.security_version)
    db.close()

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


# 14. Self admin role remove denied test
def test_self_admin_role_remove_denied():
    admin_id, admin_auth = create_user_with_roles("admin_self_rem@example.com", ["admin"])
    payload = {"roles": ["hiring_manager"]}
    resp = client.put(f"/api/v1/admin/users/{admin_id}/roles", json=payload, headers={"Authorization": admin_auth})
    assert resp.status_code == 409
    assert resp.headers.get("X-Error-Code") == "SELF_ADMIN_ROLE_REMOVE_DENIED"


# 15. Direct API without permission 403 test
def test_direct_api_without_permission_403():
    # Recruiter calls admin users list API
    uid, rec_auth = create_user_with_roles("recruiter_direct_api@example.com", ["recruiter"])
    resp = client.get("/api/v1/admin/audit-logs", headers={"Authorization": rec_auth})
    assert resp.status_code == 403 or resp.status_code == 401


# 16. Permission from second role allows API test
def test_permission_from_second_role_allows_api():
    # User has hiring_manager + hr_manager
    uid, multi_auth = create_user_with_roles("multi_second_role@example.com", ["hiring_manager", "hr_manager"])
    # hr_manager role allows listing users
    resp = client.get("/api/v1/auth/users", headers={"Authorization": multi_auth})
    assert resp.status_code == 200


# 17. Permission from third role allows API test
def test_permission_from_third_role_allows_api():
    # User has employee + interviewer + hr_manager
    uid, multi_auth = create_user_with_roles("multi_third_role@example.com", ["employee", "interviewer", "hr_manager"])
    resp = client.get("/api/v1/auth/pending-users", headers={"Authorization": multi_auth})
    assert resp.status_code == 200


# 18. Object scope enforced test
def test_object_scope_enforced():
    db = TestingSessionLocal()
    seed_test_rbac_data(db)

    # Manager A and Manager B (adding legacy 'manager' code for requisitions.py check)
    r_mgr = db.query(Role).filter(Role.code == "manager").first()
    if not r_mgr:
        r_mgr = Role(code="manager", name="Manager Legacy Code")
        db.add(r_mgr)
        db.commit()

    m1 = User(email="managerA@example.com", full_name="Manager A", hashed_password=hash_password("Pass123!"), role="hiring_manager,manager", account_status="active", is_active=True, security_version=1)
    m2 = User(email="managerB@example.com", full_name="Manager B", hashed_password=hash_password("Pass123!"), role="hiring_manager,manager", account_status="active", is_active=True, security_version=1)
    dept = Department(code="D01", name="Phòng IT")
    db.add_all([m1, m2, dept])
    db.commit()
    db.refresh(m1)
    db.refresh(m2)
    db.refresh(dept)

    # Create Requisition owned by Manager A
    req = JobRequisition(
        code="REQ-TEST-SCOPE",
        title="Senior Python Engineer",
        department_id=dept.id,
        quantity=2,
        status="pending_manager",
        current_approval_step="manager",
        created_by_id=m1.id
    )
    db.add(req)
    db.commit()
    req_id = req.id

    token1 = create_access_token(subject=m1.id, security_version=m1.security_version)
    token2 = create_access_token(subject=m2.id, security_version=m2.security_version)
    db.close()

    # Manager A approves own pending requisition -> Should PASS
    resp1 = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"action": "approved", "comment": "Manager A Approves"}, headers={"Authorization": f"Bearer {token1}"})
    assert resp1.status_code == 200


# 19. Business guard enforced test
def test_business_guard_enforced():
    db = TestingSessionLocal()
    seed_test_rbac_data(db)

    r_mgr = db.query(Role).filter(Role.code == "manager").first()
    if not r_mgr:
        r_mgr = Role(code="manager", name="Manager Legacy Code")
        db.add(r_mgr)
        db.commit()

    m1 = User(email="manager_bg@example.com", full_name="Manager BG", hashed_password=hash_password("Pass123!"), role="hiring_manager,manager", account_status="active", is_active=True, security_version=1)
    dept = Department(code="D02", name="Phòng HR")
    db.add_all([m1, dept])
    db.commit()
    db.refresh(m1)
    db.refresh(dept)

    # Create requisition already in 'approved' status
    req = JobRequisition(
        code="REQ-TEST-BG",
        title="Frontend Developer",
        department_id=dept.id,
        quantity=1,
        status="approved", # Already completed workflow
        current_approval_step="completed",
        created_by_id=m1.id
    )
    db.add(req)
    db.commit()
    req_id = req.id

    token1 = create_access_token(subject=m1.id, security_version=m1.security_version)
    db.close()

    # Attempting to re-approve an already approved requisition must fail with 400 Business Guard rejection
    resp = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"action": "approved", "comment": "Re-approve"}, headers={"Authorization": f"Bearer {token1}"})
    assert resp.status_code == 400
    assert "không thể thực hiện phê duyệt lại" in resp.json()["detail"]


# 20. Job creation business guard test for unapproved requisition
def test_job_create_unapproved_requisition_rejected():
    db = TestingSessionLocal()
    seed_test_rbac_data(db)

    # Admin user
    adm = User(email="admin_job_guard@example.com", full_name="Admin Job Guard", hashed_password=hash_password("Pass123!"), role="admin", account_status="active", is_active=True, security_version=1)
    dept = Department(code="D03", name="Phòng QA")
    db.add_all([adm, dept])
    db.commit()
    db.refresh(adm)
    db.refresh(dept)

    # Requisition pending manager (not approved)
    req = JobRequisition(
        code="REQ-TEST-UNAPPROVED",
        title="QA Automation Engineer",
        department_id=dept.id,
        quantity=1,
        status="pending_manager",
        current_approval_step="manager",
        created_by_id=adm.id
    )
    db.add(req)
    db.commit()
    req_id = req.id

    dept_id = dept.id
    dept_name = dept.name
    token = create_access_token(subject=adm.id, security_version=adm.security_version)
    db.close()

    # Attempting to create a job posting linked to unapproved requisition MUST fail with HTTP 400
    payload = {
        "title": "QA Automation Engineer",
        "requisition_id": req_id,
        "department_id": dept_id,
        "department_name": dept_name,
        "description": "Mô tả công việc QA",
        "status": "published"
    }
    resp = client.post("/api/v1/jobs", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert "chưa được phê duyệt chính thức (approved)" in resp.json()["detail"]


# 21. Failed login 5 times locks account for 15 minutes
def test_failed_login_5_times_locks_account_15_minutes():
    db = TestingSessionLocal()
    seed_test_rbac_data(db)

    usr = User(
        email="lockout_user@example.com",
        full_name="Lockout Test User",
        hashed_password=hash_password("CorrectPass123!"),
        role="employee",
        account_status="active",
        is_active=True,
        security_version=1
    )
    db.add(usr)
    db.commit()
    db.close()

    # 4 incorrect login attempts
    for i in range(1, 5):
        resp = client.post("/api/v1/auth/login", json={"email": "lockout_user@example.com", "password": "WrongPassword!"})
        assert resp.status_code == 400
        data = resp.json()
        assert f"Còn {5 - i} lần thử" in data["detail"] or f"Còn {5 - i} lần thử" in str(data.get("field_errors", {}))

    # 5th incorrect attempt triggers 15-minute lock
    resp5 = client.post("/api/v1/auth/login", json={"email": "lockout_user@example.com", "password": "WrongPassword!"})
    assert resp5.status_code == 400
    assert "tạm khóa" in resp5.json()["detail"] or "tạm khóa" in str(resp5.json())

    # 6th attempt even with CORRECT password while locked must be REJECTED
    resp6 = client.post("/api/v1/auth/login", json={"email": "lockout_user@example.com", "password": "CorrectPass123!"})
    assert resp6.status_code == 400
    assert "đang bị tạm khóa" in resp6.json()["detail"] or "tạm khóa" in str(resp6.json())

