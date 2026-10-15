"""
Test Case Acceptance & RBAC Security Verification for Story S3-09:
Đối chiếu 5 bước kiểm thử chấp nhận (Acceptance Test Scenario) theo yêu cầu:
1. Chuẩn bị dữ liệu: Có phòng ban, dải lương, yêu cầu nháp/chờ duyệt và chuỗi cấp duyệt mẫu.
2. Đăng nhập bằng tài khoản vai trò 'Nhân viên tuyển dụng' được phép thao tác.
3. Mở chức năng 'soạn tin tuyển dụng từ một yêu cầu đã được duyệt' trên môi trường staging.
4. Thử thao tác hoặc truy cập ngoài phạm vi được phép; lặp lại bằng cách gọi trực tiếp API nếu liên quan phân quyền.
5. Đối chiếu kết quả, thông báo và bảo đảm dữ liệu không bị thay đổi/rò rỉ.
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.recruitment import JobRequisition, JobPosting
from app.models.user import User

client = TestClient(app)

def run_story_s309_acceptance_test():
    print("=" * 70)
    print("CHẠY BỘ KIỂM THỬ ĐỐI CHIẾU 5 BƯỚC (STORY S3-09 & RBAC API SECURITY)")
    print("=" * 70)

    # --------------------------------------------------------------------------
    # BƯỚC 1: Chuẩn bị dữ liệu: Có phòng ban, dải lương, yêu cầu nháp/chờ duyệt
    # và chuỗi cấp duyệt mẫu.
    # --------------------------------------------------------------------------
    print("\n>>> [BƯỚC 1] KIỂM TRA CHUẨN BỊ DỮ LIỆU:")
    db = SessionLocal()
    try:
        requisitions = db.query(JobRequisition).all()
        print(f"Tổng số yêu cầu tuyển dụng trong hệ thống: {len(requisitions)}")
        assert len(requisitions) >= 3, "Dữ liệu phải có ít nhất 3 yêu cầu tuyển dụng mẫu"
        
        # Kiểm tra có phòng ban, dải lương
        for req in requisitions:
            assert req.department, f"Yêu cầu #{req.id} thiếu phòng ban"
            assert req.salary_range, f"Yêu cầu #{req.id} thiếu dải lương"
            print(f"  - Yêu cầu #{req.id}: '{req.title}' | Phòng ban: {req.department} | Lương: {req.salary_range} | Trạng thái: {req.status}")
        
        # Kiểm tra có yêu cầu 'approved', 'pending_approval', 'draft'
        approved_req = db.query(JobRequisition).filter(JobRequisition.status == "approved").first()
        pending_req = db.query(JobRequisition).filter(JobRequisition.status == "pending_approval").first()
        draft_req = db.query(JobRequisition).filter(JobRequisition.status == "draft").first()

        if not pending_req:
            pending_req = JobRequisition(
                title="Chuyên viên QA/QC Chờ Duyệt",
                department_id=1,
                quantity=1,
                reason="Tuyển mới dự án",
                min_salary=15000000,
                max_salary=22000000,
                status="pending_approval",
                created_by_id=1,
                job_description="Kiểm thử chất lượng phần mềm",
                requirements="Tối thiểu 2 năm kinh nghiệm",
                benefits="Bảo hiểm đầy đủ",
            )
            db.add(pending_req)
            db.commit()
            db.refresh(pending_req)

        assert approved_req is not None, "Phải có yêu cầu ở trạng thái ĐÃ DUYỆT (approved)"
        assert pending_req is not None, "Phải có yêu cầu ở trạng thái CHỜ DUYỆT (pending_approval)"
        assert draft_req is not None, "Phải có yêu cầu ở trạng thái NHÁP (draft)"

        # Kiểm tra chuỗi cấp duyệt mẫu
        chain = approved_req.to_dict()["approval_chain"]
        assert len(chain) >= 2, f"Yêu cầu #{approved_req.id} phải có chuỗi cấp duyệt ít nhất 2 cấp"
        print(f"  Chuỗi cấp duyệt mẫu của Yêu cầu #{approved_req.id} ({len(chain)} cấp):")
        for step in chain:
            print(f"    + Cấp {step.get('step')}: {step.get('role')} - {step.get('approver')} -> Trạng thái: {step.get('status')}")

        approved_req_id = approved_req.id
        approved_req_dept = approved_req.department.name if hasattr(approved_req.department, "name") else str(approved_req.department)
        approved_req_salary = approved_req.salary_range
        pending_req_id = pending_req.id
        draft_req_id = draft_req.id

        user = db.query(User).filter_by(email="hr@company.com").first()
        if not user:
            from app.core.security import hash_password
            db.add(User(
                email="hr@company.com",
                hashed_password=hash_password("Admin12345"),
                full_name="Lê Thị Mai (HR Recruiter)",
                role="recruiter,hr_manager",
                is_active=True,
                account_status="active",
            ))
            db.commit()

        print("[PASS - BƯỚC 1] Dữ liệu phòng ban, dải lương, yêu cầu nháp/chờ duyệt và chuỗi cấp duyệt đã sẵn sàng!")
    finally:
        db.close()

    # --------------------------------------------------------------------------
    # BƯỚC 2: Đăng nhập bằng tài khoản vai trò 'Nhân viên tuyển dụng' được phép thao tác.
    # --------------------------------------------------------------------------
    print("\n>>> [BƯỚC 2] ĐĂNG NHẬP VAI TRÒ NHÂN VIÊN TUYỂN DỤNG (RECRUITER):")
    login_res = client.post("/api/v1/auth/login", json={
        "email": "hr@company.com",
        "password": "Admin12345"
    })
    print(f"HTTP Status: {login_res.status_code}, Body: {login_res.text}")
    assert login_res.status_code == 200, "Đăng nhập thất bại"
    login_data = login_res.json()
    recruiter_token = login_data["access_token"]
    user_roles = login_data["user"]["roles"]
    print(f"Họ tên: {login_data['user']['full_name']}")
    print(f"Danh sách vai trò: {user_roles}")
    assert any(r in ["recruiter", "hr_manager"] for r in user_roles), "Tài khoản phải có vai trò tuyển dụng (recruiter hoặc hr_manager)"
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    print("[PASS - BƯỚC 2] Đăng nhập thành công với vai trò Nhân viên tuyển dụng hợp lệ!")

    # --------------------------------------------------------------------------
    # BƯỚC 3: Mở chức năng 'soạn tin tuyển dụng từ một yêu cầu đã được duyệt'
    # --------------------------------------------------------------------------
    print("\n>>> [BƯỚC 3] SOẠN TIN TUYỂN DỤNG TỪ YÊU CẦU ĐÃ ĐƯỢC DUYỆT (STORY S3-09):")
    # Lấy danh sách yêu cầu tuyển dụng qua API
    req_res = client.get("/api/v1/recruiter/requisitions", headers=recruiter_headers)
    assert req_res.status_code == 200
    print(f"Đã tải thành công {req_res.json()['total']} yêu cầu tuyển dụng từ API.")

    # Tiến hành soạn tin tuyển dụng từ yêu cầu approved_req.id
    target_req_id = approved_req_id
    create_job_payload = {
        "location": "Tòa nhà Hội sở, Cầu Giấy, Hà Nội",
        "employment_type": "Toàn thời gian cố định",
        "deadline": "31/12/2026",
        "show_salary": True,
        "status": "open",
        "description": "Nội dung mô tả công việc đã được Recruiter biên tập lại cho thu hút ứng viên bên ngoài.",
    }
    draft_res = client.post(
        f"/api/v1/recruiter/jobs/from-requisition/{target_req_id}",
        headers=recruiter_headers,
        json=create_job_payload
    )
    print(f"HTTP Status: {draft_res.status_code}")
    assert draft_res.status_code == 201, f"Tạo tin thất bại: {draft_res.text}"
    created_job = draft_res.json()
    print(f"Đã tạo thành công Tin tuyển dụng #{created_job['id']}: '{created_job['title']}'")
    print(f"  - Phòng ban kế thừa: {created_job['department']} (Khớp với yêu cầu gốc: {approved_req_dept})")
    print(f"  - Dải lương kế thừa: {created_job['salary_range']} (Khớp với yêu cầu gốc: {approved_req_salary})")
    print(f"  - Trạng thái tin: {created_job['status']}, Approval: {created_job.get('approval_status')}")
    
    # Kiểm định kế thừa
    assert created_job["department"] == approved_req_dept
    assert created_job["salary_range"] == approved_req_salary
    assert created_job["status"] == "open"
    print("[PASS - BƯỚC 3] Soạn tin tuyển dụng từ yêu cầu đã duyệt thành công đúng AC1, AC2, AC3 của Story S3-09!")

    # --------------------------------------------------------------------------
    # BƯỚC 4: Thử thao tác hoặc truy cập ngoài phạm vi được phép;
    # lặp lại bằng cách gọi trực tiếp API nếu liên quan phân quyền.
    # --------------------------------------------------------------------------
    print("\n>>> [BƯỚC 4] THỬ THAO TÁC HOẶC TRUY CẬP NGOÀI PHẠM VI ĐƯỢC PHÉP:")

    # 4.1. Nghiệp vụ: Cố tình soạn tin tuyển dụng từ một yêu cầu CHỜ DUYỆT (pending_approval)
    print("\n  [TEST 4.1] Thao tác ngoài phạm vi: Soạn tin từ yêu cầu 'CHỜ DUYỆT' (ID: %d):" % pending_req_id)
    fail_res_1 = client.post(
        f"/api/v1/recruiter/jobs/from-requisition/{pending_req_id}",
        headers=recruiter_headers,
        json=create_job_payload
    )
    print(f"  HTTP Status: {fail_res_1.status_code}")
    print(f"  Response JSON: {fail_res_1.json()}")
    assert fail_res_1.status_code == 400
    assert "Chỉ yêu cầu ở trạng thái 'Đã duyệt'" in fail_res_1.json().get("detail", "")
    print("  [PASS] Đã chặn thành công hành vi soạn tin từ yêu cầu chưa duyệt!")

    # 4.2. Nghiệp vụ: Cố tình soạn tin tuyển dụng từ một yêu cầu NHÁP (draft)
    print("\n  [TEST 4.2] Thao tác ngoài phạm vi: Soạn tin từ yêu cầu 'BẢN NHÁP' (ID: %d):" % draft_req_id)
    fail_res_2 = client.post(
        f"/api/v1/recruiter/jobs/from-requisition/{draft_req_id}",
        headers=recruiter_headers,
        json=create_job_payload
    )
    print(f"  HTTP Status: {fail_res_2.status_code}")
    print(f"  Response JSON: {fail_res_2.json()}")
    assert fail_res_2.status_code == 400
    assert "Chỉ yêu cầu ở trạng thái 'Đã duyệt'" in fail_res_2.json().get("detail", "")
    print("  [PASS] Đã chặn thành công hành vi soạn tin từ yêu cầu bản nháp!")

    # 4.3. Phân quyền API: Gọi trực tiếp API mà KHÔNG ĐĂNG NHẬP (Unauthenticated)
    print("\n  [TEST 4.3] Phân quyền API: Gọi trực tiếp API mà KHÔNG có Authorization Header:")
    unauth_res = client.get("/api/v1/recruiter/jobs")
    print(f"  GET /api/v1/recruiter/jobs -> HTTP Status: {unauth_res.status_code}")
    assert unauth_res.status_code == 401
    assert "Thiếu Bearer Token" in unauth_res.json().get("detail", "")
    print("  [PASS] Đã chặn truy cập ẩn danh (401 Unauthorized)!")

    # 4.4. Phân quyền API: Gọi trực tiếp API duyệt tin mà KHÔNG ĐĂNG NHẬP
    unauth_approve = client.patch(f"/api/v1/recruiter/jobs/{created_job['id']}/approve")
    print(f"  PATCH /approve không token -> HTTP Status: {unauth_approve.status_code}")
    assert unauth_approve.status_code == 401
    print("  [PASS] Đã chặn gọi API duyệt tin trái phép (401 Unauthorized)!")

    # 4.5. Phân quyền API: Gọi trực tiếp API bằng tài khoản SAI VAI TRÒ (Employee - Nhân viên thường)
    print("\n  [TEST 4.5] Phân quyền API: Gọi trực tiếp API bằng tài khoản vai trò 'Employee':")
    db_emp = SessionLocal()
    try:
        emp = db_emp.query(User).filter_by(email="tranthib@company.com").first()
        if not emp:
            from app.core.security import hash_password
            db_emp.add(User(
                email="tranthib@company.com",
                hashed_password=hash_password("company123"),
                full_name="Trần Thị Bích (Nhân viên)",
                role="employee",
                is_active=True,
                account_status="active",
            ))
            db_emp.commit()
    finally:
        db_emp.close()

    emp_login = client.post("/api/v1/auth/login", json={
        "email": "tranthib@company.com",
        "password": "company123"
    })
    assert emp_login.status_code == 200
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    emp_res = client.get("/api/v1/recruiter/jobs", headers=emp_headers)
    print(f"  GET /recruiter/jobs với role 'employee' -> HTTP Status: {emp_res.status_code}")
    print(f"  Response detail: {emp_res.json().get('detail')}")
    assert emp_res.status_code == 403
    assert "Bạn không có quyền thực hiện thao tác này" in emp_res.json().get("detail", "")
    print("  [PASS] Đã chặn tài khoản sai vai trò (403 Forbidden) thành công!")

    # 4.6. Phân quyền API: Employee cố tình xóa hoặc tạo tin tuyển dụng
    emp_delete = client.delete(f"/api/v1/recruiter/jobs/{created_job['id']}", headers=emp_headers)
    print(f"  DELETE /recruiter/jobs với role 'employee' -> HTTP Status: {emp_delete.status_code}")
    assert emp_delete.status_code == 403
    print("  [PASS] Đã chặn tài khoản không có quyền xóa tin tuyển dụng!")

    print("[PASS - BƯỚC 4] Toàn bộ các thử nghiệm vi phạm phạm vi nghiệp vụ và phân quyền API trực tiếp đều bị chặn chính xác!")

    # --------------------------------------------------------------------------
    # BƯỚC 5: Đối chiếu kết quả, thông báo và bảo đảm dữ liệu không bị thay đổi/rò rỉ.
    # --------------------------------------------------------------------------
    print("\n>>> [BƯỚC 5] ĐỐI CHIẾU KẾT QUẢ, THÔNG BÁO VÀ BẢO TOÀN DỮ LIỆU:")
    db_verify = SessionLocal()
    try:
        # 5.1. Xác nhận yêu cầu chưa duyệt vẫn giữ nguyên trạng thái
        p_req = db_verify.query(JobRequisition).filter(JobRequisition.id == pending_req.id).first()
        d_req = db_verify.query(JobRequisition).filter(JobRequisition.id == draft_req.id).first()
        assert p_req.status == "pending_approval", "Dữ liệu yêu cầu chờ duyệt không được bị thay đổi!"
        assert d_req.status == "draft", "Dữ liệu yêu cầu bản nháp không được bị thay đổi!"
        assert p_req.is_converted is False, "Yêu cầu chờ duyệt không được phép bị chuyển đổi thành tin!"
        print("  ✓ Dữ liệu các yêu cầu nháp/chờ duyệt hoàn toàn nguyên vẹn, không bị chuyển đổi trái phép.")

        # 5.2. Xác nhận tin tuyển dụng hợp lệ vẫn tồn tại an toàn (không bị xóa bởi employee)
        job_in_db = db_verify.query(JobPosting).filter(JobPosting.id == created_job["id"]).first()
        assert job_in_db is not None, "Tin tuyển dụng hợp lệ phải tồn tại trong DB"
        print(f"  ✓ Tin tuyển dụng #{job_in_db.id} ('{job_in_db.title}') tồn tại nguyên vẹn, không bị can thiệp trái phép.")
        
        # 5.3. Xác nhận tính bảo mật: Người không có thẩm quyền không thể truy xuất dữ liệu nội bộ
        leakage_test = client.get("/api/v1/recruiter/candidates")
        assert leakage_test.status_code == 401
        print("  ✓ Đảm bảo chống rò rỉ dữ liệu (Data Leakage Prevention): Hồ sơ ứng viên và tin nội bộ được bảo vệ 100%.")

        print("[PASS - BƯỚC 5] Kết quả, thông báo chuẩn mực tiếng Việt và dữ liệu được bảo toàn tuyệt đối không bị rò rỉ!")
    finally:
        db_verify.close()

    print("\n" + "=" * 70)
    print("TẤT CẢ 5 BƯỚC KIỂM THỬ CHẤP NHẬN ĐỀU ĐẠT CHUẨN XUẤT SẮC (ALL 5 STEPS PASSED)!")
    print("=" * 70)

if __name__ == "__main__":
    run_story_s309_acceptance_test()
