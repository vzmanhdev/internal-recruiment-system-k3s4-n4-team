import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')


from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_competencies_flow():
    print("=== TESTING COMPETENCY FRAMEWORKS & QUESTIONS CRUD API ===")

    # 1. GET ALL FRAMEWORKS
    res = client.get("/api/v1/competencies/frameworks")
    assert res.status_code == 200, f"Get frameworks failed: {res.text}"
    frameworks = res.json()
    print(f"[SUCCESS] GET /frameworks returned {len(frameworks)} frameworks.")
    assert len(frameworks) >= 2, "Expected at least 2 seeded frameworks."

    # Verify initial seeded criteria weights sum to 100
    for fw in frameworks:
        criteria_sum = sum(c["weight"] for c in fw["criteriaList"])
        print(f"  - Framework {fw['code']} ('{fw['name']}'): {len(fw['criteriaList'])} criteria, total weight = {criteria_sum}%")
        assert criteria_sum == 100, f"Seeded framework {fw['code']} total weight != 100%"

    # 2. CREATE A NEW FRAMEWORK WITH WEIGHT VALIDATION
    # 2a. Invalid Weight Sum (e.g., 90%) -> Expect 400 Bad Request
    invalid_fw = {
        "code": "CF-TEST-FAIL",
        "name": "Khung Thử Nghiệm Tải Trọng Thất Bại",
        "department": "Khối Công Nghệ",
        "appliedJobTitles": ["Junior Engineer"],
        "criteriaList": [
            {"code": "TC-01", "name": "Chuyên môn", "weight": 50},
            {"code": "TC-02", "name": "Kỹ năng mềm", "weight": 40}
        ]
    }

    res_fail = client.post("/api/v1/competencies/frameworks", json=invalid_fw)
    assert res_fail.status_code == 400, f"Expected 400 for invalid weight sum, got {res_fail.status_code}"
    print(f"[SUCCESS] Rejection of invalid weight sum (90%) confirmed: {res_fail.json()['detail']}")

    # 2b. Valid Framework (Weight Sum = 100%) -> Expect 201 Created
    valid_fw = {
        "code": "CF-TEST-PASS",
        "name": "Khung Thử Nghiệm CSDL Chuẩn",
        "department": "Khối Công Nghệ & Sản Phẩm (Technology)",
        "appliedJobTitles": ["Senior Backend Engineer", "Lead Developer"],
        "criteriaList": [
            {"code": "TC-01", "name": "Chuyên môn lập trình", "description": "Clean code & SOLID", "weight": 60},
            {"code": "TC-02", "name": "Tư duy giải quyết vấn đề", "description": "Debugging & Profiling", "weight": 40}
        ]
    }
    res_pass = client.post("/api/v1/competencies/frameworks", json=valid_fw)
    assert res_pass.status_code == 201, f"Create framework failed: {res_pass.text}"
    created_fw = res_pass.json()
    print(f"[SUCCESS] Created Framework ID '{created_fw['id']}' with code '{created_fw['code']}'.")

    # 3. UPDATE FRAMEWORK
    update_data = {
        "name": "Khung Thử Nghiệm CSDL (Đã Cập Nhật)",
        "criteriaList": [
            {"code": "TC-01", "name": "Chuyên môn lập trình", "description": "Tối ưu hóa performance", "weight": 50},
            {"code": "TC-02", "name": "Tư duy kiến trúc", "description": "Microservices & Database", "weight": 50}
        ]
    }
    res_update = client.put(f"/api/v1/competencies/frameworks/{created_fw['id']}", json=update_data)
    assert res_update.status_code == 200, f"Update framework failed: {res_update.text}"
    updated_fw = res_update.json()
    print(f"[SUCCESS] Updated Framework '{updated_fw['name']}', new criteria count: {len(updated_fw['criteriaList'])}.")

    # 4. GET ALL QUESTIONS
    res_q = client.get("/api/v1/competencies/questions")
    assert res_q.status_code == 200, f"Get questions failed: {res_q.text}"
    questions = res_q.json()
    print(f"[SUCCESS] GET /questions returned {len(questions)} questions.")
    assert len(questions) >= 6, "Expected at least 6 seeded questions."

    # 5. CREATE A NEW INTERVIEW QUESTION
    new_q = {
        "code": "Q-TEST-99",
        "content": "Hãy mô tả cách bạn tối ưu hóa một truy vấn SQL chậm bằng EXPLAIN ANALYZE?",
        "criteriaName": "Kiến trúc hệ thống & Thiết kế CSDL",
        "jobTitle": "Senior Backend Engineer",
        "difficulty": "hard",
        "suggestedAnswer": "Xem xét B-Tree index, tránh Seq Scan, kiểm tra cost & actual time."
    }
    res_cq = client.post("/api/v1/competencies/questions", json=new_q)
    assert res_cq.status_code == 201, f"Create question failed: {res_cq.text}"
    created_q = res_cq.json()
    print(f"[SUCCESS] Created Question ID '{created_q['id']}' ({created_q['code']}).")

    # 6. DELETE UNREFERENCED QUESTION
    res_dq = client.delete(f"/api/v1/competencies/questions/{created_q['id']}")
    assert res_dq.status_code == 204, f"Delete question failed: {res_dq.text}"
    print(f"[SUCCESS] Deleted Question '{created_q['code']}' successfully.")

    # 7. DELETE REFERENCED QUESTION SHOULD FAIL (400)
    ref_q = next(q for q in questions if q["is_referenced"])
    res_d_ref = client.delete(f"/api/v1/competencies/questions/{ref_q['id']}")
    assert res_d_ref.status_code == 400, f"Expected 400 when deleting referenced question, got {res_d_ref.status_code}"
    print(f"[SUCCESS] Rejection of deleting referenced question '{ref_q['code']}' confirmed: {res_d_ref.json()['detail']}")

    # 8. CLEANUP CREATED FRAMEWORK
    res_df = client.delete(f"/api/v1/competencies/frameworks/{created_fw['id']}")
    assert res_df.status_code == 204
    print(f"[SUCCESS] Cleaned up created framework '{created_fw['id']}'.")

    print("\nALL API TESTS PASSED 100%! PERSISTENCE VERIFIED.")

if __name__ == "__main__":
    test_competencies_flow()
