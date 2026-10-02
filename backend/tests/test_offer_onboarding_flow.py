from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, Base, engine
from app.models.user import User
from app.core.security import hash_password, create_access_token

client = TestClient(app)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())

    admin = db.query(User).filter(User.email == "admin_offer_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_offer_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin Offer Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    return admin

def test_offer_onboarding_flow():
    admin = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup Dept, Job, and Application
    dept_resp = client.get("/api/v1/hr/departments", headers=headers_admin)
    if dept_resp.status_code == 200 and len(dept_resp.json()) > 0:
        dept_id = dept_resp.json()[0]["id"]
    else:
        create_dept = client.post(
            "/api/v1/hr/departments",
            json={"name": "Khối Sản Phẩm", "code": "PROD-OFFER-TEST", "sort_order": 1, "is_active": True},
            headers=headers_admin
        )
        dept_id = create_dept.json()["id"]

    job_res = client.post(
        "/api/v1/jobs",
        json={
            "title": "Senior Product Manager",
            "department_id": dept_id,
            "quantity": 1,
            "min_salary": 35000000,
            "max_salary": 55000000,
            "work_location": "Hồ Chí Minh",
            "employment_type": "full_time",
            "job_description": "Quản lý chiến lược sản phẩm B2B SaaS",
            "status": "published"
        },
        headers=headers_admin
    )
    job_id = job_res.json()["id"]

    app_res = client.post(
        "/api/v1/applications",
        json={
            "job_id": job_id,
            "full_name": "Phạm Minh Anh",
            "email": "minhanh.pham@company.com",
            "phone": "0912345678",
            "cv_url": "https://storage.company.com/cvs/minhanh_pm.pdf",
            "cover_letter": "5 năm kinh nghiệm quản lý sản phẩm tuyển dụng"
        }
    )
    app_id = app_res.json()["id"]

    # 2. HR Creates Job Offer Letter
    now = datetime.utcnow()
    start_date = (now + timedelta(days=14)).isoformat()
    expiration_date = (now + timedelta(days=7)).isoformat()

    offer_payload = {
        "application_id": app_id,
        "position_title": "Senior Product Manager",
        "offered_salary": 45000000.0,
        "start_date": start_date,
        "probation_period_months": 2,
        "work_location": "Hồ Chí Minh",
        "expiration_date": expiration_date,
        "notes": "Hưởng 85% lương trong thời gian thử việc."
    }

    create_off = client.post("/api/v1/offers", json=offer_payload, headers=headers_admin)
    assert create_off.status_code == 201
    offer_data = create_off.json()
    assert offer_data["status"] == "sent"
    assert offer_data["code"].startswith("OFR-")
    offer_id = offer_data["id"]

    # Fetch application offer
    get_offer = client.get(f"/api/v1/applications/{app_id}/offer", headers=headers_admin)
    assert get_offer.status_code == 200
    assert get_offer.json()["id"] == offer_id

    # 3. Candidate Accepts Offer -> Triggers Onboarding Checklist & updates stage to 'hired'
    accept_res = client.post(
        f"/api/v1/offers/{offer_id}/status",
        json={"status": "accepted", "notes": "Ứng viên xác nhận nhận việc qua email."},
        headers=headers_admin
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # Verify Onboarding checklist auto created
    onboard_list = client.get("/api/v1/onboarding/manage/all", headers=headers_admin)
    assert onboard_list.status_code == 200
    onboarding_items = onboard_list.json()["items"]
    assert len(onboarding_items) >= 1
    target_ob = next(ob for ob in onboarding_items if ob["application_id"] == app_id)
    assert target_ob["status"] == "in_progress"

    # 4. HR Completes Onboarding Tasks
    ob_id = target_ob["id"]
    update_ob = client.put(
        f"/api/v1/onboarding/{ob_id}",
        json={
            "welcome_email_sent": True,
            "equipment_prepared": True,
            "account_created": True,
            "documents_submitted": True,
            "orientation_scheduled": True
        },
        headers=headers_admin
    )
    assert update_ob.status_code == 200
    assert update_ob.json()["status"] == "completed"

    print("Offer management & onboarding checklist flow test PASSED successfully!")

if __name__ == "__main__":
    test_offer_onboarding_flow()
