from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User


client = TestClient(app)


def admin_headers():
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "feature-admin@company.com").first()
    if not admin:
        admin = User(
            email="feature-admin@company.com",
            hashed_password=hash_password("Admin12345"),
            full_name="Feature Admin",
            role="admin",
            is_active=True,
            account_status="active",
        )
        db.add(admin)
        db.commit()
    db.close()
    login = client.post("/api/v1/auth/login", json={"email": "feature-admin@company.com", "password": "Admin12345"})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_settings_jobs_and_audit_flow():
    headers = admin_headers()

    settings = client.get("/api/v1/admin/settings", headers=headers)
    assert settings.status_code == 200
    updated = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={
            "company_name": "Test Recruitment",
            "allow_registration": True,
            "require_approval": True,
            "email_notifications": False,
            "session_timeout": 120,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["company_name"] == "Test Recruitment"

    department = client.post(
        "/api/v1/hr/departments",
        headers=headers,
        json={"name": "Phòng Kiểm thử", "code": "QA-TEST", "sort_order": 0},
    )
    assert department.status_code == 201

    created = client.post(
        "/api/v1/jobs",
        headers=headers,
        json={
            "title": "QA Engineer",
            "department_id": department.json()["id"],
            "quantity": 2,
            "work_location": "Hà Nội",
            "employment_type": "full_time",
            "status": "draft",
        },
    )
    assert created.status_code == 201
    job_id = created.json()["id"]

    managed = client.get("/api/v1/jobs/manage/all", headers=headers)
    assert managed.status_code == 200
    assert any(item["id"] == job_id for item in managed.json()["items"])

    published = client.post(f"/api/v1/jobs/{job_id}/publish", headers=headers)
    assert published.status_code == 200
    public = client.get("/api/v1/jobs")
    assert public.status_code == 200
    assert any(item["id"] == job_id for item in public.json()["items"])

    logs = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert logs.status_code == 200
    assert any(item["module"] == "Tin tuyển dụng" for item in logs.json())
