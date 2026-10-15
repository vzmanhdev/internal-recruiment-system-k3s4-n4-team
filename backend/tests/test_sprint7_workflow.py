from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.hr import Department, Competency
from app.models.job import JobPosting
from app.models.application import JobApplication
from app.models.requisition import JobRequisition
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.offer_onboarding import JobOffer

client = TestClient(app)


@pytest.fixture
def data():
    db = SessionLocal()
    tag = uuid4().hex[:8]
    users = {}
    for role in ['admin', 'hr_manager', 'recruiter', 'manager', 'approver', 'candidate', 'interviewer']:
        user = User(email=f'{role}-{tag}@example.com', full_name=f'{role} Sprint7', role=role, hashed_password=hash_password('Test12345'), is_active=True, account_status='active')
        db.add(user); users[role] = user
    db.flush()
    department = Department(code=tag, name='Sprint 7')
    db.add(department); db.flush()
    req = JobRequisition(title='Nhu cầu Sprint7', department_id=department.id, reason='new_headcount', created_by_id=users['manager'].id, status='approved')
    db.add(req); db.flush()
    job = JobPosting(title='Kỹ sư Sprint7', department_id=department.id, created_by_id=users['admin'].id, requisition_id=req.id, min_salary=20000000, max_salary=30000000)
    db.add(job); db.flush()
    application = JobApplication(full_name='Ứng viên Sprint7', email=users['candidate'].email, candidate_id=users['candidate'].id, phone='0987654321', cv_url='/cv.pdf', job_id=job.id, status='interviewing')
    criterion = Competency(name='Giải quyết vấn đề', category=tag, weight=100, required_level=3)
    db.add_all([application, criterion]); db.flush()
    schedule = InterviewSchedule(application_id=application.id, start_time=datetime.utcnow()+timedelta(days=2), end_time=datetime.utcnow()+timedelta(days=2,hours=1), location_or_link='Phòng S7', competency_category=tag)
    db.add(schedule); db.flush()
    db.add(InterviewInterviewer(interview_id=schedule.id, interviewer_id=users['interviewer'].id)); db.commit()
    headers = {role:{'Authorization':f'Bearer {create_access_token(user.id)}'} for role,user in users.items()}
    payload = dict(application_id=application.id, position_title=job.title, offered_salary=25000000, start_date=(datetime.utcnow()+timedelta(days=14)).isoformat(), expiration_date=(datetime.utcnow()+timedelta(days=7)).isoformat(), work_location='Hà Nội', notes='Điều khoản ban đầu', probation_period_months=2)
    yield db, headers, payload, schedule.id, criterion.id
    db.close()


def create(data, **kwargs):
    _, headers, payload, _, _ = data
    result = client.post('/api/v1/offers', headers=headers['recruiter'], json={**payload, **kwargs})
    assert result.status_code == 201, result.text
    return result.json()['id']


def test_full_multilevel_offer_candidate_response_and_onboarding(data):
    _, headers, payload, _, _ = data
    offer_id = create(data)
    url = f'/api/v1/offers/{offer_id}'
    assert client.get(url,headers=headers['candidate']).status_code == 404
    assert client.post(url+'/status',headers=headers['recruiter'],json={'status':'sent'}).status_code == 409
    assert client.post(url+'/status',headers=headers['admin'],json={'status':'accepted'}).status_code == 409
    assert client.post(url+'/submit',headers=headers['recruiter']).status_code == 200
    assert client.post(url+'/review',headers=headers['hr_manager'],json={'status':'approved'}).status_code == 403
    for role in ['manager','hr_manager']:
        result = client.post(url+'/review',headers=headers[role],json={'status':'approved','notes':'Đồng ý mức lương'})
        assert result.status_code == 200, result.text
    assert result.json()['status'] == 'approved'
    assert client.post(url+'/status',headers=headers['recruiter'],json={'status':'sent'}).status_code == 200
    assert client.get(url,headers=headers['interviewer']).status_code == 404
    detail = client.get(url,headers=headers['candidate']).json()
    assert detail['approvals'] == [] and detail['salary_exception_reason'] is None
    response = client.post(url+'/respond',headers=headers['candidate'],json={'status':'accepted','notes':'Tôi đồng ý nhận việc'})
    assert response.status_code == 200, response.text
    assert response.json()['notes'] == payload['notes']
    assert response.json()['response_notes'] == 'Tôi đồng ý nhận việc'
    assert client.post(url+'/respond',headers=headers['candidate'],json={'status':'declined'}).status_code == 400
    items = client.get('/api/v1/onboarding/manage/all',headers=headers['recruiter']).json()['items']
    checklist = next(item for item in items if item['application_id']==payload['application_id'])
    assert checklist['status']=='pending'
    tasks = {key:True for key in ['welcome_email_sent','equipment_prepared','account_created','documents_submitted','orientation_scheduled']}
    ob_url = f"/api/v1/onboarding/{checklist['id']}"
    assert client.put(ob_url,headers=headers['candidate'],json=tasks).status_code == 403
    assert client.put(ob_url,headers=headers['recruiter'],json=tasks).json()['status']=='completed'
    assert client.put(ob_url,headers=headers['recruiter'],json={'equipment_prepared':False}).json()['status']=='in_progress'
    assert client.put(ob_url,headers=headers['recruiter'],json={key:False for key in tasks}).json()['status']=='pending'


