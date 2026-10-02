from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, Base, engine
from app.models.user import User
from app.core.security import hash_password, create_access_token

client = TestClient(app)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    admin = db.query(User).filter(User.email == "admin_job_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_job_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin Job Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    return admin

def test_job_flow():
    admin = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Get or create Department
    dept_resp = client.get("/api/v1/hr/departments", headers=headers_admin)
    if dept_resp.status_code == 200 and len(dept_resp.json()) > 0:
        dept_id = dept_resp.json()[0]["id"]
    else:
        create_dept = client.post(
            "/api/v1/hr/departments",
            json={"name": "Khối Sản Phẩm", "code": "PROD-JOB-TEST", "sort_order": 1, "is_active": True},
            headers=headers_admin
        )
        assert create_dept.status_code == 201
        dept_id = create_dept.json()["id"]

    # 2. Create Job Posting via HR API
    job_payload = {
        "title": "Lead Product Manager",
        "department_id": dept_id,
        "quantity": 1,
        "min_salary": 30000000,
        "max_salary": 50000000,
        "is_salary_negotiable": False,
        "work_location": "Hồ Chí Minh",
        "employment_type": "full_time",
        "experience_years": "3-5 năm",
        "is_featured": True,
        "job_description": "Chịu trách nhiệm định hướng và phát triển sản phẩm SaaS",
        "requirements": "3+ năm kinh nghiệm Product Manager trong mảng B2B/SaaS",
        "benefits": "Bảo hiểm PVI, Thưởng KPI, Chế độ làm việc Hybrid",
        "status": "published"
    }

    create_res = client.post("/api/v1/jobs", json=job_payload, headers=headers_admin)
    assert create_res.status_code == 201
    job_data = create_res.json()
    assert job_data["status"] == "published"
    assert job_data["code"].startswith("JOB-")
    job_id = job_data["id"]

    # 3. Test Public Listing API (No Auth header required)
    pub_list = client.get("/api/v1/jobs?search=Product Manager")
    assert pub_list.status_code == 200
    items = pub_list.json()["items"]
    assert any(j["id"] == job_id for j in items)

    # 4. Test Public Detail API & Views Count Increment
    pub_detail_1 = client.get(f"/api/v1/jobs/{job_id}")
    assert pub_detail_1.status_code == 200
    v1 = pub_detail_1.json()["views_count"]

    pub_detail_2 = client.get(f"/api/v1/jobs/{job_id}")
    assert pub_detail_2.status_code == 200
    v2 = pub_detail_2.json()["views_count"]
    assert v2 == v1 + 1

    # 5. Pause & Publish via HR API
    pause_res = client.post(f"/api/v1/jobs/{job_id}/pause", headers=headers_admin)
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"

    # Public detail should now return 404 since it's paused
    pub_paused = client.get(f"/api/v1/jobs/{job_id}")
    assert pub_paused.status_code == 404

    pub_res = client.post(f"/api/v1/jobs/{job_id}/publish", headers=headers_admin)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    print("Job postings flow test PASSED successfully!")

if __name__ == "__main__":
    test_job_flow()
