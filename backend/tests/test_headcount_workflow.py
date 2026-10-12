from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base, get_db
from app.core.security import create_access_token
from app.models.hr import Department
from app.models.user import User
from app.models.requisition import JobRequisition
from app.models.headcount import HeadcountBudget


@pytest.fixture
def workflow(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'workflow.db'}", connect_args={"check_same_thread": False, "timeout": 30})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    with factory() as db:
        db.add(Department(id=1, name="Công nghệ", code="TECH", is_active=True))
        for i, role in enumerate(["hr_manager", "manager", "employee", "recruiter", "candidate"], 1):
            db.add(User(id=i, full_name=role, email=f"{role}@test.local", hashed_password="unused", role=role, is_active=True, account_status="active"))
        db.commit()
    def dependency():
        with factory() as db:
            yield db
    app.dependency_overrides[get_db] = dependency
    client = TestClient(app)
    headers = {role: {"Authorization": f"Bearer {create_access_token(subject=i)}"} for i, role in enumerate(["hr_manager", "manager", "employee", "recruiter", "candidate"], 1)}
    yield client, headers, factory
    app.dependency_overrides.clear()
    engine.dispose()


def request(factory, code="REQ-TEST", quantity=1, salary=100, status="pending_hr"):
    with factory() as db:
        req = JobRequisition(code=code, title="Lập trình viên", department_id=1, quantity=quantity, max_salary=salary,
                             reason="new_headcount", created_by_id=3, status=status,
                             job_description="Phát triển hệ thống", requirements="Kinh nghiệm lập trình")
        db.add(req); db.commit(); db.refresh(req)
        return req.id


def budget(client, headers, count=2, salary=200):
    response = client.put("/api/v1/headcount/budgets/1", headers=headers["hr_manager"], json={"headcount_limit":count,"monthly_salary_limit":salary})
    assert response.status_code == 200, response.text


def test_supplement_resubmit_and_copy_reset(workflow):
    client, headers, factory = workflow
    req = request(factory, status="pending_dept")
    url = f"/api/v1/requisitions/{req}"
    assert client.post(url + "/request-change", headers=headers["employee"], json={"comment":"Cần bổ sung"}).status_code == 403
    assert client.post(url + "/request-change", headers=headers["manager"], json={"comment":" "}).status_code == 422
    changed = client.post(url + "/request-change", headers=headers["manager"], json={"comment":"Bổ sung mô tả công việc"})
    assert changed.status_code == 200, changed.text
    assert changed.json()["status"] == "changes_requested"
    assert client.put(url, headers=headers["employee"], json={"job_description":"Mô tả đã bổ sung"}).status_code == 200
    assert client.post(url + "/submit", headers=headers["employee"]).json()["status"] == "pending_dept"
    copied = client.post(url + "/copy", headers=headers["employee"])
    assert copied.status_code == 201, copied.text
    data = copied.json()
    assert data["id"] != req and data["status"] == "draft"
    assert data["deadline"] is None and data["recruiter_id"] is None and data["support_recruiter_id"] is None
    assert data["headcount_budget_id"] is None and data["reserved_monthly_salary"] is None
    assert any(log["action"] == "copy" for log in data["approval_logs"])


def test_explicit_budget_override_and_support_assignment(workflow):
    client, headers, factory = workflow
    req = request(factory, quantity=2)
    url = f"/api/v1/requisitions/{req}"
    override = {"override_budget":True, "comment":"Bổ sung nhân lực dự án khẩn cấp"}
    assert client.post(url + "/approve", headers=headers["hr_manager"], json=override).status_code == 409
    budget(client, headers, count=1, salary=100)
    assert client.post(url + "/approve", headers=headers["hr_manager"]).status_code == 409
    assert client.post(url + "/approve", headers=headers["hr_manager"], json={"override_budget":True}).status_code == 422
    approved = client.post(url + "/approve", headers=headers["hr_manager"], json=override)
    assert approved.status_code == 200, approved.text
    assert any("Ghi đè" in log["comment"] for log in approved.json()["approval_logs"])
    assert client.post(url + "/approve", headers=headers["hr_manager"], json=override).status_code == 400
    with factory() as db:
        assert db.query(HeadcountBudget).one().reserved_headcount == 2
        db.add(User(id=6, full_name="Hỗ trợ", email="support@test.local", hashed_password="unused", role="recruiter", is_active=True, account_status="active"))
        db.commit()
    assert client.put(url + "/assign", headers=headers["hr_manager"], json={"recruiter_id":4,"support_recruiter_id":4}).status_code == 422
    assigned = client.put(url + "/assign", headers=headers["hr_manager"], json={"recruiter_id":4,"support_recruiter_id":6})
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["support_recruiter_name"] == "Hỗ trợ"


