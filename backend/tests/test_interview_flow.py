from datetime import datetime, timedelta
from unittest.mock import patch
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
            role="interviewer",
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

    with next(get_db()) as db:
        approved_id = approved_requisition(db, dept_id, salary=70000000)
    job_res = client.post(
        "/api/v1/jobs",
        json={
            "title": "Lead Software Architect",
            "requisition_id": approved_id,
            "requirements": "Có kinh nghiệm kiến trúc phần mềm",
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
    assert sched_data["response_token"]
    assert len(sched_data["interviewers"]) == 1
    assert sched_data["interviewers"][0]["id"] == interviewer.id
    interview_id = sched_data["id"]

    with patch('app.api.v1.interview.send_interview_invitation', return_value=True) as send_email:
        invitation = client.post(f'/api/v1/interviews/{interview_id}/send-invitation', headers=headers_admin)
        assert invitation.status_code == 200
        assert '/interview-response?token=' in send_email.call_args.args[2]
    with patch('app.api.v1.interview.send_interview_invitation', return_value=False):
        assert client.post(f'/api/v1/interviews/{interview_id}/send-invitation', headers=headers_admin).status_code == 503

    # Public email link works without authentication and accepts reschedule requests.
    response_token = sched_data["response_token"]
    public_detail = client.get(f"/api/v1/interviews/public/{response_token}")
    assert public_detail.status_code == 200
    assert public_detail.json()["candidate_name"] == "Trần Quốc Bảo"
    proposed_time = (now + timedelta(days=2)).isoformat()
    public_reply = client.post(
        f"/api/v1/interviews/public/{response_token}/respond",
        json={"response": "reschedule_requested", "note": "Xin đổi sang ngày hôm sau", "proposed_start_time": proposed_time},
    )
    assert public_reply.status_code == 200
    assert public_reply.json()["candidate_response"] == "reschedule_requested"

    # Recruiter gets a blocking warning when the panel is already busy.
    conflict_check = client.post(
        "/api/v1/interviews/check-conflicts",
        json={
            "start_time": start_time,
            "end_time": end_time,
            "interviewer_ids": [interviewer.id],
            "interview_type": "online",
            "location_or_link": "https://meet.google.com/another-room",
        },
        headers=headers_admin,
    )
    assert conflict_check.status_code == 200
    assert conflict_check.json()["has_conflict"] is True

    # A conflicted batch rolls back earlier slots instead of partially creating them.
    before_count = client.get('/api/v1/interviews/manage/all', headers=headers_admin).json()['total']
    later_payload = {**schedule_payload, 'start_time': (now + timedelta(days=3)).isoformat(), 'end_time': (now + timedelta(days=3, hours=1)).isoformat()}
    batch = client.post('/api/v1/interviews/batch', json={'interviews': [later_payload, schedule_payload]}, headers=headers_admin)
    assert batch.status_code == 409
    after_count = client.get('/api/v1/interviews/manage/all', headers=headers_admin).json()['total']
    assert before_count == after_count

    successful_batch = client.post('/api/v1/interviews/batch', json={'interviews': [later_payload]}, headers=headers_admin)
    assert successful_batch.status_code == 201
    assert successful_batch.json()[0]['start_time'].endswith('Z')

    room_payload = {**schedule_payload, 'interview_type': 'offline', 'location_or_link': 'Phòng họp A3', 'start_time': (now + timedelta(days=4)).isoformat(), 'end_time': (now + timedelta(days=4, hours=1)).isoformat()}
    assert client.post('/api/v1/interviews', json=room_payload, headers=headers_admin).status_code == 201
    room_check = client.post('/api/v1/interviews/check-conflicts', json={**room_payload, 'interviewer_ids':[admin.id]}, headers=headers_admin)
    assert room_check.status_code == 200
    assert room_check.json()['has_conflict'] is True
    assert 'Phòng họp' in room_check.json()['conflicts'][0]['reason']

    with next(get_db()) as db:
        recruiter = db.query(User).filter_by(role='recruiter').first()
        recruiter_headers = {'Authorization': f'Bearer {create_access_token(subject=recruiter.id)}'}
    assert client.get('/api/v1/interviews/manage/all', headers=recruiter_headers).status_code == 200
    assert client.get('/api/v1/interviews/manage/all', headers=headers_interviewer).status_code == 403
    assert client.get('/api/v1/evaluations/comparison').status_code == 401

    malformed_token = client.get('/api/v1/interviews/public/not-a-token')
    assert malformed_token.status_code == 400

    evaluation_payload = {'overall_score': 4, 'competency_score': 5, 'culture_fit_score': 3, 'recommendation': 'hire', 'feedback': 'Năng lực phù hợp với yêu cầu tuyển dụng'}
    evaluation = client.post(f'/api/v1/applications/{app_id}/evaluations', json=evaluation_payload, headers=headers_interviewer)
    assert evaluation.status_code == 201
    comparison = client.get(f'/api/v1/evaluations/comparison?application_ids={app_id}', headers=headers_interviewer)
    assert comparison.status_code == 200
    assert comparison.json()[0]['overall_score'] == 4

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
    assert client.post(f'/api/v1/interviews/public/{response_token}/respond', json={'response':'confirmed'}).status_code == 400

    # Fetch interviews for application
    app_interviews = client.get(f"/api/v1/applications/{app_id}/interviews", headers=headers_admin)
    assert app_interviews.status_code == 200
    assert len(app_interviews.json()) >= 1

    print("Interview scheduling & panel flow test PASSED successfully!")

if __name__ == "__main__":
    test_interview_flow()
