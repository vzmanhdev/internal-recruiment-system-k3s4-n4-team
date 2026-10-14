from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, Base, engine
from app.models.user import User
from app.core.security import hash_password, create_access_token
from tests.recruitment_fixtures import approved_requisition

client = TestClient(app)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    admin = db.query(User).filter(User.email == "admin_ref_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_ref_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin Ref Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    return admin

def test_referral_eval_flow():
    admin = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create Department & Job Posting
    dept_resp = client.get("/api/v1/hr/departments", headers=headers_admin)
    if dept_resp.status_code == 200 and len(dept_resp.json()) > 0:
        dept_id = dept_resp.json()[0]["id"]
    else:
        create_dept = client.post(
            "/api/v1/hr/departments",
            json={"name": "Khối Kỹ Thuật", "code": "ENG-REF-TEST", "sort_order": 1, "is_active": True},
            headers=headers_admin
        )
        assert create_dept.status_code == 201
        dept_id = create_dept.json()["id"]

    with next(get_db()) as db:
        approved_id = approved_requisition(db, dept_id, quantity=2, salary=60000000)
    job_res = client.post(
        "/api/v1/jobs",
        json={
            "title": "Principal DevOps Engineer",
            "requisition_id": approved_id,
            "requirements": "Có kinh nghiệm DevOps và hạ tầng Cloud",
            "department_id": dept_id,
            "quantity": 2,
            "min_salary": 35000000,
            "max_salary": 60000000,
            "work_location": "Hồ Chí Minh",
            "employment_type": "full_time",
            "job_description": "Xây dựng hạ tầng Cloud CI/CD và Kubernetes cluster",
            "status": "published"
        },
        headers=headers_admin
    )
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # 2. Employee Submits Candidate Referral
    ref_payload = {
        "job_id": job_id,
        "candidate_name": "Lê Hoàng Nam",
        "candidate_email": "nam.lehoang@company.com",
        "candidate_phone": "0918273645",
        "cv_url": "https://storage.company.com/cvs/nam_devops.pdf",
        "relationship_note": "Đồng nghiệp cũ tại tập đoàn công nghệ"
    }

    create_ref = client.post("/api/v1/referrals", json=ref_payload, headers=headers_admin)
    assert create_ref.status_code == 201
    ref_data = create_ref.json()
    assert ref_data["status"] == "pending"
    assert ref_data["code"].startswith("REF-")
    ref_id = ref_data["id"]

    # Employee views my referrals
    my_refs = client.get("/api/v1/referrals/my", headers=headers_admin)
    assert my_refs.status_code == 200
    assert any(r["id"] == ref_id for r in my_refs.json()["items"])

    # HR updates referral status & bonus
    update_ref = client.post(
        f"/api/v1/referrals/{ref_id}/status",
        json={"status": "bonus_paid", "bonus_amount": 5000000.0},
        headers=headers_admin
    )
    assert update_ref.status_code == 200
    assert update_ref.json()["status"] == "bonus_paid"
    assert update_ref.json()["bonus_amount"] == 5000000.0

    # 3. Candidate Application Evaluation Flow
    # Submit job application
    app_res = client.post(
        "/api/v1/applications",
        json={
            "job_id": job_id,
            "full_name": "Lê Hoàng Nam",
            "email": "nam.lehoang@company.com",
            "phone": "0918273645",
            "cv_url": "https://storage.company.com/cvs/nam_devops.pdf",
            "cover_letter": "Chuyên gia K8s & Terraform 5 năm kinh nghiệm"
        }
    )
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]

    # HR Submits Candidate Evaluation Score
    eval_payload = {
        "overall_score": 4.8,
        "competency_score": 5.0,
        "culture_fit_score": 4.5,
        "recommendation": "strong_hire",
        "feedback": "Ứng viên có tư duy hạ tầng vượt trội, thành thạo Kubernetes và Terraform."
    }

    create_eval = client.post(f"/api/v1/applications/{app_id}/evaluations", json=eval_payload, headers=headers_admin)
    assert create_eval.status_code == 201
    eval_data = create_eval.json()
    assert eval_data["overall_score"] == 4.8
    assert eval_data["recommendation"] == "strong_hire"

    # Fetch evaluations for application
    get_evals = client.get(f"/api/v1/applications/{app_id}/evaluations", headers=headers_admin)
    assert get_evals.status_code == 200
    assert len(get_evals.json()) >= 1

    comparison = client.get(
        f"/api/v1/evaluations/comparison?application_ids={app_id}",
        headers=headers_admin,
    )
    assert comparison.status_code == 200
    assert comparison.json()[0]["application_id"] == app_id
    assert comparison.json()[0]["overall_score"] == 4.8

    print("Internal referrals & candidate evaluations flow test PASSED successfully!")

if __name__ == "__main__":
    test_referral_eval_flow()
