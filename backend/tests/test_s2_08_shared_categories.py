"""Tests for User Story SCRUM-53 (S2-08):
Là Trưởng phòng Nhân sự, tôi muốn khai báo các danh mục dùng chung của tuyển dụng,
để thống nhất cách gọi tên nguồn ứng viên và lý do loại giữa các recruiter.

Acceptance Criteria:
- S2-08-AC01: Nguồn ứng viên, lý do loại, địa điểm làm việc, hình thức làm việc.
- S2-08-AC02: Giá trị đang được tham chiếu thì không xoá và không đổi tên được.
- S2-08-AC03: Sắp xếp được thứ tự hiển thị (sort_order / reorder).
- Subtasks SCRUM-227, SCRUM-230, SCRUM-231: Search, usage counting, integrity validation.
"""
from datetime import date, datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.main import app
from app.db.session import Base
from app.db.seed_rbac import ROLES_DATA, PERMISSIONS_DATA, DEFAULT_GRANTED_MATRIX
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission
from app.models.hr import Department, JobTitle, SharedCategory
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.application import JobApplication
from app.core.security import hash_password
from tests.conftest import session_token

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def ctx():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    roles = {r["code"]: Role(code=r["code"], name=r["name"]) for r in ROLES_DATA}
    db.add_all(roles.values())
    for p in PERMISSIONS_DATA:
        db.add(Permission(code=p["code"], name=p["name"], module=p["module"]))
    for role_code, granted in DEFAULT_GRANTED_MATRIX.items():
        for p in PERMISSIONS_DATA:
            db.add(RolePermission(role_code=role_code, permission_code=p["code"], is_granted=p["code"] in granted))
    db.commit()

    users = {}
    for key, role in [("hrm", "hr_manager"), ("hm", "hiring_manager"), ("recruiter", "recruiter"), ("candidate", "candidate")]:
        u = User(
            email=f"{key}@company.com",
            full_name=key.upper(),
            hashed_password=hash_password("Password123"),
            role=role,
            is_active=True,
            account_status="active",
            security_version=1,
        )
        db.add(u)
        db.flush()
        db.add(UserRole(user_id=u.id, role_id=roles[role].id))
        users[key] = u

    dept = Department(code="HRD", name="Nhân sự")
    db.add(dept)
    db.commit()

    user_ids = {k: u.id for k, u in users.items()}
    dept_id = dept.id
    tokens = {k: session_token(db, u) for k, u in users.items()}
    db.close()
    out = {
        "h": {k: {"Authorization": f"Bearer {tok}"} for k, tok in tokens.items()},
        "user_ids": user_ids,
        "dept_id": dept_id,
    }
    yield out
    Base.metadata.drop_all(bind=engine)


# -----------------------------------------------------------------------------
# AC1: Khai báo danh mục dùng chung (CRUD + Types)
# -----------------------------------------------------------------------------
def test_create_and_list_all_category_types(ctx):
    """AC1: Hỗ trợ các loại danh mục: candidate_source, rejection_reason, work_location, work_type."""
    headers = ctx["h"]["hrm"]

    types_and_samples = [
        ("candidate_source", "LinkedIn Talent"),
        ("rejection_reason", "Không đạt phỏng vấn chuyên môn"),
        ("work_location", "Văn phòng Hà Nội - Tòa Keangnam"),
        ("work_type", "Hybrid (Linh hoạt)"),
        ("contract_type", "Hợp đồng thử việc 2 tháng"),
    ]

    for cat_type, name in types_and_samples:
        res = client.post("/api/v1/hr/categories", headers=headers, json={
            "category_type": cat_type,
            "name": name,
            "sort_order": 1,
        })
        assert res.status_code == 201, f"Failed for {cat_type}: {res.text}"
        data = res.json()
        assert data["category_type"] == cat_type
        assert data["name"] == name
        assert data["is_active"] is True

    # Test duplicate name within same category_type is rejected with 409
    dup = client.post("/api/v1/hr/categories", headers=headers, json={
        "category_type": "candidate_source",
        "name": "LinkedIn Talent",
        "sort_order": 2,
    })
    assert dup.status_code == 409
    assert "tồn tại" in dup.json()["detail"]