def test_overdue_filter_before_pagination(workflow):
    from datetime import datetime, timedelta
    client, headers, factory = workflow
    late = request(factory, code="LATE", status="pending_dept")
    closed = request(factory, code="CLOSED", status="closed")
    upcoming = request(factory, code="UPCOMING", status="pending_dept")
    with factory() as db:
        for id in [late, closed]:
            db.get(JobRequisition,id).deadline = datetime.utcnow() - timedelta(days=2)
        db.get(JobRequisition,upcoming).deadline = datetime.utcnow() + timedelta(days=2)
        db.commit()
    response = client.get("/api/v1/requisitions?overdue=true&page_size=1", headers=headers["hr_manager"])
    assert response.status_code == 200, response.text
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == late


def test_budget_blocks_missing_headcount_and_salary(workflow):
    client, headers, factory = workflow
    req = request(factory, quantity=2)
    endpoint = f"/api/v1/requisitions/{req}/approve"
    assert client.post(endpoint, headers=headers["hr_manager"]).status_code == 409
    budget(client, headers, count=1, salary=1000)
    assert client.get(f"/api/v1/requisitions/{req}/budget-check", headers=headers["hr_manager"]).json()["blocked"]
    assert client.post(endpoint, headers=headers["hr_manager"]).status_code == 409
    budget(client, headers, count=2, salary=199)
    assert client.post(endpoint, headers=headers["hr_manager"]).status_code == 409
    with factory() as db:
        assert db.get(JobRequisition, req).status == "pending_hr"
        assert db.query(HeadcountBudget).one().reserved_headcount == 0
    budget(client, headers, count=2, salary=200)
    result = client.post(endpoint, headers=headers["hr_manager"])
    assert result.status_code == 200, result.text
    assert result.json()["reserved_monthly_salary"] == 200
    assert client.post(endpoint, headers=headers["hr_manager"]).status_code == 400
    assert client.put("/api/v1/headcount/budgets/1", headers=headers["hr_manager"], json={"headcount_limit":1,"monthly_salary_limit":200}).status_code == 409
    with factory() as db:
        assert db.query(HeadcountBudget).one().reserved_monthly_salary == Decimal("200")


