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

    admin = db.query(User).filter(User.email == "admin_int_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_int_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin Interview Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)

    interviewer = db.query(User).filter(User.email == "interviewer_test@company.com").first()
    if not interviewer:
        interviewer = User(
            email="interviewer_test@company.com",
            hashed_password=hash_password("interviewer123"),
            full_name="Interviewer Test User",
            role="hr_manager",
            is_active=True,
            account_status="active"
        )
        db.add(interviewer)

    db.commit()
    db.refresh(admin)
    db.refresh(interviewer)

    return admin, interviewer

def test_interview_flow():
    admin, interviewer = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    interviewer_token = create_access_token(subject=interviewer.id)

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_interviewer = {"Authorization": f"Bearer {interviewer_token}"}

    # 1. Setup Dept, Job, and Application
    dept_resp = client.get("/api/v1/hr/departments", headers=headers_admin)
    if dept_resp.status_code == 200 and len(dept_resp.json()) > 0:
        dept_id = dept_resp.json()[0]["id"]
    else:
        create_dept = client.post(
            "/api/v1/hr/departments",
            json={"name": "Phòng Công Nghệ", "code": "TECH-INT-TEST", "sort_order": 1, "is_active": True},
            headers=headers_admin
        )
        dept_id = create_dept.json()["id"]

    job_res = client.post(
        "/api/v1/jobs",
        json={
            "title": "Lead Software Architect",
            "department_id": dept_id,
            "quantity": 1,
            "min_salary": 40000000,
            "max_salary": 70000000,
            "work_location": "Hà Nội",
            "employment_type": "full_time",
            "job_description": "Thiết kế kiến trúc vi dịch vụ Microservices high availability",
            "status": "published"
        },
        headers=headers_admin
    )
    job_id = job_res.json()["id"]

    app_res = client.post(
        "/api/v1/applications",
        json={
            "job_id": job_id,
            "full_name": "Trần Quốc Bảo",
            "email": "bao.tran@company.com",
            "phone": "0987654321",
            "cv_url": "https://storage.company.com/cvs/bao_architect.pdf",
            "cover_letter": "Hơn 8 năm kinh nghiệm thiết kế hệ thống Microservices"
        }
    )
    app_id = app_res.json()["id"]

    # 2. HR Schedules Interview & Assigns Panel Interviewer
    now = datetime.utcnow()
    start_time = (now + timedelta(days=1)).isoformat()
    end_time = (now + timedelta(days=1, hours=1)).isoformat()

    schedule_payload = {
        "application_id": app_id,
        "title": "Phỏng vấn Chuyên môn Vòng 1",
        "interview_type": "online",
        "location_or_link": "https://meet.google.com/xyz-abc-def",
        "start_time": start_time,
        "end_time": end_time,
        "notes": "Vui lòng chuẩn bị slide kiến trúc hệ thống 15 phút.",
        "interviewer_ids": [interviewer.id]
    }

    create_sched = client.post("/api/v1/interviews", json=schedule_payload, headers=headers_admin)
    assert create_sched.status_code == 201
    sched_data = create_sched.json()
    assert sched_data["status"] == "scheduled"
    assert sched_data["code"].startswith("INT-")
    assert len(sched_data["interviewers"]) == 1
    assert sched_data["interviewers"][0]["id"] == interviewer.id
    interview_id = sched_data["id"]

    # 3. Interviewer views my interviews
    my_interviews = client.get("/api/v1/interviews/my", headers=headers_interviewer)
    assert my_interviews.status_code == 200
    assert any(i["id"] == interview_id for i in my_interviews.json()["items"])

    # 4. HR updates interview status to completed
    update_res = client.put(
        f"/api/v1/interviews/{interview_id}",
        json={"status": "completed"},
        headers=headers_admin
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "completed"

    # Fetch interviews for application
    app_interviews = client.get(f"/api/v1/applications/{app_id}/interviews", headers=headers_admin)
    assert app_interviews.status_code == 200
    assert len(app_interviews.json()) >= 1

    print("Interview scheduling & panel flow test PASSED successfully!")

if __name__ == "__main__":
    test_interview_flow()
