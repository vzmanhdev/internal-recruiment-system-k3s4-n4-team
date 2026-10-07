import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("RUNNING COMPLETE BACKEND API INTEGRATION TEST SUITE")
    print("==================================================")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("[PASS] Health Check OK:", res.json())

    # 2. Auth Login
    res = client.post("/api/v1/auth/login", json={"email": "admin@company.com", "password": "company123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    print("[PASS] Auth Login OK, token retrieved")

    # 3. Get Departments
    res = client.get("/api/v1/master-data/departments")
    assert res.status_code == 200
    depts = res.json()
    assert len(depts) >= 1
    print(f"[PASS] Master Data Departments OK ({len(depts)} departments found)")

    # 4. Create New Department
    new_dept_payload = {
        "code": "AI-CENTER",
        "name": "Trung Tâm Trí Tuệ Nhân Tạo (AI Center)",
        "managerName": "Nguyễn Văn AI",
        "managerTitle": "Lead AI Scientist",
        "headcountCurrent": 2,
        "headcountBudget": 10
    }
    res = client.post("/api/v1/master-data/departments", json=new_dept_payload)
    assert res.status_code == 201
    created_dept = res.json()
    print("[PASS] Create Department OK:", created_dept["name"])

    # 5. Get Salary Bands
    res = client.get("/api/v1/master-data/salary-bands")
    assert res.status_code == 200
    bands = res.json()
    assert len(bands) >= 1
    print(f"[PASS] Master Data Salary Bands OK ({len(bands)} salary bands found)")

    # 6. Get Jobs
    res = client.get("/api/v1/jobs")
    assert res.status_code == 200
    jobs = res.json()
    assert len(jobs) >= 1
    print(f"[PASS] Jobs Endpoint OK ({len(jobs)} jobs found)")

    # 7. Get Requisitions
    res = client.get("/api/v1/requisitions")
    assert res.status_code == 200
    reqs = res.json()
    assert len(reqs) >= 1
    print(f"[PASS] Requisitions Endpoint OK ({len(reqs)} requisitions found)")

    # 8. Get Analytics KPIs
    res = client.get("/api/v1/analytics/kpis")
    assert res.status_code == 200
    kpis = res.json()
    assert "openJobs" in kpis
    assert "newCvs" in kpis
    print("[PASS] Analytics KPIs Endpoint OK:", kpis["openJobs"])

    # 9. Candidates API Test
    res = client.post("/api/v1/candidates", json={
        "fullName": "Nguyễn Văn Hùng",
        "email": "hung.nguyen@example.com",
        "phone": "0912999888",
        "source": "Employee Referral"
    })
    assert res.status_code == 201
    cand = res.json()
    print("[PASS] Candidate Creation OK:", cand["fullName"])

    # 10. Application API Test
    res = client.post("/api/v1/candidates/applications", json={
        "jobId": "data-analyst",
        "candidateId": cand["id"],
        "stage": "Interview1"
    })
    assert res.status_code == 201
    app_obj = res.json()
    print("[PASS] Application Creation OK:", app_obj["id"])

    # 11. Interview Schedule API Test
    res = client.post("/api/v1/interviews", json={
        "applicationId": app_obj["id"],
        "candidateName": "Nguyễn Văn Hùng",
        "jobTitle": "Data Analyst",
        "interviewers": ["Lê Trưởng Nhóm", "Trần Thị Mai"],
        "startTime": "2026-10-10 09:30"
    })
    assert res.status_code == 201
    int_obj = res.json()
    print("[PASS] Interview Schedule OK:", int_obj["startTime"])

    # 12. Evaluation Scorecard API Test
    res = client.post("/api/v1/interviews/scorecards", json={
        "applicationId": app_obj["id"],
        "interviewerName": "Lê Trưởng Nhóm",
        "overallRecommendation": "Strong Pass",
        "ratings": {"Tư duy phân tích": 5, "SQL & Data": 4},
        "comments": "Ứng viên xuất sắc, nắm vững kỹ năng"
    })
    assert res.status_code == 201
    sc_obj = res.json()
    print("[PASS] Evaluation Scorecard OK:", sc_obj["overallRecommendation"])

    # 13. Offer & Onboarding API Test
    res = client.post("/api/v1/offers", json={
        "applicationId": app_obj["id"],
        "candidateName": "Nguyễn Văn Hùng",
        "positionTitle": "Data Analyst",
        "salary": 25000000,
        "startDate": "2026-11-01"
    })
    assert res.status_code == 201
    off_obj = res.json()
    print("[PASS] Offer Creation OK:", off_obj["salary"])

    res = client.post("/api/v1/offers/onboarding", json={
        "candidateId": cand["id"],
        "candidateName": "Nguyễn Văn Hùng",
        "taskName": "Nộp tài liệu BHXH & Hợp đồng",
        "dueDate": "2026-10-25"
    })
    assert res.status_code == 201
    task_obj = res.json()
    print("[PASS] Onboarding Task Creation OK:", task_obj["taskName"])

    print("\n==================================================")
    print("ALL 13 INTEGRATION TESTS PASSED PERFECTLY!")
    print("==================================================")


if __name__ == "__main__":
    run_tests()