def test_approve_assign_draft_publish_and_public_visibility(workflow):
    client, headers, factory = workflow
    budget(client, headers)
    req = request(factory, status="pending_dept")
    assert client.post(f"/api/v1/requisitions/{req}/approve", headers=headers["hr_manager"]).status_code == 403
    assert client.post(f"/api/v1/requisitions/{req}/approve", headers=headers["manager"]).json()["status"] == "pending_hr"
    assert client.put(f"/api/v1/requisitions/{req}/assign", headers=headers["hr_manager"], json={"recruiter_id":4}).status_code == 409
    assert client.post(f"/api/v1/requisitions/{req}/approve", headers=headers["hr_manager"]).status_code == 200
    assert client.post(f"/api/v1/requisitions/{req}/posting", headers=headers["hr_manager"]).status_code == 400
    for invalid in [3, 5, 999]:
        assert client.put(f"/api/v1/requisitions/{req}/assign", headers=headers["hr_manager"], json={"recruiter_id":invalid}).status_code == 400
    assigned = client.put(f"/api/v1/requisitions/{req}/assign", headers=headers["hr_manager"], json={"recruiter_id":4})
    assert assigned.status_code == 200
    assert assigned.json()["recruiter_name"] == "recruiter"
    draft = client.post(f"/api/v1/requisitions/{req}/posting", headers=headers["hr_manager"])
    assert draft.status_code == 200, draft.text
    job = draft.json()["id"]
    assert client.post(f"/api/v1/requisitions/{req}/posting", headers=headers["hr_manager"]).json()["id"] == job
    assert client.get(f"/api/v1/jobs/{job}").status_code == 404
    for payload in [{"quantity":2},{"department_id":999},{"max_salary":101}]:
        assert client.put(f"/api/v1/jobs/{job}", headers=headers["hr_manager"], json=payload).status_code == 409
    assert client.put(f"/api/v1/jobs/{job}", headers=headers["hr_manager"], json={"requirements":""}).status_code == 200
    assert client.post(f"/api/v1/jobs/{job}/publish", headers=headers["hr_manager"]).status_code == 400
    assert client.put(f"/api/v1/jobs/{job}", headers=headers["hr_manager"], json={"requirements":"Kinh nghiệm", "deadline":"2000-01-01T00:00:00"}).status_code == 200
    assert client.post(f"/api/v1/jobs/{job}/publish", headers=headers["hr_manager"]).status_code == 400
    assert client.put(f"/api/v1/jobs/{job}", headers=headers["hr_manager"], json={"deadline":None}).status_code == 200
    assert client.post(f"/api/v1/jobs/{job}/publish", headers=headers["hr_manager"]).status_code == 200
    assert client.get(f"/api/v1/jobs/{job}").status_code == 200
    assert client.post(f"/api/v1/jobs/{job}/publish", headers=headers["hr_manager"]).status_code == 200
    with factory() as db:
        assert db.query(HeadcountBudget).one().reserved_headcount == 1


def test_permissions_and_inactive_recruiter(workflow):
    client, headers, factory = workflow
    for role in ["manager","employee","candidate","recruiter"]:
        assert client.get("/api/v1/headcount/budgets", headers=headers[role]).status_code == 403
        assert client.put("/api/v1/headcount/budgets/1", headers=headers[role], json={"headcount_limit":1,"monthly_salary_limit":100}).status_code == 403
    budget(client, headers)
    req = request(factory)
    assert client.post(f"/api/v1/requisitions/{req}/approve", headers=headers["employee"]).status_code == 403
    assert client.post(f"/api/v1/requisitions/{req}/approve", headers=headers["hr_manager"]).status_code == 200
    with factory() as db:
        db.get(User,4).is_active = False; db.commit()
    assert client.get("/api/v1/headcount/recruiters", headers=headers["hr_manager"]).json() == []
    assert client.put(f"/api/v1/requisitions/{req}/assign", headers=headers["hr_manager"], json={"recruiter_id":4}).status_code == 400


def test_concurrent_approvals_cannot_overspend(workflow):
    client, headers, factory = workflow
    budget(client, headers, count=1, salary=100)
    a = request(factory, code="REQ-A")
    b = request(factory, code="REQ-B")
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda id: client.post(f"/api/v1/requisitions/{id}/approve", headers=headers["hr_manager"]).status_code, [a,b]))
    assert sorted(results) == [200,409]
    with factory() as db:
        limit = db.query(HeadcountBudget).one()
        assert limit.reserved_headcount == 1
        assert limit.reserved_monthly_salary == Decimal("100")


def test_direct_publish_does_not_skip_assignment(workflow):
    client, headers, factory = workflow
    budget(client, headers)
    req = request(factory)
    client.post(f"/api/v1/requisitions/{req}/approve", headers=headers["hr_manager"])
    response = client.post("/api/v1/jobs", headers=headers["hr_manager"], json={"requisition_id":req,"title":"Tin trực tiếp","department_id":1,"quantity":1,"max_salary":100,"status":"published","job_description":"Mô tả", "requirements":"Yêu cầu"})
    assert response.status_code == 400
    assert client.get("/api/v1/jobs").json()["total"] == 0
    unlinked = client.post("/api/v1/jobs", headers=headers["hr_manager"], json={"title":"Bỏ qua headcount","department_id":1,"quantity":1,"status":"published"})
    assert unlinked.status_code == 409