def test_salary_exception_and_revision_history(data):
    _, headers, payload, _, _ = data
    assert client.post('/api/v1/offers',headers=headers['recruiter'],json={**payload,'offered_salary':40000000}).status_code==422
    offer_id = create(data, offered_salary=40000000, salary_exception_reason='Năng lực khan hiếm trên thị trường')
    url=f'/api/v1/offers/{offer_id}'
    client.post(url+'/submit',headers=headers['recruiter'])
    assert client.post(url+'/review',headers=headers['manager'],json={'status':'changes_requested','notes':'  '}).status_code==422
    assert client.post(url+'/review',headers=headers['manager'],json={'status':'changes_requested','notes':'Bổ sung lý do đề xuất'}).status_code==200
    updated={**payload,'offered_salary':40000000,'salary_exception_reason':'Bổ sung: chuyên gia có kinh nghiệm phù hợp'}
    assert client.put(url,headers=headers['recruiter'],json=updated).status_code==200
    client.post(url+'/submit',headers=headers['recruiter'])
    for role in ['manager','hr_manager']:
        result=client.post(url+'/review',headers=headers[role],json={'status':'approved'})
        assert result.status_code==200, result.text
    assert result.json()['status']=='pending_approval'
    assert client.post(url+'/status',headers=headers['admin'],json={'status':'sent'}).status_code==409
    assert client.post(url+'/review',headers=headers['approver'],json={'status':'approved'}).json()['status']=='approved'
    assert len(client.get(url,headers=headers['admin']).json()['approvals'])==6


def test_invalid_dates_expired_offer_and_access(data):
    db, headers, payload, _, _ = data
    assert client.post('/api/v1/offers',headers=headers['candidate'],json=payload).status_code==403
    assert client.post('/api/v1/offers',headers=headers['admin'],json={**payload,'start_date':(datetime.utcnow()-timedelta(days=1)).isoformat()}).status_code==422
    assert client.post('/api/v1/offers',headers=headers['admin'],json={**payload,'expiration_date':(datetime.utcnow()+timedelta(days=30)).isoformat()}).status_code==422
    offer_id=create(data)
    offer=db.query(JobOffer).filter_by(id=offer_id).first();offer.status='sent';offer.expiration_date=datetime.utcnow()-timedelta(seconds=1);db.commit()
    assert client.post(f'/api/v1/offers/{offer_id}/respond',headers=headers['candidate'],json={'status':'accepted'}).status_code==410
    assert client.get(f'/api/v1/offers/{offer_id}').status_code==401
    assert client.get('/api/v1/legacy/offers').status_code==401
    assert client.get(f'/api/v1/legacy/offers/{offer_id}',headers=headers['interviewer']).status_code==404
    assert client.put(f'/api/v1/legacy/offers/{offer_id}/status',headers=headers['admin'],json={'status':'accepted'}).status_code==403


def test_questions_persist_per_panel_and_block_outsiders(data):
    _, headers, _, schedule_id, criterion_id = data
    url=f'/api/v1/interviews/{schedule_id}/questions'
    assert client.get(url,headers=headers['candidate']).status_code==403
    assert client.get(url,headers=headers['recruiter']).status_code==403
    result=client.get(url,headers=headers['interviewer'])
    assert result.status_code==200, result.text
    assert result.json()['questions'][0]['asked'] is False
    assert client.put(url,headers=headers['interviewer'],json={'question_id':criterion_id,'asked':True}).status_code==200
    assert client.get(url,headers=headers['interviewer']).json()['questions'][0]['asked'] is True
    assert client.put(url,headers=headers['interviewer'],json={'question_id':-1,'asked':True}).status_code==422
    assert client.put(url,headers=headers['interviewer'],json={'question_id':criterion_id,'asked':False}).json()['questions'][0]['asked'] is False
