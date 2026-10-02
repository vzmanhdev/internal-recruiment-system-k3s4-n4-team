from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, Base, engine
from app.models.user import User
from app.core.security import hash_password, create_access_token

client = TestClient(app)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    admin = db.query(User).filter(User.email == "admin_app_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_app_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin App Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    return admin

def test_application_flow():
    admin = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Get or create Department & Job Posting
    dept_resp = client.get("/api/v1/hr/departments", headers=headers_admin)
    if dept_resp.status_code == 200 and len(dept_resp.json()) > 0:
        dept_id = dept_resp.json()[0]["id"]
    else:
        create_dept = client.post(
            "/api/v1/hr/departments",
            json={"name": "Khối Nhân Sự", "code": "HR-APP-TEST", "sort_order": 1, "is_active": True},
            headers=headers_admin
        )
        assert create_dept.status_code == 201
        dept_id = create_dept.json()["id"]

    job_res = client.post(
        "/api/v1/jobs",
        json={
            "title": "Senior Talent Acquisition Specialist",
            "department_id": dept_id,
            "quantity": 1,
            "min_salary": 18000000,
            "max_salary": 25000000,
            "work_location": "Hà Nội",
            "employment_type": "full_time",
            "job_description": "Tuyển dụng nhân sự chất lượng cao cho các khối nghiệp vụ",
            "status": "published"
        },
        headers=headers_admin
    )
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # 2. Candidate Submits Application (Public API)
    app_payload = {
        "job_id": job_id,
        "full_name": "Nguyễn Văn Đạt",
        "email": "vandat.candidate@company.com",
        "phone": "0987654321",
        "cv_url": "https://storage.company.com/cvs/vandat_cv.pdf",
        "cover_letter": "Tôi có 4 năm kinh nghiệm tuyển dụng IT/SaaS",
        "current_department": "Khối Vận hành",
        "referral_code": "REF-1002"
    }

    submit_res = client.post("/api/v1/applications", json=app_payload)
    assert submit_res.status_code == 201
    app_data = submit_res.json()
    assert app_data["status"] == "applied"
    assert app_data["code"].startswith("APP-")
    app_id = app_data["id"]

    # 3. HR Views Applications List
    hr_list = client.get("/api/v1/applications/manage/all?status=applied", headers=headers_admin)
    assert hr_list.status_code == 200
    items = hr_list.json()["items"]
    assert any(a["id"] == app_id for a in items)

    # 4. HR Stage Pipeline Transitions
    # Move to Screening
    stg1 = client.post(f"/api/v1/applications/{app_id}/stage", json={"to_status": "screening", "note": "Hồ sơ ấn tượng"}, headers=headers_admin)
    assert stg1.status_code == 200
    assert stg1.json()["status"] == "screening"

    # Move to Interviewing
    stg2 = client.post(f"/api/v1/applications/{app_id}/stage", json={"to_status": "interviewing", "note": "Đã hẹn lịch phỏng vấn ngày 05/10"}, headers=headers_admin)
    assert stg2.status_code == 200
    assert stg2.json()["status"] == "interviewing"

    # Move to Hired
    stg3 = client.post(f"/api/v1/applications/{app_id}/stage", json={"to_status": "hired", "note": "Ứng viên đã nhận offer và nhận việc"}, headers=headers_admin)
    assert stg3.status_code == 200
    assert stg3.json()["status"] == "hired"
    assert len(stg3.json()["logs"]) >= 4

    print("Candidate applications pipeline flow test PASSED successfully!")

if __name__ == "__main__":
    test_application_flow()
