from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User


client = TestClient(app)


def ensure_user(email: str, role: str) -> User:
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("RoleTest123"),
            full_name=f"Role test {role}",
            role=role,
            is_active=True,
            account_status="active",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user


def auth_headers(email: str) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "RoleTest123"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_hr_manager_can_access_recruitment_workspace_and_candidate_cannot():
    ensure_user("hr-access@example.com", "hr_manager")
    ensure_user("candidate-access@example.com", "candidate")
    hr_headers = auth_headers("hr-access@example.com")
    candidate_headers = auth_headers("candidate-access@example.com")

    protected_paths = [
        "/api/v1/hr/departments",
        "/api/v1/requisitions",
        "/api/v1/jobs/manage/all",
        "/api/v1/applications/manage/all",
        "/api/v1/interviews/manage/all",
        "/api/v1/offers/manage/all",
        "/api/v1/onboarding/manage/all",
        "/api/v1/analytics/overview",
        "/api/v1/hr/company-content",
    ]

    for path in protected_paths:
        assert client.get(path, headers=hr_headers).status_code == 200, path
        assert client.get(path, headers=candidate_headers).status_code == 403, path

    content = client.put(
        "/api/v1/hr/company-content",
        headers=hr_headers,
        json={"title": "Cơ hội phát triển nội bộ", "body": "Nội dung tuyển dụng được xuất bản bởi Trưởng phòng nhân sự.", "image": None},
    )
    assert content.status_code == 200, content.text
    public_content = client.get("/api/v1/hr/company-content/public")
    assert public_content.status_code == 200
    assert public_content.json()["title"] == "Cơ hội phát triển nội bộ"
