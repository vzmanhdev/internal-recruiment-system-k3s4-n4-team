import re
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_auto_employee_code_registration():
    print("==================================================")
    print("TESTING AUTO-GENERATED EMPLOYEE CODE ON REGISTRATION")
    print("==================================================")

    test_email = "new_registrant_test@company.com"
    db = SessionLocal()

    try:
        # Clean up previous test user if exists
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()

        # Submit registration request WITHOUT employee_code
        payload = {
            "full_name": "Trần Văn Mới",
            "email": test_email,
            "password": "Password123!",
            "phone": "0988776655",
            "role": "employee"
        }

        response = client.post("/api/v1/auth/register", json=payload)
        print(f"Response status: {response.status_code}")
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}: {response.text}"

        data = response.json()
        assert "access_token" in data, "Access token must be returned"
        user_info = data.get("user", {})
        
        emp_code = user_info.get("employee_code")
        print(f"Generated Employee Code in Response: {emp_code}")
        assert emp_code is not None, "employee_code must NOT be None"
        assert re.match(r"^NV\d{5}$", emp_code), f"employee_code '{emp_code}' must match pattern ^NV\\d{{5}}$"

        # Check DB record
        db_user = db.query(User).filter(User.email == test_email).first()
        assert db_user is not None, "User record must exist in DB"
        assert db_user.employee_code == emp_code, "DB employee_code must match generated code"
        print(f"PASS: User {db_user.email} successfully created with DB employee_code: {db_user.employee_code}")

        # Clean up
        db.delete(db_user)
        db.commit()
        print("[CLEANUP] Deleted test user successfully.")

        print("\n==================================================")
        print("TEST PASSED 100% SUCCESSFULLY!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[TEST ERROR] Test failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_auto_employee_code_registration()