def test_list_and_search_categories(ctx):
    """Subtasks SCRUM-227 / SCRUM-231: Search and type filtering."""
    headers = ctx["h"]["hrm"]

    # Seed items
    client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "candidate_source", "name": "TopCV"})
    client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "candidate_source", "name": "VietnamWorks"})
    client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "candidate_source", "name": "LinkedIn Recruiter"})
    client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "work_location", "name": "Hồ Chí Minh"})

    # Filter by category_type only
    sources = client.get("/api/v1/hr/categories?category_type=candidate_source", headers=headers).json()
    assert len(sources) == 3
    assert all(s["category_type"] == "candidate_source" for s in sources)

    # Filter with search term
    filtered = client.get("/api/v1/hr/categories?category_type=candidate_source&search=Linked", headers=headers).json()
    assert len(filtered) == 1
    assert filtered[0]["name"] == "LinkedIn Recruiter"

    # Search case-insensitive across all types
    search_all = client.get("/api/v1/hr/categories?search=chí minh", headers=headers).json()
    assert len(search_all) == 1
    assert search_all[0]["name"] == "Hồ Chí Minh"


# -----------------------------------------------------------------------------
# AC2: Ràng buộc toàn vẹn khi đang được tham chiếu (Delete & Rename Block)
# -----------------------------------------------------------------------------
def test_cannot_delete_category_in_use_by_job_application(ctx):
    """AC2: Giá trị đang được tham chiếu ở JobApplication thì không xoá được (409)."""
    headers = ctx["h"]["hrm"]

    # Create category
    cat = client.post("/api/v1/hr/categories", headers=headers, json={
        "category_type": "candidate_source",
        "name": "Headhunter Navigos",
    }).json()

    # Before reference: usage_count = 0, in_use = False
    items = client.get(f"/api/v1/hr/categories?category_type=candidate_source&search=Navigos", headers=headers).json()
    assert items[0]["usage_count"] == 0
    assert items[0]["in_use"] is False

    # Create requisition and application referencing this source
    db = TestingSessionLocal()
    req = JobRequisition(
        code="REQ-TEST-001",
        department_id=ctx["dept_id"],
        created_by_id=ctx["user_ids"]["hm"],
        title="Frontend Developer",
        quantity=1,
        target_onboard_date=(date.today() + timedelta(days=30)).isoformat(),
        status="approved",
    )
    db.add(req)
    db.commit()

    posting = JobPosting(
        slug="frontend-dev-navigos",
        requisition_id=req.id,
        department_id=ctx["dept_id"],
        department_name="Nhân sự",
        title="Frontend Dev",
        description="Tuyển frontend dev",
        created_by_id=ctx["user_ids"]["hm"],
        status="published",
    )
    db.add(posting)
    db.commit()

    app_record = JobApplication(
        job_posting_id=posting.id,
        full_name="Nguyễn Văn A",
        email="nguyenvana@gmail.com",
        phone="0912345678",
        source="Headhunter Navigos",
        status="screening",
    )
    db.add(app_record)
    db.commit()
    db.close()

    # After reference: usage_count = 1, in_use = True
    items_after = client.get(f"/api/v1/hr/categories?category_type=candidate_source&search=Navigos", headers=headers).json()
    assert items_after[0]["usage_count"] == 1
    assert items_after[0]["in_use"] is True

    # Attempt to delete referenced category -> Expect 409
    del_res = client.delete(f"/api/v1/hr/categories/{cat['id']}", headers=headers)
    assert del_res.status_code == 409
    assert "tham chiếu" in del_res.json()["detail"]

    # Attempt to rename referenced category -> Expect 409
    ren_res = client.put(f"/api/v1/hr/categories/{cat['id']}", headers=headers, json={
        "name": "Headhunter New Name",
        "is_active": True,
    })
    assert ren_res.status_code == 409
    assert "đổi tên" in ren_res.json()["detail"]

    # Deactivating (stopping application of value) is permitted
    deact_res = client.put(f"/api/v1/hr/categories/{cat['id']}", headers=headers, json={
        "name": "Headhunter Navigos",
        "is_active": False,
    })
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False


