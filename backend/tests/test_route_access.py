"""Route/workspace authorization (MASTER prompt phases 2, 3, 9, 12).

Every assertion goes through the real API with the production RBAC seed matrix
(app/db/rbac_catalog.py) in an isolated SQLite database.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.main import app
from app.db.session import Base
from app.db.rbac_catalog import ROLES_DATA, PERMISSIONS_DATA, DEFAULT_GRANTED_MATRIX
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission
from app.core.security import hash_password

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


HR = {"workspace": "hr", "all": "workspace:hr:access"}
HR_REQUISITIONS = {"workspace": "hr", "all": "workspace:hr:access,requisition:view"}
APPROVER = {"workspace": "approver", "all": "workspace:approver:access"}
ADMIN_USERS = {"workspace": "admin", "all": "workspace:admin:access,user:view"}


@pytest.fixture(autouse=True)
def world():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    roles = {}
    for r in ROLES_DATA:
        roles[r["code"]] = Role(code=r["code"], name=r["name"])
        db.add(roles[r["code"]])
    for p in PERMISSIONS_DATA:
        db.add(Permission(code=p["code"], name=p["name"], module=p["module"]))
    for role_code in [r["code"] for r in ROLES_DATA]:
        granted = DEFAULT_GRANTED_MATRIX.get(role_code, [])
        for p in PERMISSIONS_DATA:
            db.add(RolePermission(role_code=role_code, permission_code=p["code"],
                                  is_granted=role_code == "admin" or p["code"] in granted))
    db.commit()

    def mk(email, *codes):
        u = User(email=email, full_name=email.split("@")[0], hashed_password=hash_password("Password123"),
                 role=",".join(codes), is_active=True, account_status="active", security_version=1)
        db.add(u)
        db.flush()
        for c in codes:
            db.add(UserRole(user_id=u.id, role_id=roles[c].id))
        db.commit()
        return u.id

    ids = {
        "admin": mk("admin@example.com", "admin"),
        "approver": mk("approver@example.com", "approver"),
        "approver_hr": mk("approverhr@example.com", "approver", "hr_manager"),
        "approver_int": mk("approverint@example.com", "approver", "interviewer"),
        "triple": mk("triple@example.com", "approver", "hr_manager", "interviewer"),
    }
    db.close()
    yield ids
    Base.metadata.drop_all(bind=engine)


def login(email):
    c = TestClient(app)
    r = c.post("/api/v1/auth/login", json={"email": email, "password": "Password123"})
    assert r.status_code == 200, r.text
    c.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
    return c, r


def check(c, params, header=True):
    if not header:
        saved = c.headers.pop("Authorization", None)
        try:
            return c.get("/api/v1/auth/route-access", params=params)
        finally:
            if saved:
                c.headers["Authorization"] = saved
    return c.get("/api/v1/auth/route-access", params=params)


def test_unauthenticated_route_check_is_401():
    r = TestClient(app).get("/api/v1/auth/route-access", params=HR)
    assert r.status_code == 401 and r.json()["error"]["code"] == "NOT_AUTHENTICATED"


def test_scenario_a_approver_only_is_denied_hr_with_vietnamese_403(world):
    c, _ = login("approver@example.com")
    r = check(c, HR)
    assert r.status_code == 403
    body = r.json()
    assert body["error"]["code"] == "HR_WORKSPACE_ACCESS_DENIED"
    assert body["error"]["message"].startswith("Bạn không có quyền truy cập khu vực Quản lý Nhân sự")
    assert body["request_id"]
    assert check(c, APPROVER).status_code == 200
    # backend HR-only business API is denied on its own (not only the page)
    assert c.get("/api/v1/hr/headcounts").status_code == 403
    # a 403 never ends the session
    assert c.get("/api/v1/auth/me").status_code == 200


def test_scenario_b_union_of_roles(world):
    c, _ = login("approverhr@example.com")
    assert check(c, HR).status_code == 200
    assert check(c, HR_REQUISITIONS).status_code == 200
    assert check(c, APPROVER).status_code == 200
    perms = c.get("/api/v1/auth/me").json()["permissions"]
    assert len(perms) == len(set(perms))  # deduplicated union
    assert {"workspace:hr:access", "workspace:approver:access", "requisition:approve"} <= set(perms)


@pytest.mark.parametrize("email,expected", [
    ("approverint@example.com", {"workspace:approver:access", "workspace:interviewer:access"}),
    ("triple@example.com", {"workspace:approver:access", "workspace:interviewer:access", "workspace:hr:access"}),
])
def test_multi_role_union_includes_every_workspace(world, email, expected):
    c, _ = login(email)
    assert expected <= set(c.get("/api/v1/auth/me").json()["permissions"])


def test_scenario_c_role_removal_takes_effect_on_next_request_without_relogin(world):
    user, _ = login("approverhr@example.com")
    assert check(user, HR).status_code == 200
    admin, _ = login("admin@example.com")
    r = admin.put(f"/api/v1/admin/users/{world['approver_hr']}/roles", json={"roles": ["approver"]})
    assert r.status_code == 200, r.text
    # same token, next request: HR denied, approver still allowed, session still valid
    assert check(user, HR).status_code == 403
    assert user.get("/api/v1/hr/headcounts").status_code == 403
    assert check(user, APPROVER).status_code == 200
    me = user.get("/api/v1/auth/me")
    assert me.status_code == 200 and "workspace:hr:access" not in me.json()["permissions"]


def test_permission_matrix_change_is_immediate_and_validated(world):
    user, _ = login("approver@example.com")
    admin, _ = login("admin@example.com")
    assert check(user, APPROVER).status_code == 200
    r = admin.put("/api/v1/admin/permissions/matrix",
                  json={"role_code": "approver", "permission_code": "workspace:approver:access", "is_granted": False})
    assert r.status_code == 200, r.text
    assert check(user, APPROVER).status_code == 403
    bad = admin.put("/api/v1/admin/permissions/matrix",
                    json={"role_code": "approver", "permission_code": "workspace:nope:access", "is_granted": True})
    assert bad.status_code == 422 and bad.json()["error"]["code"] == "UNKNOWN_PERMISSION"
    immutable = admin.put("/api/v1/admin/permissions/matrix",
                          json={"role_code": "admin", "permission_code": "user:view", "is_granted": False})
    assert immutable.status_code == 400 and immutable.json()["error"]["code"] == "ADMIN_PERMISSION_IMMUTABLE"


def test_scenario_d_admin_full_allow(world):
    c, _ = login("admin@example.com")
    for params in (HR, HR_REQUISITIONS, APPROVER, ADMIN_USERS, {"all": "anything:unknown"}):
        assert check(c, params).status_code == 200
    perms = set(c.get("/api/v1/auth/me").json()["permissions"])
    assert {p["code"] for p in PERMISSIONS_DATA} <= perms


def test_non_admin_default_deny_for_unknown_permission(world):
    c, _ = login("triple@example.com")
    assert check(c, {"all": "workspace:secret:access"}).status_code == 403
    assert check(c, {"any": "audit:view,permission:manage"}).status_code == 403
    assert check(c, {"all": "workspace:approver:access", "any": "requisition:approve,offer:approve"}).status_code == 200


def test_cookie_is_set_on_login_and_route_check_works_without_header(world):
    c, resp = login("approver@example.com")
    assert "ats_access" in resp.cookies
    assert check(c, APPROVER, header=False).status_code == 200
    assert check(c, HR, header=False).status_code == 403


def test_logout_revokes_route_access_even_with_the_cookie(world):
    c, resp = login("approver@example.com")
    cookie = resp.cookies["ats_access"]
    assert c.post("/api/v1/auth/logout").status_code == 200
    stale = TestClient(app)
    stale.cookies.set("ats_access", cookie)
    r = stale.get("/api/v1/auth/route-access", params=APPROVER)
    assert r.status_code == 401 and r.json()["error"]["code"] == "SESSION_REVOKED"


def test_locked_account_is_rejected_by_route_check(world):
    c, _ = login("approver@example.com")
    admin, _ = login("admin@example.com")
    assert admin.post(f"/api/v1/admin/users/{world['approver']}/lock", json={"reason": "Kiểm thử khóa"}).status_code == 200
    r = check(c, APPROVER)
    assert r.status_code == 401


def test_forged_cookie_is_rejected():
    c = TestClient(app)
    c.cookies.set("ats_access", "not-a-jwt")
    assert c.get("/api/v1/auth/route-access", params=APPROVER).status_code == 401


def test_permission_matrix_rejects_unknown_role(world):
    admin, _ = login("admin@example.com")
    r = admin.put("/api/v1/admin/permissions/matrix",
                  json={"role_code": "ghost_role", "permission_code": "user:view", "is_granted": True})
    assert r.status_code == 422 and r.json()["error"]["code"] == "UNKNOWN_ROLE"


def test_requisition_reminder_notifies_current_step_once_per_day(world):
    from app.models.hr import Department
    from app.models.requisition import JobRequisition
    from app.models.notification import Notification
    db = TestingSessionLocal()
    dept = Department(code="IT", name="IT"); db.add(dept); db.commit()
    req = JobRequisition(code="REQ-R-1", title="Dev", department_id=dept.id, quantity=1, status="pending_hr",
                         current_approval_step="hr", created_by_id=world["approver_hr"])
    db.add(req); db.commit(); rid = req.id; db.close()
    owner, _ = login("approverhr@example.com")
    other, _ = login("triple@example.com")
    assert other.post(f"/api/v1/requisitions/{rid}/remind").status_code == 403   # not the creator
    first = owner.post(f"/api/v1/requisitions/{rid}/remind")
    assert first.status_code == 200 and first.json()["sent"] >= 1                 # triple is an hr_manager
    assert owner.post(f"/api/v1/requisitions/{rid}/remind").status_code == 409     # once per day
    db = TestingSessionLocal()
    assert db.query(Notification).filter(Notification.recipient_id == world["triple"], Notification.type == "approval_pending").count() == 1
    db.close()
