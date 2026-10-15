from datetime import datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from tests.recruitment_fixtures import approved_requisition


client = TestClient(app)


def login(email: str, password: str) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def ensure_admin() -> dict[str, str]:
    db = SessionLocal()
    user = db.query(User).filter(User.email == "candidate-flow-admin@company.com").first()
    if not user:
        db.add(User(email="candidate-flow-admin@company.com", hashed_password=hash_password("Admin12345"), full_name="Flow Admin", role="admin", is_active=True, account_status="active"))
        db.commit()
    db.close()
    return login("candidate-flow-admin@company.com", "Admin12345")


def test_candidate_application_interview_offer_and_employee_registration():
    unique = uuid4().hex[:8]
    admin_headers = ensure_admin()
    client.put("/api/v1/admin/settings", headers=admin_headers, json={"allow_registration": True, "require_approval": True})

    candidate_email = f"candidate-{unique}@example.com"
    candidate_register = client.post("/api/v1/auth/register", json={"email": candidate_email, "password": "Candidate123", "full_name": "Ứng viên Kiểm thử", "role": "candidate"})
    assert candidate_register.status_code == 201, candidate_register.text
    assert candidate_register.json()["user"]["is_active"] is True
    assert candidate_register.json()["user"]["role"] == "candidate"
    candidate_headers = login(candidate_email, "Candidate123")

    employee_register = client.post("/api/v1/auth/register", json={"email": f"employee-{unique}@company.com", "password": "Employee123", "full_name": "Nhân sự Nội bộ", "role": "employee"})
    assert employee_register.status_code == 201, employee_register.text
    assert employee_register.json()["user"]["is_active"] is False

    department = client.post("/api/v1/hr/departments", headers=admin_headers, json={"name": f"Kiểm thử {unique}", "code": f"QA-{unique}", "sort_order": 0})
    assert department.status_code == 201, department.text
    with SessionLocal() as db:
        approved_id = approved_requisition(db, department.json()["id"])
    job = client.post("/api/v1/jobs", headers=admin_headers, json={"title": f"QA Engineer {unique}", "department_id": department.json()["id"], "quantity": 1, "work_location": "Hà Nội", "status": "published", "requisition_id":approved_id,"job_description":"Mô tả QA", "requirements":"Kỹ năng kiểm thử"})
    assert job.status_code == 201, job.text

    application = client.post("/api/v1/applications", headers=candidate_headers, json={"job_id": job.json()["id"], "full_name": "Ứng viên Kiểm thử", "email": candidate_email, "phone": "0901234567", "cv_url": "https://example.com/cv.pdf"})
    assert application.status_code == 201, application.text
    application_id = application.json()["id"]

    interview = client.post("/api/v1/interviews", headers=admin_headers, json={"application_id": application_id, "title": "Phỏng vấn chuyên môn", "interview_type": "online", "location_or_link": "https://meet.example.com/test", "start_time": (datetime.utcnow() + timedelta(days=2)).isoformat(), "end_time": (datetime.utcnow() + timedelta(days=2, hours=1)).isoformat(), "interviewer_ids": [client.get("/api/v1/auth/me", headers=admin_headers).json()["id"]]})
    assert interview.status_code == 201, interview.text
    response = client.post(f"/api/v1/interviews/{interview.json()['id']}/respond", headers=candidate_headers, json={"response": "confirmed"})
    assert response.status_code == 200, response.text
    assert response.json()["candidate_response"] == "confirmed"

    offer = client.post("/api/v1/offers", headers=admin_headers, json={"application_id": application_id, "position_title": "QA Engineer", "offered_salary": 18000000, "start_date": (datetime.utcnow() + timedelta(days=14)).isoformat(), "probation_period_months": 2, "work_location": "Hà Nội", "expiration_date": (datetime.utcnow() + timedelta(days=7)).isoformat()})
    assert offer.status_code == 201, offer.text
    offer_id = offer.json()['id']
    assert client.post(f'/api/v1/offers/{offer_id}/submit',headers=admin_headers).status_code==200
    for _ in range(2):
        assert client.post(f'/api/v1/offers/{offer_id}/review',headers=admin_headers,json={'status':'approved'}).status_code==200
    assert client.post(f'/api/v1/offers/{offer_id}/status',headers=admin_headers,json={'status':'sent'}).status_code==200
    my_offers = client.get("/api/v1/offers/my", headers=candidate_headers)
    assert my_offers.status_code == 200, my_offers.text
    assert any(item["id"] == offer.json()["id"] for item in my_offers.json()["items"])
    accepted = client.post(f"/api/v1/offers/{offer.json()['id']}/respond", headers=candidate_headers, json={"status": "accepted"})
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "accepted"

    second_application = client.post("/api/v1/applications", headers=candidate_headers, json={"job_id": job.json()["id"], "full_name": "Ứng viên Kiểm thử", "email": candidate_email, "phone": "0901234567", "cv_url": "https://example.com/cv-v2.pdf"})
    assert second_application.status_code == 409
    assert "Mã tra cứu" in second_application.json()["detail"]