def test_cannot_delete_category_in_use_by_job_posting_or_requisition(ctx):
    """AC2: Giá trị đang dùng ở JobPosting (location/type) hoặc Requisition thì không xoá được."""
    headers = ctx["h"]["hrm"]

    loc = client.post("/api/v1/hr/categories", headers=headers, json={
        "category_type": "work_location",
        "name": "Cần Thơ",
    }).json()

    db = TestingSessionLocal()
    req = JobRequisition(
        code="REQ-TEST-002",
        department_id=ctx["dept_id"],
        created_by_id=ctx["user_ids"]["hm"],
        title="Kinh Doanh Miền Tây",
        work_location="Cần Thơ",
        quantity=1,
        target_onboard_date=(date.today() + timedelta(days=20)).isoformat(),
        status="draft",
    )
    db.add(req)
    db.commit()
    db.close()

    # Blocked because requisition references it
    res = client.delete(f"/api/v1/hr/categories/{loc['id']}", headers=headers)
    assert res.status_code == 409


def test_unreferenced_category_can_be_deleted(ctx):
    """AC2: Giá trị chưa được tham chiếu có thể xoá bình thường."""
    headers = ctx["h"]["hrm"]

    item = client.post("/api/v1/hr/categories", headers=headers, json={
        "category_type": "work_location",
        "name": "Địa điểm tạm thời",
    }).json()

    del_res = client.delete(f"/api/v1/hr/categories/{item['id']}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Confirm deletion
    get_res = client.get(f"/api/v1/hr/categories?category_type=work_location&search=tạm thời", headers=headers)
    assert get_res.json() == []


# -----------------------------------------------------------------------------
# AC3: Sắp xếp thứ tự hiển thị (sort_order / reorder)
# -----------------------------------------------------------------------------
def test_reorder_categories(ctx):
    """AC3: Sắp xếp được thứ tự hiển thị danh mục."""
    headers = ctx["h"]["hrm"]

    c1 = client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "rejection_reason", "name": "Lý do 1"}).json()
    c2 = client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "rejection_reason", "name": "Lý do 2"}).json()
    c3 = client.post("/api/v1/hr/categories", headers=headers, json={"category_type": "rejection_reason", "name": "Lý do 3"}).json()

    # Reorder to [c3, c1, c2]
    reorder_res = client.put("/api/v1/hr/categories/reorder", headers=headers, json={
        "ids": [c3["id"], c1["id"], c2["id"]]
    })
    assert reorder_res.status_code == 200

    # Fetch list and verify sort order
    reasons = client.get("/api/v1/hr/categories?category_type=rejection_reason", headers=headers).json()
    ordered_names = [r["name"] for r in reasons if r["id"] in {c1["id"], c2["id"], c3["id"]}]
    assert ordered_names == ["Lý do 3", "Lý do 1", "Lý do 2"]


# -----------------------------------------------------------------------------
# RBAC: Chỉ HR Manager & Admin được sửa đổi danh mục
# -----------------------------------------------------------------------------
def test_candidate_and_hm_cannot_manage_categories(ctx):
    """Phân quyền: Hiring Manager và Candidate không có quyền sửa đổi danh mục."""
    # Candidate attempt
    cand_res = client.post("/api/v1/hr/categories", headers=ctx["h"]["candidate"], json={
        "category_type": "candidate_source",
        "name": "Hack Attempt",
    })
    assert cand_res.status_code in (401, 403)

    # HM attempt to delete
    cat = client.post("/api/v1/hr/categories", headers=ctx["h"]["hrm"], json={
        "category_type": "candidate_source",
        "name": "HR Created",
    }).json()

    hm_del = client.delete(f"/api/v1/hr/categories/{cat['id']}", headers=ctx["h"]["hm"])
    assert hm_del.status_code in (401, 403)


