import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1"

def print_res(name, response, expected_status):
    status_match = "PASS" if response.status_code == expected_status else f"FAIL (Got {response.status_code})"
    print(f"[{status_match}] {name} -> Expected HTTP {expected_status}, Got HTTP {response.status_code}")
    try:
        data = response.json()
        print(f"   Response Payload: {json.dumps(data, ensure_ascii=False)[:180]}...")
    except Exception:
        print(f"   Raw Text: {response.text[:100]}")
    print("-" * 70)

def run_tests():
    print("======================================================================")
    print("   ENTERPRISE SYSTEM RBAC & HTTP STATUS CODE AUTOMATED VERIFICATION   ")
    print("======================================================================\n")

    # 1. Login Admin to get Token
    admin_login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@company.com", "password": "company123"}
    )
    admin_token = admin_login_res.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[KEY] Admin Token obtained successfully.")

    # 2. Login Employee to get Token (Non-admin)
    # Register employee user if not present
    emp_reg_res = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": "employee_test@company.com",
            "password": "password123",
            "full_name": "Nhân Viên Test",
            "phone": "0988888888",
            "department_id": "dept-1"
        }
    )
    emp_login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "employee_test@company.com", "password": "password123"}
    )
    emp_token = emp_login_res.json().get("access_token")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print("[KEY] Employee Token obtained successfully.\n")

    # --- TEST CASES ---

    # Case 1: 401 Unauthorized (No Authorization Header)
    res = requests.get(f"{BASE_URL}/auth/users")
    print_res("401 Check - GET /auth/users without token", res, 401)

    # Case 2: 401 Unauthorized (Invalid / Corrupted Bearer Token)
    res = requests.get(f"{BASE_URL}/auth/users", headers={"Authorization": "Bearer invalid_token_xxx"})
    print_res("401 Check - GET /auth/users with invalid token", res, 401)

    # Case 3: 403 Forbidden (Employee trying to access Admin Users endpoint)
    res = requests.get(f"{BASE_URL}/auth/users", headers=emp_headers)
    print_res("403 Check - GET /auth/users with Employee role", res, 403)

    # Case 4: 403 Forbidden (Employee trying to create Department)
    res = requests.post(
        f"{BASE_URL}/master-data/departments",
        json={"code": "DEPT-FORBID", "name": "Test Forbid Dept"},
        headers=emp_headers
    )
    print_res("403 Check - POST /master-data/departments with Employee role", res, 403)

    # Case 5: 200 OK (Admin getting user list)
    res = requests.get(f"{BASE_URL}/auth/users", headers=admin_headers)
    print_res("200 Check - GET /auth/users with Admin role", res, 200)

    # Case 6: 201 Created (Admin creating new Department)
    res = requests.post(
        f"{BASE_URL}/master-data/departments",
        json={
            "code": f"DEPT-TEST-{int(requests.get(f'{BASE_URL}/master-data/departments', headers=admin_headers).json().__len__())}",
            "name": "Phòng Thử Nghiệm Phân Quyền",
            "managerName": "Nguyễn Văn Admin",
            "managerTitle": "Trưởng Phòng"
        },
        headers=admin_headers
    )
    print_res("201 Check - POST /master-data/departments with Admin role", res, 201)

    # Case 7: 404 Not Found (Getting non-existent Job)
    res = requests.get(f"{BASE_URL}/jobs/job-non-existent-9999", headers=admin_headers)
    print_res("404 Check - GET /jobs/job-non-existent-9999", res, 404)

    # Case 8: 422 Unprocessable Entity (Missing required email field in registration)
    res = requests.post(f"{BASE_URL}/auth/register", json={"full_name": "Thiếu Email"})
    print_res("422 Check - POST /auth/register with missing fields", res, 422)

    print("[DONE] All automated compliance tests finished!")

if __name__ == "__main__":
    run_tests()
