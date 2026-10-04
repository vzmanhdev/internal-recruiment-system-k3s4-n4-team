from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, Base, engine
from app.models.user import User
from app.core.security import hash_password, create_access_token

client = TestClient(app)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    # Create test users
    admin = db.query(User).filter(User.email == "admin_req_test@company.com").first()
    if not admin:
        admin = User(
            email="admin_req_test@company.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin Requisition Test",
            role="admin",
            is_active=True,
            account_status="active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    employee = db.query(User).filter(User.email == "depthead_test@company.com").first()
    if not employee:
        employee = User(
            email="depthead_test@company.com",
            hashed_password=hash_password("dept123"),
            full_name="Employee Requisition Test",
            role="employee",
            is_active=True,
            account_status="active"
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    manager = db.query(User).filter(User.email == "manager_req_test@company.com").first()
    if not manager:
        manager = User(
            email="manager_req_test@company.com",
            hashed_password=hash_password("manager123"),
            full_name="Department Manager Test",
            role="manager",
            is_active=True,
            account_status="active"
        )
        db.add(manager)
        db.commit()
        db.refresh(manager)

    return admin, employee, manager

def test_requisition_lifecycle():
    admin, employee, manager = setup_test_db()
    admin_token = create_access_token(subject=admin.id)
    employee_token = create_access_token(subject=employee.id)
    manager_token = create_access_token(subject=manager.id)

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_employee = {"Authorization": f"Bearer {employee_token}"}
    headers_manager = {"Authorization": f"Bearer {manager_token}"}

    # 1. Create Department first if needed
    dept_resp = client.get("/api/v1/hr/departments", headers=headers_admin)
    if dept_resp.status_code == 200 and len(dept_resp.json()) > 0:
        dept_id = dept_resp.json()[0]["id"]
    else:
        create_dept = client.post(
            "/api/v1/hr/departments",
            json={"name": "Khối Công Nghệ", "code": "TECH-REQ-TEST", "sort_order": 1, "is_active": True},
            headers=headers_admin
        )
        assert create_dept.status_code == 201
        dept_id = create_dept.json()["id"]

    # 2. Create Requisition Draft
    req_payload = {
        "title": "Senior FastAPI Developer",
        "department_id": dept_id,
        "quantity": 2,
        "reason": "expansion",
        "min_salary": 20000000,
        "max_salary": 35000000,
        "work_location": "Hà Nội",
        "employment_type": "full_time",
        "experience_years": "2-4 năm",
        "job_description": "Phát triển các module Backend RESTful API",
        "submit_immediately": False
    }

    create_res = client.post("/api/v1/requisitions", json=req_payload, headers=headers_employee)
    assert create_res.status_code == 201
    req_data = create_res.json()
    assert req_data["status"] == "draft"
    req_id = req_data["id"]

    # 3. Submit Requisition
    submit_res = client.post(f"/api/v1/requisitions/{req_id}/submit", headers=headers_employee)
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "pending_dept"

    # 4. Department Approval
    manager_queue = client.get("/api/v1/requisitions?status=pending_dept", headers=headers_manager)
    assert manager_queue.status_code == 200
    assert any(item["id"] == req_id for item in manager_queue.json()["items"])

    app_dept_res = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"comment": "Đồng ý đề xuất"}, headers=headers_manager)
    assert app_dept_res.status_code == 200
    assert app_dept_res.json()["status"] == "pending_hr"

    # 5. HR Manager Final Approval
    app_hr_res = client.post(f"/api/v1/requisitions/{req_id}/approve", json={"comment": "HR Manager đã phê duyệt"}, headers=headers_admin)
    assert app_hr_res.status_code == 200
    assert app_hr_res.json()["status"] == "approved"
    assert len(app_hr_res.json()["approval_logs"]) >= 3

    print("Requisition lifecycle test PASSED successfully!")

if __name__ == "__main__":
    test_requisition_lifecycle()
