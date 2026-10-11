from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.db.session import Base, engine, get_db
from app.main import app
from app.models.user import User
from tests.recruitment_fixtures import approved_requisition


client = TestClient(app)


def test_sprint5_pipeline_screening_and_duplicate_merge():
    Base.metadata.create_all(bind=engine)
    marker = uuid4().hex[:8]
    with next(get_db()) as db:
        admin = User(
            email=f"sprint5-{marker}@company.com",
            hashed_password=hash_password("Admin123"),
            full_name="Sprint 5 Recruiter",
            role="admin,recruiter",
            is_active=True,
            account_status="active",
        )
        db.add(admin); db.commit(); db.refresh(admin)
        token = create_access_token(subject=admin.id)
    headers = {"Authorization": f"Bearer {token}"}

    department = client.post("/api/v1/hr/departments", headers=headers, json={"name": f"Sprint 5 {marker}", "code": f"S5-{marker}", "sort_order": 1, "is_active": True})
    assert department.status_code == 201, department.text
    department_id = department.json()["id"]

    job_ids = []
    for index in range(2):
        with next(get_db()) as db:
            requisition_id = approved_requisition(db, department_id, salary=20_000_000)
        job = client.post("/api/v1/jobs", headers=headers, json={
            "title": f"Pipeline Engineer {index} {marker}", "requisition_id": requisition_id,
            "department_id": department_id, "quantity": 1, "min_salary": 10_000_000,
            "max_salary": 20_000_000, "work_location": "Hà Nội", "employment_type": "full_time",
            "job_description": "Kiểm thử pipeline Sprint 5", "requirements": "Python", "status": "published",
        })
        assert job.status_code == 201, job.text
        job_ids.append(job.json()["id"])

    application_ids = []
    for job_id in job_ids:
        submitted = client.post("/api/v1/applications", json={
            "job_id": job_id, "full_name": "Ứng viên trùng Sprint 5",
            "email": f"duplicate-{marker}@example.com", "phone": "0901234567",
            "cv_url": "/uploads/cv/test.pdf",
        })
        assert submitted.status_code == 201, submitted.text
        application_ids.append(submitted.json()["id"])

    primary_id, duplicate_id = application_ids
    assessment = client.put(f"/api/v1/applications/{primary_id}/profile", headers=headers, json={
        "rating": 5, "fit_score": 88, "screening_result": "passed",
        "tags": ["Python", "Tiềm năng"], "is_talent_pool": True,
    })
    assert assessment.status_code == 200, assessment.text
    assert assessment.json()["fit_score"] == 88
    assert assessment.json()["screening_result"] == "passed"

    note = client.post(f"/api/v1/applications/{primary_id}/notes", headers=headers, json={"note": "Đã trao đổi sơ bộ qua điện thoại"})
    assert note.status_code == 200, note.text
    assert any("trao đổi sơ bộ" in (item.get("note") or "") for item in note.json()["logs"])

    missing_reason = client.post(f"/api/v1/applications/{primary_id}/stage", headers=headers, json={"to_status": "rejected"})
    assert missing_reason.status_code == 422
    screened = client.post(f"/api/v1/applications/{primary_id}/stage", headers=headers, json={"to_status": "screening"})
    assert screened.status_code == 200

    saved = client.post("/api/v1/applications/filters", headers=headers, json={"name": "Python tiềm năng", "criteria": {"tag": "Python", "minRating": 4}})
    assert saved.status_code == 201, saved.text
    saved_id = saved.json()["id"]
    assert any(item["id"] == saved_id for item in client.get("/api/v1/applications/filters", headers=headers).json())

    talent = client.get("/api/v1/applications/talent-pool", headers=headers)
    assert talent.status_code == 200
    assert any(item["id"] == primary_id for item in talent.json()["items"])

    duplicates = client.get("/api/v1/applications/duplicates", headers=headers)
    assert duplicates.status_code == 200
    assert any({pair["primary"]["id"], pair["duplicate"]["id"]} == {primary_id, duplicate_id} for pair in duplicates.json())

    merged = client.post(f"/api/v1/applications/{primary_id}/merge", headers=headers, json={"duplicate_id": duplicate_id})
    assert merged.status_code == 200, merged.text
    assert "Python" in merged.json()["tags"]
    assert client.delete(f"/api/v1/applications/filters/{saved_id}", headers=headers).status_code == 204
