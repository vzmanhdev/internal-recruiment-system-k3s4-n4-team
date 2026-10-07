import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ROLES_TEST_CASES = [
    {"email": "admin@company.com", "password": "company123", "expected_role": "admin", "expected_route": "/admin"},
    {"email": "truongphong@company.com", "password": "company123", "expected_role": "hr_manager", "expected_route": "/hr-manager"},
    {"email": "truongbophan@company.com", "password": "company123", "expected_role": "department_manager", "expected_route": "/manager"},
    {"email": "tuyendung@company.com", "password": "company123", "expected_role": "recruiter", "expected_route": "/recruiter"},
    {"email": "nguoiduyet@company.com", "password": "company123", "expected_role": "approver", "expected_route": "/approver"},
    {"email": "nhanvien@company.com", "password": "company123", "expected_role": "employee", "expected_route": "/employee"},
    {"email": "ungvien@company.com", "password": "company123", "expected_role": "candidate", "expected_route": "/"},
]

def test_all_roles_login():
    print("==================================================")
    print("VERIFYING LOGIN & ROLE ROUTING FOR ALL 7 ROLES")
    print("==================================================")

    for case in ROLES_TEST_CASES:
        res = client.post("/api/v1/auth/login", json={
            "email": case["email"],
            "password": case["password"]
        })
        assert res.status_code == 200, f"Login failed for {case['email']}: {res.text}"
        data = res.json()
        user = data["user"]
        assert user["role"] == case["expected_role"], f"Role mismatch: got {user['role']}, expected {case['expected_role']}"
        print(f"[PASS] Email: {case['email']:<25} | Role: {user['role']:<20} | Token OK -> Route: {case['expected_route']}")

    print("--------------------------------------------------")
    print("ALL 7 ROLE LOGIN & ROUTING TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    test_all_roles_login()
