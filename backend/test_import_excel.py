import sys
import time
from fastapi.testclient import TestClient

from app.main import app

def test_bulk_import_endpoint():
    client = TestClient(app)
    ts = int(time.time())
    payload = {
        "users": [
            {
                "full_name": f"Test User Import {ts}_1",
                "email": f"test.import_{ts}_1@company.com",
                "phone": "0988111222",
                "role": "Recruiter",
                "department_id": "dept-1",
                "position_title": "Recruiter",
                "password": "company123"
            },
            {
                "full_name": f"Test User Import {ts}_2",
                "email": f"test.import_{ts}_2@company.com",
                "phone": "0988333444",
                "role": "Interviewer",
                "department_id": "dept-1",
                "position_title": "Interviewer",
                "password": "company123"
            }
        ]
    }

    res = client.post("/api/v1/auth/import-users", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["imported_count"] == 2
    print("STATUS_CODE:", res.status_code)
    print("IMPORTED_COUNT:", data["imported_count"])
    print("SUCCESS: Bulk user import API verified successfully!")


if __name__ == "__main__":
    test_bulk_import_endpoint()

