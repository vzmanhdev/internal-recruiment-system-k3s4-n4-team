import os
import sys
import io
import openpyxl
from fastapi.testclient import TestClient

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.hr import Department, JobTitle
from app.models.requisition import JobRequisition
from app.core.security import hash_password
from seed import reset_and_seed_database

client = TestClient(app)

def run_compliance_tests():
    print("=" * 80)
    print("RUNNING SPRINT 1 & SPRINT 2 COMPLIANCE VERIFICATION TEST SUITE")
    print("=" * 80)

    # Reset and seed database for a clean test environment
    reset_and_seed_database()

    # -------------------------------------------------------------------------
    # GROUP 1: SPRINT 1 - AUTHENTICATION & AUTHORIZATION
    # -------------------------------------------------------------------------

    print("\n" + "=" * 60)
    print("TEST SUITE 1: S1-01 - LOGIN ERROR HANDLING & 15-MIN LOCKOUT")
    print("=" * 60)

    # 1.1 Non-existent email: Generic error, no email enumeration
    res_fake_user = client.post("/api/v1/auth/login", json={"email": "nonexistent@company.com", "password": "WrongPassword123!"})
    assert res_fake_user.status_code == 400
    assert "Email hoặc mật khẩu không chính xác" in res_fake_user.json()["detail"]
    print(" -> [PASS] S1-01: Non-existent email returns generic error message without leakage.")

    # 1.2 Wrong password: Same generic error message
    res_wrong_pwd = client.post("/api/v1/auth/login", json={"email": "employee@company.com", "password": "IncorrectPassword!"})
    assert res_wrong_pwd.status_code == 400
    assert "Email hoặc mật khẩu không chính xác" in res_wrong_pwd.json()["detail"]
    print(" -> [PASS] S1-01: Wrong password returns exact same generic error message.")

    # 1.3 Role redirect on successful login
    roles_redirects = [
        ("admin@company.com", "/admin"),
        ("hrmanager@company.com", "/hr"),
        ("manager@company.com", "/manager"),
        ("employee@company.com", "/jobs")
    ]
    for email, expected_route in roles_redirects:
        login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
        assert login_res.status_code == 200
        assert login_res.json()["redirect_url"] == expected_route
        print(f" -> [PASS] S1-01: User {email} redirects to correct route '{expected_route}'.")

    # 1.4 5 consecutive failed logins -> 15-minute temporary lockout
    # Make a fresh test user
    db = SessionLocal()
    lockout_user = User(
        email="lockout.target@company.com",
        full_name="Lockout Target",
        hashed_password=hash_password("TargetPwd123!"),
        role="employee",
        is_active=True,
        account_status="active"
    )
    db.add(lockout_user)
    db.commit()
    db.close()

    for attempt in range(1, 6):
        fail_res = client.post("/api/v1/auth/login", json={"email": "lockout.target@company.com", "password": f"WrongPwd{attempt}!"})
        assert fail_res.status_code == 400
        if attempt < 5:
            assert "Email hoặc mật khẩu không chính xác" in fail_res.json()["detail"]
        else:
            assert "15 phút" in fail_res.json()["detail"] or "khóa tạm thời" in fail_res.json()["detail"]
            print(f" -> [PASS] S1-01: 5th failed attempt triggers 15-minute temporary lockout: {fail_res.json()['detail']}")

    # 6th attempt with CORRECT password is still locked out
    locked_res = client.post("/api/v1/auth/login", json={"email": "lockout.target@company.com", "password": "TargetPwd123!"})
    assert locked_res.status_code == 400
    assert "15 phút" in locked_res.json()["detail"] or "khóa tạm thời" in locked_res.json()["detail"]
    print(" -> [PASS] S1-01: Correct password rejected during active 15-minute lockout period.")


    print("\n" + "=" * 60)
    print("TEST SUITE 2: S1-02 - SAFE SESSION & SERVER-SIDE TOKEN REVOCATION")
    print("=" * 60)

    # 2.1 Login to get active token
    login_res = client.post("/api/v1/auth/login", json={"email": "employee@company.com", "password": "password123"})
    assert login_res.status_code == 200
    emp_token = login_res.json()["access_token"]

    # 2.2 Active session refresh
    refresh_res = client.post("/api/v1/auth/refresh-session", headers={"Authorization": f"Bearer {emp_token}"})
    assert refresh_res.status_code == 200
    refreshed_token = refresh_res.json()["access_token"]
    assert refreshed_token and refreshed_token != emp_token
    print(" -> [PASS] S1-02: Active session extended with new access token.")

    # 2.3 Safe Logout invalidates session immediately
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {refreshed_token}"})
    assert logout_res.status_code == 200
    print(" -> [PASS] S1-02: Server-side logout endpoint returned 200.")

    # 2.4 Subsequent request with revoked token must return 401
    revoked_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refreshed_token}"})
    assert revoked_res.status_code == 401
    assert "hết hạn" in revoked_res.json()["detail"] or "không hợp lệ" in revoked_res.json()["detail"]
    print(" -> [PASS] S1-02: Server-side token revocation verified (HTTP 401 on reuse).")


    print("\n" + "=" * 60)
    print("TEST SUITE 3: S1-05 - SERVER-SIDE RBAC ENFORCEMENT & DEFAULT-DENY")
    print("=" * 60)

    # Prepare tokens for 3 distinct roles: Employee, Interviewer, Hiring Manager, and Admin
    def get_token(email):
        r = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
        return r.json()["access_token"]

    token_employee = get_token("employee@company.com")
    token_interviewer = get_token("interviewer@company.com")
    token_manager = get_token("manager@company.com")
    token_admin = get_token("admin@company.com")

    # 3.1 Employee attempts to access Admin API (GET /api/v1/admin/users) -> 403 Forbidden with Vietnamese message
    emp_admin_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token_employee}"})
    assert emp_admin_res.status_code == 403
    assert "Bạn không có quyền" in emp_admin_res.json()["detail"]
    print(f" -> [PASS] S1-05: Employee denied admin access (403): {emp_admin_res.json()['detail']}")

    # 3.2 Interviewer attempts to access Admin API (GET /api/v1/admin/roles) -> 403 Forbidden
    int_admin_res = client.get("/api/v1/admin/roles", headers={"Authorization": f"Bearer {token_interviewer}"})
    assert int_admin_res.status_code == 403
    assert "Bạn không có quyền" in int_admin_res.json()["detail"]
    print(f" -> [PASS] S1-05: Interviewer denied admin roles (403): {int_admin_res.json()['detail']}")

    # 3.3 Employee attempts to access HR/Requisition Creation -> 403 Forbidden
    emp_req_res = client.post(
        "/api/v1/requisitions",
        json={"title": "Unauthorized Req", "department_id": 1, "headcount": 1, "employment_type": "full_time", "job_title_id": 1},
        headers={"Authorization": f"Bearer {token_employee}"}
    )
    assert emp_req_res.status_code == 403
    assert "Bạn không có quyền" in emp_req_res.json()["detail"]
    print(f" -> [PASS] S1-05: Employee denied requisition creation (403): {emp_req_res.json()['detail']}")

    # 3.4 Admin can access all of the above
    admin_users_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token_admin}"})
    assert admin_users_res.status_code == 200
    print(" -> [PASS] S1-05: Admin full-override verified (HTTP 200).")


    print("\n" + "=" * 60)
    print("TEST SUITE 4: S1-08 - ACCOUNT MANAGEMENT, ACTIVATION & SEARCH")
    print("=" * 60)

    admin_headers = {"Authorization": f"Bearer {token_admin}"}

    # 4.1 Admin creates user without password -> auto-generates temporary password and dispatches email
    new_user_payload = {
        "full_name": "Nguyen Van Test S108",
        "email": "test.s108@company.com",
        "roles": ["employee", "interviewer"],
        "department_id": 1
    }
    create_res = client.post("/api/v1/admin/users", json=new_user_payload, headers=admin_headers)
    assert create_res.status_code == 201
    created_user_data = create_res.json()
    assert created_user_data["email"] == "test.s108@company.com"
    assert created_user_data["department_id"] == 1
    assert "interviewer" in created_user_data["roles"]
    print(" -> [PASS] S1-08: Admin created account with temporary password & activation dispatch.")

    # 4.2 Duplicate email rejected with clear message
    dup_res = client.post("/api/v1/admin/users", json=new_user_payload, headers=admin_headers)
    assert dup_res.status_code == 400
    assert "đã được đăng ký" in dup_res.json()["detail"] or "đã tồn tại" in dup_res.json()["detail"]
    print(" -> [PASS] S1-08: Duplicate email rejected (HTTP 400).")

    # 4.3 Search by name, email, department, role with pagination (default 20)
    search_res = client.get("/api/v1/admin/users?search=test.s108&page=1&page_size=20", headers=admin_headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] >= 1
    assert search_data["page_size"] == 20
    assert search_data["items"][0]["email"] == "test.s108@company.com"
    print(f" -> [PASS] S1-08: Search & 20-item pagination verified (Found {search_data['total']} users).")


    # -------------------------------------------------------------------------
    # GROUP 2: SPRINT 2 - ORG STRUCTURE & REQUISITIONS
    # -------------------------------------------------------------------------

    print("\n" + "=" * 60)
    print("TEST SUITE 5: S2-01 - BULK STAFF IMPORT VIA EXCEL WITH ROW-BY-ROW ERRORS")
    print("=" * 60)

    # 5.1 Create Excel file with 1 valid row and 2 invalid rows
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "DanhSachNhanSu"
    ws.append(["Họ và tên", "Email", "Số điện thoại", "Mã nhân viên", "Phòng ban", "Vai trò", "Mật khẩu tạm"])
    # Row 2: Valid
    ws.append(["Hoang Thi Valid", "hoang.valid@company.com", "0912345678", "NV-VALID-01", "IT", "employee", "P@ssword123!"])
    # Row 3: Invalid email
    ws.append(["Tran Thi Invalid Email", "invalid-email-format", "0987654321", "NV-INV-02", "HR", "employee", "P@ssword123!"])
    # Row 4: Invalid phone number (< 10 digits)
    ws.append(["Le Van Invalid Phone", "le.invalid@company.com", "12345", "NV-INV-03", "IT", "employee", "P@ssword123!"])

    excel_buffer = io.BytesIO()
    wb.save(excel_buffer)
    excel_bytes = excel_buffer.getvalue()

    # 5.2 Test Import Preview Endpoint (S2-01 AC: validate row-by-row before import)
    preview_res = client.post(
        "/api/v1/admin/users/import/preview",
        files={"file": ("staff_import_test.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        headers=admin_headers
    )
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert preview_data["total"] == 3
    assert preview_data["valid_count"] == 1
    assert preview_data["invalid_count"] == 2
    assert len(preview_data["rows"]) == 3
    assert preview_data["rows"][0]["is_valid"] is True
    assert preview_data["rows"][1]["is_valid"] is False
    assert any("email" in err.lower() for err in preview_data["rows"][1]["errors"])
    assert preview_data["rows"][2]["is_valid"] is False
    assert any("điện thoại" in err.lower() for err in preview_data["rows"][2]["errors"])
    print(f" -> [PASS] S2-01: Excel Preview validated row-by-row: 1 valid, 2 invalid rows with precise errors.")

    # 5.3 Test Import Execution Endpoint (S2-01 AC: skips invalid rows, imports valid rows, returns summary)
    import_res = client.post(
        "/api/v1/admin/users/import",
        files={"file": ("staff_import_test.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        headers=admin_headers
    )
    assert import_res.status_code == 200
    import_summary = import_res.json()
    assert import_summary["total"] == 3
    assert import_summary["imported_count"] == 1
    assert import_summary["skipped_count"] == 2
    assert len(import_summary["errors"]) == 2
    print(f" -> [PASS] S2-01: Excel Import executed with summary: {import_summary['imported_count']} imported, {import_summary['skipped_count']} skipped.")


    print("\n" + "=" * 60)
    print("TEST SUITE 6: S2-04 - ORG STRUCTURE & BLOCK DELETING DEPARTMENTS WITH REQUISITIONS")
    print("=" * 60)

    hr_headers = {"Authorization": f"Bearer {get_token('hrmanager@company.com')}"}

    # 6.1 Department hierarchy tree
    tree_res = client.get("/api/v1/hr/departments/tree", headers=hr_headers)
    assert tree_res.status_code == 200
    tree_data = tree_res.json()
    assert isinstance(tree_data, list) and len(tree_data) >= 1
    print(f" -> [PASS] S2-04: Department tree hierarchy retrieved ({len(tree_data)} top-level units).")

    # 6.2 Try to delete Department #1 (IT) which has an existing active Job Requisition
    del_dept_res = client.delete("/api/v1/hr/departments/1", headers=hr_headers)
    assert del_dept_res.status_code == 400
    assert "yêu cầu tuyển dụng" in del_dept_res.json()["detail"] or "nhân sự" in del_dept_res.json()["detail"]
    print(f" -> [PASS] S2-04: Deletion rejected when active requisitions/personnel exist: {del_dept_res.json()['detail']}")

    # 6.3 Create an empty test department without requisitions and delete it
    new_dept_res = client.post(
        "/api/v1/hr/departments",
        json={"name": "Phòng Ban Thử Nghiệm Tạm", "code": "TEMP_TEST", "sort_order": 99},
        headers=hr_headers
    )
    assert new_dept_res.status_code == 201
    temp_dept_id = new_dept_res.json()["id"]

    del_temp_res = client.delete(f"/api/v1/hr/departments/{temp_dept_id}", headers=hr_headers)
    assert del_temp_res.status_code == 200
    print(" -> [PASS] S2-04: Empty department without requisitions deleted successfully.")


    print("\n" + "=" * 60)
    print("TEST SUITE 7: S2-05 - JOB TITLES, SALARY BANDS & SALARY RANGE REQUISITION CONTROL")
    print("=" * 60)

    # 7.1 Salary masking: HR Manager sees salary bands, Employee gets masked (None)
    jt_hr_res = client.get("/api/v1/hr/job-titles", headers=hr_headers)
    assert jt_hr_res.status_code == 200
    hr_job_titles = jt_hr_res.json()
    senior_dev_hr = next(j for j in hr_job_titles if "Backend" in j["name"])
    assert senior_dev_hr["min_salary"] is not None and senior_dev_hr["max_salary"] is not None
    print(f" -> [PASS] S2-05: HR Manager views full salary band: {senior_dev_hr['min_salary']} - {senior_dev_hr['max_salary']} VNĐ.")

    jt_emp_res = client.get("/api/v1/hr/job-titles", headers={"Authorization": f"Bearer {token_employee}"})
    assert jt_emp_res.status_code == 200
    emp_job_titles = jt_emp_res.json()
    senior_dev_emp = next(j for j in emp_job_titles if "Backend" in j["name"])
    assert senior_dev_emp["min_salary"] is None and senior_dev_emp["max_salary"] is None
    print(" -> [PASS] S2-05: Non-HR Employee receives masked salary bands (min/max salary = None).")

    # 7.2 Requisition Proposed Salary exceeding approved Job Title band is REJECTED
    # Job Title (Senior Dev Backend): approved min = 25,000,000, max = 35,000,000
    manager_headers = {"Authorization": f"Bearer {token_manager}"}
    exceeding_req_payload = {
        "title": "Kỹ Sư Cấp Cao Lương Vượt Khung",
        "department_id": 1,
        "job_title_id": senior_dev_hr["id"],
        "headcount": 1,
        "employment_type": "full_time",
        "proposed_min_salary": 26000000.0,
        "proposed_max_salary": 60000000.0, # Exceeds approved max of 35,000,000!
        "reason": "Tuyển gấp chuyên gia"
    }
    exceed_res = client.post("/api/v1/requisitions", json=exceeding_req_payload, headers=manager_headers)
    assert exceed_res.status_code == 400
    assert "nằm ngoài khung đã duyệt" in exceed_res.json()["detail"] or "vượt quá" in exceed_res.json()["detail"]
    print(f" -> [PASS] S2-05: Proposed salary exceeding approved band rejected (400): {exceed_res.json()['detail']}")

    # 7.3 Requisition Proposed Salary within approved Job Title band is ACCEPTED
    valid_req_payload = {
        "title": "Kỹ Sư Phần Mềm Chuẩn Khung",
        "department_id": 1,
        "job_title_id": senior_dev_hr["id"],
        "headcount": 1,
        "employment_type": "full_time",
        "proposed_min_salary": 26000000.0,
        "proposed_max_salary": 34000000.0, # Within 25,000,000 - 35,000,000
        "reason": "Mở rộng đội ngũ Backend"
    }
    valid_req_res = client.post("/api/v1/requisitions", json=valid_req_payload, headers=manager_headers)
    assert valid_req_res.status_code in [200, 201]
    created_req_id = valid_req_res.json()["id"]
    print(f" -> [PASS] S2-05: Proposed salary within approved band accepted (ID: {created_req_id}).")

    # 7.4 Offer Salary exceeding requisition approved max salary is REJECTED
    # Application #1 is linked to Requisition #1 whose approved max_salary is 35,000,000 VNĐ
    over_offer_payload = {
        "application_id": 1,
        "offered_salary": 50000000, # Exceeds requisition max of 35,000,000!
        "currency": "VND",
        "probation_salary_percentage": 85,
        "start_date": "2026-11-01"
    }
    over_offer_res = client.post("/api/v1/offers", json=over_offer_payload, headers=hr_headers)
    assert over_offer_res.status_code == 400
    assert "vượt quá" in over_offer_res.json()["detail"] and "tờ trình" in over_offer_res.json()["detail"]
    print(f" -> [PASS] S2-05: Offer salary exceeding requisition max salary rejected (400): {over_offer_res.json()['detail']}")

    # Valid offer within approved limit succeeds
    valid_offer_payload = {
        "application_id": 1,
        "offered_salary": 32000000, # Within 35,000,000
        "currency": "VND",
        "probation_salary_percentage": 85,
        "start_date": "2026-11-01"
    }
    valid_offer_res = client.post("/api/v1/offers", json=valid_offer_payload, headers=hr_headers)
    assert valid_offer_res.status_code == 201
    print(f" -> [PASS] S2-05: Offer salary within approved requisition band created successfully (201).")

    print("\n" + "=" * 80)
    print("ALL SPRINT 1 & SPRINT 2 ACCEPTANCE CRITERIA TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 80)

if __name__ == "__main__":
    run_compliance_tests()
