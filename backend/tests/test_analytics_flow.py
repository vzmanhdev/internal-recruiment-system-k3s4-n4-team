from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, Base, engine
from app.models.user import User
from app.core.security import hash_password, create_access_token

client = TestClient(app)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())

    admin = db.query(User).filter(User.email == "admin_analytics_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_analytics_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin Analytics Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    return admin

def test_analytics_flow():
    admin = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. GET /api/v1/analytics/overview
    ov_res = client.get("/api/v1/analytics/overview", headers=headers_admin)
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert "total_requisitions" in ov_data
    assert "total_jobs" in ov_data
    assert "conversion_rate_pct" in ov_data
    assert "total_bonus_paid_vnd" in ov_data

    # 2. GET /api/v1/analytics/funnel
    funnel_res = client.get("/api/v1/analytics/funnel", headers=headers_admin)
    assert funnel_res.status_code == 200
    funnel_data = funnel_res.json()
    assert len(funnel_data) == 6  # 6 stages

    # 3. GET /api/v1/analytics/by-department
    dept_res = client.get("/api/v1/analytics/by-department", headers=headers_admin)
    assert dept_res.status_code == 200
    dept_data = dept_res.json()
    assert isinstance(dept_data, list)

    # 4. GET /api/v1/analytics/referrals
    ref_res = client.get("/api/v1/analytics/referrals", headers=headers_admin)
    assert ref_res.status_code == 200
    ref_data = ref_res.json()
    assert "total_referrals" in ref_data
    assert "top_referrers" in ref_data

    print("Recruitment Analytics & Reporting flow test PASSED successfully!")

if __name__ == "__main__":
    test_analytics_flow()
