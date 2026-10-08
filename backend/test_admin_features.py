import os
import sys
import io
import openpyxl
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from seed import reset_and_seed_database

client = TestClient(app)

def run_tests():
    print("=========================================================================")
    print("[1/5] RESETTING & SEEDING DATABASE FOR TEST RUN...")
    print("=========================================================================")
    reset_and_seed_database()

    # Step 1: Login as Admin
    print("\n[2/5] TESTING ADMIN AUTHENTICATION & OVERRIDE PERMISSIONS...")
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@company.com", "password": "password123"})
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    admin_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    print(" -> Admin Login PASS")

    # Step 2: Test Multi-Role Assignment & Roles List
    print("\n[3/5] TESTING MULTI-ROLE ASSIGNMENT & GET ROLES LIST...")
    roles_res = client.get("/api/v1/admin/roles", headers=headers)
    assert roles_res.status_code == 200, f"Get roles list failed: {roles_res.text}"
    roles = roles_res.json()
    assert len(roles) == 7, f"Expected 7 roles, got {len(roles)}"
    print(f" -> Get 7 Roles List PASS (Found {len(roles)} roles)")

    # Update User Roles to multi-roles (hiring_manager + hr_manager)
    update_role_res = client.put(
        "/api/v1/admin/users/3/roles",
        json={"roles": ["hiring_manager", "hr_manager"]},
        headers=headers
    )
    assert update_role_res.status_code == 200, f"Update roles failed: {update_role_res.text}"
    user_data = update_role_res.json()
    assert set(user_data["roles"]) == {"hiring_manager", "hr_manager"}, f"Unexpected roles: {user_data['roles']}"
    print(" -> Multi-Role Assignment PASS (User #3 assigned hiring_manager + hr_manager)")

    # Step 3: Test Password Change & Admin Reset Password
    print("\n[4/5] TESTING ADMIN RESET PASSWORD & USER CHANGE PASSWORD...")
    reset_pwd_res = client.post(
        "/api/v1/admin/users/3/reset-password",
        json={},
        headers=headers
    )
    assert reset_pwd_res.status_code == 200, f"Reset password failed: {reset_pwd_res.text}"
    new_generated_pwd = reset_pwd_res.json()["new_password"]
    assert len(new_generated_pwd) >= 12, "Auto-generated password too short"
    print(f" -> Admin Auto-Reset Password PASS (Generated: {new_generated_pwd})")

    # Login with new password
    login_user3 = client.post("/api/v1/auth/login", json={"email": "manager@company.com", "password": new_generated_pwd})
    assert login_user3.status_code == 200, "Login with reset password failed"
    user3_token = login_user3.json()["access_token"]
    user3_headers = {"Authorization": f"Bearer {user3_token}"}

    # Change password
    change_pwd_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": new_generated_pwd, "new_password": "NewSecurePass123"},
        headers=user3_headers
    )
    assert change_pwd_res.status_code == 200, f"Change password failed: {change_pwd_res.text}"
    print(" -> User Change Password PASS")

    # Step 4: Test Excel Import Validation & Template Download
    print("\n[5/5] TESTING EXCEL IMPORT VALIDATION & TEMPLATE STREAMING...")
    # Test 4a: Template Download
    tpl_res = client.get("/api/v1/admin/users/import/template", headers=headers)
    assert tpl_res.status_code == 200, f"Template download failed: {tpl_res.status_code}"
    assert tpl_res.headers["content-disposition"].startswith("attachment"), "Header content-disposition missing"
    print(" -> Excel Template Stream Download PASS")

    # Test 4b: Import Invalid Excel (Missing required Header columns)
    invalid_wb = openpyxl.Workbook()
    ws_inv = invalid_wb.active
    ws_inv.append(["Cột Tùy Ý 1", "Cột Tùy Ý 2"]) # Missing Họ và tên, Email, Vai trò
    ws_inv.append(["Data 1", "Data 2"])
    inv_buf = io.BytesIO()
    invalid_wb.save(inv_buf)
    inv_buf.seek(0)

    import_invalid_res = client.post(
        "/api/v1/admin/users/import",
        files={"file": ("invalid_template.xlsx", inv_buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        headers=headers
    )
    assert import_invalid_res.status_code == 400, f"Expected 400 for invalid template, got {import_invalid_res.status_code}"
    assert "File Excel không đúng cấu trúc mẫu" in import_invalid_res.json()["detail"], "Expected template validation error message"
    print(" -> Invalid Excel Header Template Validation PASS (HTTP 400 Rejected correctly)")

    # Test 4c: Import Valid Excel
    valid_wb = openpyxl.Workbook()
    ws_val = valid_wb.active
    ws_val.append(["Họ và tên", "Email", "Vai trò", "Số điện thoại", "Mã nhân viên", "Mật khẩu ban đầu"])
    ws_val.append(["Đặng Văn Import 1", "import_user1@company.com", "hr_manager,recruiter", "0981112223", "NV-IMP-01", "Pass123456"])
    ws_val.append(["Bùi Thị Import 2", "import_user2@company.com", "hiring_manager", "0982223334", "NV-IMP-02", "Pass123456"])
    val_buf = io.BytesIO()
    valid_wb.save(val_buf)
    val_buf.seek(0)

    import_valid_res = client.post(
        "/api/v1/admin/users/import",
        files={"file": ("valid_template.xlsx", val_buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        headers=headers
    )
    assert import_valid_res.status_code == 200, f"Import valid excel failed: {import_valid_res.text}"
    import_report = import_valid_res.json()
    assert import_report["imported"] == 2, f"Expected 2 imported, got {import_report['imported']}"
    print(" -> Valid Excel Import PASS (Successfully imported 2 users)")

    # Test 4d: Real DB Audit Logs & RBAC Permissions Matrix
    print("\n[6/6] TESTING REAL DATABASE AUDIT LOGS & RBAC PERMISSIONS MATRIX...")
    audit_res = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200, f"Get audit logs failed: {audit_res.text}"
    logs = audit_res.json()
    assert len(logs) > 0, "Expected at least 1 audit log from DB"
    print(f" -> Real DB Audit Logs PASS (Retrieved {len(logs)} logs from Database)")

    perm_res = client.get("/api/v1/admin/permissions/matrix", headers=headers)
    assert perm_res.status_code == 200, f"Get permissions matrix failed: {perm_res.text}"
    matrix = perm_res.json()
    assert len(matrix) > 0, "Expected non-empty permissions matrix"
    print(f" -> Real DB RBAC Permissions Matrix PASS (Retrieved {len(matrix)} modules from Database)")

    print("\n=========================================================================")
    print("[SUCCESS] ALL BACKEND ADMIN & MULTI-ROLE SECURITY TESTS PASSED PERFECTLY!")
    print("=========================================================================\n")

if __name__ == "__main__":
    run_tests()
