"""
Test Job Posting Approval & Publishing Flow
Enforces:
1. Recruiter không thể tự ý duyệt bài đăng (Chỉ Admin mới có quyền duyệt).
2. Recruiter tạo bài đăng gắn REQ chưa được duyệt sẽ bị từ chối (400).
3. Bài đăng phải ở trạng thái duyệt thì mới được đưa lên hệ thống (công khai).
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_job_approval_and_publishing():
    print("==================================================")
    print("TESTING JOB POSTING APPROVAL & PUBLISHING FLOW")
    print("==================================================")

    # Đăng nhập vai trò Recruiter lấy token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "hr@company.com",
        "password": "company123"
    })
    assert login_res.status_code == 200, "Đăng nhập HR thất bại"
    recruiter_token = login_res.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {recruiter_token}"}

    # Đăng nhập vai trò Admin lấy token
    admin_login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@company.com",
        "password": "company123"
    })
    assert admin_login_res.status_code == 200, "Đăng nhập Admin thất bại"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Attempt to create a job with unapproved REQ (REQ #2 is pending_approval) -> MUST FAIL (400)
    res_unapproved_req = client.post("/api/v1/recruiter/jobs", headers=hr_headers, json={
        "title": "Chuyên viên SOC Analyst",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 1,
        "salary_range": "25 - 40 Triệu VNĐ",
        "experience_level": "Chuyên viên (2-3 năm)",
        "deadline": "31/12/2026",
        "status": "closed",
        "approval_status": "pending",
        "requisition_id": 2, # Requisition #2 is in pending_approval status
        "description": "Giám sát các cảnh báo bảo mật.",
        "requirements": "2 năm kinh nghiệm SOC.",
        "benefits": "Thưởng dự án.",
    })
    print("\n[TEST 1] Create job with unapproved REQ (REQ #2):")
    print("Status code:", res_unapproved_req.status_code)
    print("Response JSON:", res_unapproved_req.json())
    assert "pending_approval" in res_unapproved_req.json().get("detail", "")
    assert "Đã duyệt" in res_unapproved_req.json().get("detail", "")
    print("[PASS] Blocked creating job attached to unapproved REQ!")

    # 2. Attempt to create an unapproved job with status 'open' -> MUST FAIL (400)
    res = client.post("/api/v1/recruiter/jobs", headers=hr_headers, json={
        "title": "Chuyên viên Kiểm thử QA",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 1,
        "salary_range": "20 - 30 Triệu VNĐ",
        "experience_level": "Mid-level",
        "deadline": "31/12/2026",
        "status": "open",
        "approval_status": "pending",
        "description": "Thực hiện kiểm thử phần mềm cho toàn bộ hệ thống.",
        "requirements": "Ít nhất 2 năm kinh nghiệm Automation Test.",
        "benefits": "Bảo hiểm sức khỏe và thưởng hiệu quả dự án.",
    })
    print("\n[TEST 2] Create job with status 'open' while approval_status is 'pending':")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 400
    assert "phê duyệt" in res.json().get("detail", "") or "duyệt" in res.json().get("detail", "")
    print("[PASS] Blocked publishing unapproved job upon creation!")

    # 3. Create job with status 'closed' and approval_status 'pending' (Draft/Pending Approval) -> SUCCESS
    res = client.post("/api/v1/recruiter/jobs", headers=hr_headers, json={
        "title": "Chuyên viên Kiểm thử QA",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 1,
        "salary_range": "20 - 30 Triệu VNĐ",
        "experience_level": "Mid-level",
        "deadline": "31/12/2026",
        "status": "closed",
        "approval_status": "pending",
        "description": "Thực hiện kiểm thử phần mềm cho toàn bộ hệ thống.",
        "requirements": "Ít nhất 2 năm kinh nghiệm Automation Test.",
        "benefits": "Bảo hiểm sức khỏe và thưởng hiệu quả dự án.",
    })
    print("\n[TEST 3] Create job with status 'closed' and approval_status 'pending':")
    print("Status code:", res.status_code)
    assert res.status_code == 201
    job_id = res.json()["id"]
    assert res.json()["approval_status"] == "pending"
    assert res.json()["status"] == "closed"
    print(f"[PASS] Job #{job_id} created in pending approval status!")

    # 4. Try to publish job #{job_id} before approval -> MUST FAIL
    res = client.patch(f"/api/v1/recruiter/jobs/{job_id}/publish", headers=hr_headers)
    print("\n[TEST 4] Publish job before approval:")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 400
    assert "duyệt" in res.json().get("detail", "")
    print("[PASS] Blocked publishing before approval!")

    # 5. Recruiter tries to self-approve job #{job_id} via PATCH /approve -> MUST FAIL (403 Forbidden)
    res_hr_approve = client.patch(f"/api/v1/recruiter/jobs/{job_id}/approve", headers=hr_headers)
    print("\n[TEST 5a] Recruiter attempts self-approval via PATCH /approve:")
    print("Status code:", res_hr_approve.status_code)
    assert res_hr_approve.status_code == 403
    assert "Admin" in res_hr_approve.json().get("detail", "") or "Quản trị viên" in res_hr_approve.json().get("detail", "")
    print("[PASS] Blocked Recruiter from self-approving job posting!")

    # 5b. Recruiter tries to self-approve via PUT /jobs/{job_id} -> MUST FAIL (403 Forbidden)
    res_hr_put_approve = client.put(f"/api/v1/recruiter/jobs/{job_id}", headers=hr_headers, json={
        "approval_status": "approved"
    })
    print("\n[TEST 5b] Recruiter attempts self-approval via PUT /jobs/{job_id}:")
    print("Status code:", res_hr_put_approve.status_code)
    assert res_hr_put_approve.status_code == 403
    print("[PASS] Blocked Recruiter from self-approving via PUT!")

    # 6. Admin approves job #{job_id} -> SUCCESS (200)
    res_admin_approve = client.patch(f"/api/v1/recruiter/jobs/{job_id}/approve", headers=admin_headers)
    print("\n[TEST 6] Admin approves job:")
    print("Status code:", res_admin_approve.status_code)
    assert res_admin_approve.status_code == 200
    assert res_admin_approve.json()["approval_status"] == "approved"
    print(f"[PASS] Job #{job_id} approved by Admin!")

    # 7. Now publish job #{job_id} -> SUCCESS
    res = client.patch(f"/api/v1/recruiter/jobs/{job_id}/publish", headers=hr_headers)
    print("\n[TEST 7] Publish job after Admin approval:")
    print("Status code:", res.status_code)
    assert res.status_code == 200
    assert res.json()["status"] == "open"
    assert res.json()["approval_status"] == "approved"
    print(f"[PASS] Job #{job_id} successfully published after approval!")

    # 8. Demote from approved+open to pending via PUT (auto status='closed')
    res = client.put(f"/api/v1/recruiter/jobs/{job_id}", headers=hr_headers, json={
        "title": "Chuyên viên Kiểm thử QA (Cập nhật)",
        "department": "Khối Công nghệ",
        "location": "Hà Nội",
        "employment_type": "Toàn thời gian",
        "openings": 2,
        "salary_range": "20 - 30 Triệu VNĐ",
        "experience_level": "Mid-level",
        "deadline": "31/12/2026",
        "status": "open",
        "approval_status": "pending",
        "description": "Thực hiện kiểm thử phần mềm cho toàn bộ hệ thống.",
        "requirements": ["Kinh nghiệm Automation Test 2 năm", "Biết Python / Selenium"],
        "benefits": ["Thưởng dự án", "Bảo hiểm sức khỏe"],
    })
    print("\n[TEST 8] Demote from approved to pending via PUT:")
    print("Status code:", res.status_code)
    assert res.status_code == 200
    assert res.json()["approval_status"] == "pending"
    assert res.json()["status"] == "closed"
    print(f"[PASS] Job #{job_id} demoted to pending, status auto-closed!")

    # 9. Admin re-approves job and recruiter opens it
    client.patch(f"/api/v1/recruiter/jobs/{job_id}/approve", headers=admin_headers)
    client.patch(f"/api/v1/recruiter/jobs/{job_id}/publish", headers=hr_headers)

    # 10. Admin rejects job via PATCH /reject -> SUCCESS
    res_reject = client.patch(f"/api/v1/recruiter/jobs/{job_id}/reject", headers=admin_headers)
    print("\n[TEST 10] Admin rejects job via PATCH /reject:")
    print("Status code:", res_reject.status_code)
    assert res_reject.status_code == 200
    assert res_reject.json()["approval_status"] == "rejected"
    assert res_reject.json()["status"] == "closed"
    print(f"[PASS] Quick demote to rejected by Admin succeeded!")

    # 11. Test GET /jobs?status=rejected filter
    res = client.get("/api/v1/recruiter/jobs?status=rejected", headers=hr_headers)
    print("\n[TEST 11] Filter jobs by status=rejected:")
    print("Status code:", res.status_code)
    assert res.status_code == 200
    rejected_ids = [j["id"] for j in res.json()["items"]]
    assert job_id in rejected_ids
    print(f"[PASS] Filter by rejected returned job #{job_id} correctly!")

    print("\n==================================================")
    print("ALL JOB POSTING APPROVAL & DEMOTION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_job_approval_and_publishing()