# -----------------------------------------------------------------------------
# SCRUM-227: Pagination & is_active Filtering
# -----------------------------------------------------------------------------
def test_pagination_and_is_active_filter(ctx):
    """Subtask SCRUM-227: Phân trang và lọc theo trạng thái is_active."""
    headers = ctx["h"]["hrm"]

    # Create 5 items, 3 active, 2 inactive
    for i in range(1, 4):
        client.post("/api/v1/hr/categories", headers=headers, json={
            "category_type": "tag",
            "name": f"Tag Active {i}",
            "is_active": True,
        })
    for i in range(4, 6):
        client.post("/api/v1/hr/categories", headers=headers, json={
            "category_type": "tag",
            "name": f"Tag Inactive {i}",
            "is_active": False,
        })

    # Test is_active=true filter
    res_active = client.get("/api/v1/hr/categories?category_type=tag&is_active=true", headers=headers).json()
    assert len(res_active) == 3
    assert all(x["is_active"] is True for x in res_active)

    # Test is_active=false filter
    res_inactive = client.get("/api/v1/hr/categories?category_type=tag&is_active=false", headers=headers).json()
    assert len(res_inactive) == 2
    assert all(x["is_active"] is False for x in res_inactive)

    # Test pagination: page=1, page_size=2
    res_page1 = client.get("/api/v1/hr/categories?category_type=tag&page=1&page_size=2", headers=headers).json()
    assert res_page1["total"] == 5
    assert res_page1["page"] == 1
    assert res_page1["page_size"] == 2
    assert res_page1["total_pages"] == 3
    assert len(res_page1["items"]) == 2

    # Test pagination: page=3, page_size=2
    res_page3 = client.get("/api/v1/hr/categories?category_type=tag&page=3&page_size=2", headers=headers).json()
    assert len(res_page3["items"]) == 1


# -----------------------------------------------------------------------------
# AC2: ApprovalFlow Reference Checking
# -----------------------------------------------------------------------------
def test_cannot_delete_or_rename_approval_type_in_use_by_approval_flow(ctx):
    """AC2: Loại luồng phê duyệt đang được tham chiếu bởi ApprovalFlow thì không thể xóa hoặc đổi tên."""
    headers = ctx["h"]["hrm"]

    # Create approval_type category
    cat = client.post("/api/v1/hr/categories", headers=headers, json={
        "category_type": "approval_type",
        "name": "Tuyển dụng tiêu chuẩn",
    }).json()

    # Link an ApprovalFlow to it
    from app.models.hr import ApprovalFlow
    db = TestingSessionLocal()
    flow = ApprovalFlow(
        name="Luồng phê duyệt tiêu chuẩn",
        approval_type="job_requisition",
        status="active",
        min_salary_threshold=0,
        max_salary_threshold=50000000,
    )
    db.add(flow)
    db.commit()
    db.close()

    # Verify usage_count >= 1 and in_use is True
    items = client.get("/api/v1/hr/categories?category_type=approval_type&search=tiêu chuẩn", headers=headers).json()
    assert len(items) == 1
    assert items[0]["in_use"] is True
    assert items[0]["usage_count"] >= 1

    # Attempt to delete -> 409 Conflict
    del_res = client.delete(f"/api/v1/hr/categories/{cat['id']}", headers=headers)
    assert del_res.status_code == 409
    assert "tham chiếu" in del_res.json()["detail"]

    # Attempt to rename -> 409 Conflict
    ren_res = client.put(f"/api/v1/hr/categories/{cat['id']}", headers=headers, json={
        "name": "Tuyển dụng đổi tên",
        "is_active": True
    })
    assert ren_res.status_code == 409
    assert "đổi tên" in ren_res.json()["detail"]

