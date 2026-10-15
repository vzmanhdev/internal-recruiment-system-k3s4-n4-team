from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.hr import Competency, Department
from app.models.user import User
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.referral_eval import CandidateEvaluation
from app.core.security import create_access_token, hash_password

client = TestClient(app)


@pytest.fixture
def data():
    db = SessionLocal()
    tag = uuid4().hex[:8]
    admin = User(email=f'hr-{tag}@test.local', full_name='HR Scorecard', role='admin', hashed_password=hash_password('Admin12345'), is_active=True)
    interviewer = User(email=f'panel-{tag}@test.local', full_name='Hội đồng Scorecard', role='interviewer', hashed_password=hash_password('Panel12345'), is_active=True)
    db.add_all([admin, interviewer]); db.flush()
    department = Department(name='Phòng kiểm thử', code=tag)
    db.add(department); db.flush()
    job = JobPosting(title='Kỹ sư kiểm thử Sprint 6', department_id=department.id, created_by_id=admin.id)
    db.add(job); db.flush()
    candidates = [JobApplication(full_name=f'Ứng viên {index} {tag}', email=f'candidate-{index}-{tag}@test.local', phone='0987654321', cv_url='/test.pdf', job_id=job.id) for index in range(2)]
    framework = f'Khung kiểm thử {tag}'
    criteria = [Competency(name='Chuyên môn', category=framework, weight=40, required_level=3), Competency(name='Giao tiếp', category=framework, weight=60, required_level=3)]
    db.add_all(candidates + criteria); db.commit()
    headers = {'Authorization':f'Bearer {create_access_token(admin.id)}'}
    panel_headers = {'Authorization':f'Bearer {create_access_token(interviewer.id)}'}
    schedules = []
    for index, candidate in enumerate(candidates):
        start = datetime.now(timezone.utc) + timedelta(days=10+index)
        result = client.post('/api/v1/interviews', headers=headers, json={
            'application_id':candidate.id, 'title':'Phỏng vấn đánh giá năng lực', 'location_or_link':'https://meet.example/test',
            'start_time':start.isoformat(), 'end_time':(start+timedelta(hours=1)).isoformat(),
            'interviewer_ids':[interviewer.id], 'competency_category':framework, 'is_final_round':index==0,
        })
        assert result.status_code == 201, result.text
        schedules.append(result.json())
    payload = {'criteria':[{'criterion_id':criteria[0].id,'score':5,'comment':'Kiến thức chuyên môn vững'}, {'criterion_id':criteria[1].id,'score':3,'comment':'Giao tiếp đáp ứng yêu cầu'}], 'recommendation':'hire', 'feedback':'Ứng viên phù hợp với yêu cầu công việc'}
    yield db, headers, panel_headers, schedules, criteria, payload
    db.close()


def test_dynamic_scorecard_calculates_and_updates(data):
    db, _, panel, schedules, criteria, payload = data
    url = f'/api/v1/interviews/{schedules[0]["id"]}/scorecard'
    definition = client.get(url, headers=panel)
    assert definition.status_code == 200
    assert [item['id'] for item in definition.json()['criteria']] == [item.id for item in criteria]
    result = client.post(url, headers=panel, json={**payload,'overall_score':5})
    assert result.status_code == 200, result.text
    assert result.json()['overall_score'] == 3.8  # server ignores tampered total
    assert result.json()['criteria_scores'][0]['comment'] == 'Kiến thức chuyên môn vững'
    payload['criteria'][0]['score'] = 4
    assert client.post(url, headers=panel, json=payload).json()['overall_score'] == 3.4
    assert db.query(CandidateEvaluation).filter_by(interview_id=schedules[0]['id']).count() == 1
    assert client.get(url,headers=panel).json()['criteria'][0]['score'] == 4


def test_final_grid_excludes_other_rounds(data):
    _, admin, panel, schedules, _, payload = data
    for schedule in schedules:
        assert client.post(f'/api/v1/interviews/{schedule["id"]}/scorecard', headers=panel, json=payload).status_code == 200
    result = client.get('/api/v1/evaluations/comparison?final_only=true', headers=admin)
    assert result.status_code == 200
    matching = [item for item in result.json() if item['application_id'] in {schedule['application_id'] for schedule in schedules}]
    assert len(matching) == 1
    assert matching[0]['application_id'] == schedules[0]['application_id']
    assert matching[0]['total_points'] == 76
    assert matching[0]['criteria_scores'][0]['score'] == 5


def test_invalid_criteria_and_access_are_blocked(data):
    _, _, panel, schedules, _, payload = data
    url = f'/api/v1/interviews/{schedules[0]["id"]}/scorecard'
    assert client.post(url, headers=panel, json={**payload,'criteria':payload['criteria'][:1]}).status_code == 400
    invalid = {**payload,'criteria':[{**item,'score':6} for item in payload['criteria']]}
    assert client.post(url, headers=panel, json=invalid).status_code == 422
    invalid = {**payload,'criteria':[{**item,'comment':'     '} for item in payload['criteria']]}
    assert client.post(url, headers=panel, json=invalid).status_code == 400
    assert client.get(url).status_code == 401


def test_saved_framework_is_snapshotted(data):
    db, _, panel, schedules, criteria, payload = data
    url = f'/api/v1/interviews/{schedules[0]["id"]}/scorecard'
    assert client.post(url, headers=panel, json=payload).status_code == 200
    criteria[0].weight=20;db.commit()
    reopened = client.get(url,headers=panel)
    assert reopened.json()['criteria'][0]['weight'] == 40
    assert client.get(f'/api/v1/interviews/{schedules[1]["id"]}/scorecard',headers=panel).status_code == 409
