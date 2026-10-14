"""RBAC catalogue: roles, permission codes and the default grant matrix.

Kept free of app imports so the dev bootstrap (run while app.main is importing) and Alembic can use it.
"""

ROLES_DATA = [
    {"code": "admin", "name": "Quản trị viên", "description": "Toàn quyền quản trị hệ thống và truy cập Admin Console"},
    {"code": "hr_manager", "name": "Trưởng phòng HR", "description": "Quản lý tổng quan tuyển dụng, định biên và quy trình"},
    {"code": "recruiter", "name": "Chuyên viên Tuyển dụng", "description": "Thực thi đăng tuyển, lọc hồ sơ và điều phối ứng viên"},
    {"code": "hiring_manager", "name": "Trưởng bộ phận", "description": "Khởi tạo đề xuất nhu cầu và quyết định tuyển dụng"},
    {"code": "interviewer", "name": "Người phỏng vấn", "description": "Tham gia đánh giá và nộp phiếu phỏng vấn ứng viên"},
    {"code": "approver", "name": "Người duyệt", "description": "Phê duyệt các đề xuất tuyển dụng và đề nghị Offer"},
    {"code": "employee", "name": "Nhân sự nội bộ", "description": "Xem cơ hội việc làm nội bộ, giới thiệu ứng viên và cập nhật hồ sơ"},
    {"code": "candidate", "name": "Ứng viên", "description": "Ứng viên bên ngoài: theo dõi hồ sơ, lịch phỏng vấn và thư mời nhận việc của chính mình"},
]

PERMISSIONS_DATA = [
    # Quản lý người dùng & hệ thống
    {"code": "user:view", "name": "Xem danh sách người dùng", "module": "Quản lý Người Dùng & Tài Khoản"},
    {"code": "user:create", "name": "Khởi tạo tài khoản mới", "module": "Quản lý Người Dùng & Tài Khoản"},
    {"code": "user:edit", "name": "Cập nhật thông tin người dùng", "module": "Quản lý Người Dùng & Tài Khoản"},
    {"code": "user:lock", "name": "Khóa/Mở khóa tài khoản", "module": "Quản lý Người Dùng & Tài Khoản"},
    {"code": "user:reset_password", "name": "Đặt lại mật khẩu người dùng", "module": "Quản lý Người Dùng & Tài Khoản"},
    {"code": "permission:manage", "name": "Quản lý Ma trận phân quyền RBAC", "module": "Quản lý Người Dùng & Tài Khoản"},
    
    # Yêu cầu tuyển dụng
    {"code": "requisition:view", "name": "Xem yêu cầu tuyển dụng", "module": "Yêu Cầu Tuyển Dụng"},
    {"code": "requisition:create", "name": "Tạo mới yêu cầu tuyển dụng", "module": "Yêu Cầu Tuyển Dụng"},
    {"code": "requisition:edit", "name": "Chỉnh sửa yêu cầu tuyển dụng", "module": "Yêu Cầu Tuyển Dụng"},
    {"code": "requisition:approve", "name": "Phê duyệt yêu cầu tuyển dụng", "module": "Yêu Cầu Tuyển Dụng"},
    
    # Hồ sơ ứng viên
    {"code": "candidate:view", "name": "Xem danh sách ứng viên", "module": "Hồ Sơ Ứng Viên"},
    {"code": "candidate:create", "name": "Thêm hồ sơ ứng viên", "module": "Hồ Sơ Ứng Viên"},
    {"code": "candidate:evaluate", "name": "Đánh giá & chuyển vòng ứng viên", "module": "Hồ Sơ Ứng Viên"},
    {"code": "candidate:view_salary", "name": "Xem thông tin lương mong muốn", "module": "Hồ Sơ Ứng Viên"},
    
    # Lịch & Đánh giá Phỏng vấn
    {"code": "interview:view", "name": "Xem lịch phỏng vấn", "module": "Phỏng Vấn"},
    {"code": "interview:schedule", "name": "Lên lịch phỏng vấn", "module": "Phỏng Vấn"},
    {"code": "interview:evaluate", "name": "Nộp phiếu đánh giá phỏng vấn", "module": "Phỏng Vấn"},
    
    # Offer & Onboarding
    {"code": "offer:view", "name": "Xem đề nghị tuyển dụng (Offer)", "module": "Đề Nghị Tuyển Dụng"},
    {"code": "offer:create", "name": "Tạo thư mời nhận việc", "module": "Đề Nghị Tuyển Dụng"},
    {"code": "offer:approve", "name": "Phê duyệt Offer", "module": "Đề Nghị Tuyển Dụng"},
    
    # Giám sát & Nhật ký
    {"code": "audit:view", "name": "Xem nhật ký thao tác hệ thống (Audit Log)", "module": "Giám Sát & Nhật Ký"},
    {"code": "master_data:manage", "name": "Quản lý Danh mục dùng chung", "module": "Dữ Liệu Hệ Thống"},

    # Actions that were previously guarded by hardcoded role names
    {"code": "requisition:assign", "name": "Phân công recruiter cho tờ trình", "module": "Yêu Cầu Tuyển Dụng"},
    {"code": "requisition:close", "name": "Tạm dừng / Hủy / Đóng tờ trình", "module": "Yêu Cầu Tuyển Dụng"},
    {"code": "report:view", "name": "Xem báo cáo & thống kê tuyển dụng", "module": "Báo Cáo & Thống Kê"},
    {"code": "report:manage", "name": "Nhập chi phí tuyển dụng (cost-per-hire)", "module": "Báo Cáo & Thống Kê"},
    {"code": "email:manage", "name": "Quản lý mẫu email & nhật ký gửi", "module": "Email & Thông Báo"},
    {"code": "email:delete", "name": "Xóa mẫu email", "module": "Email & Thông Báo"},
    {"code": "job:manage", "name": "Tạo / sửa / gỡ tin tuyển dụng", "module": "Tin Tuyển Dụng"},
    {"code": "job:publish", "name": "Duyệt & xuất bản tin tuyển dụng", "module": "Tin Tuyển Dụng"},

    # Workspace / module access (who may open a workspace at all; actions inside still need their own permission)
    {"code": "workspace:admin:access", "name": "Truy cập phân hệ Quản trị hệ thống", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:hr:access", "name": "Truy cập phân hệ Quản lý Nhân sự (HR)", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:recruiter:access", "name": "Truy cập phân hệ Chuyên viên tuyển dụng", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:manager:access", "name": "Truy cập phân hệ Trưởng bộ phận", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:interviewer:access", "name": "Truy cập phân hệ Người phỏng vấn", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:approver:access", "name": "Truy cập phân hệ Phê duyệt", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:employee:access", "name": "Truy cập cổng nhân viên (việc làm nội bộ, giới thiệu)", "module": "Truy Cập Phân Hệ"},
    {"code": "workspace:candidate:access", "name": "Truy cập cổng ứng viên (hồ sơ, lịch phỏng vấn, offer của bản thân)", "module": "Truy Cập Phân Hệ"},
]

# Default grants for the workspace permissions (added on top of DEFAULT_GRANTED_MATRIX below).
WORKSPACE_GRANTS = {
    "hr_manager": ["workspace:hr:access", "workspace:employee:access", "requisition:assign", "requisition:close",
                   "report:view", "report:manage", "email:manage", "email:delete", "job:manage", "job:publish"],
    "recruiter": ["workspace:recruiter:access", "workspace:employee:access", "email:manage", "job:manage"],
    "hiring_manager": ["workspace:manager:access", "workspace:employee:access"],
    "interviewer": ["workspace:interviewer:access", "workspace:employee:access"],
    "approver": ["workspace:approver:access", "workspace:employee:access", "report:view"],
    "employee": ["workspace:employee:access"],
    "candidate": ["workspace:candidate:access"],
}

# Baseline role grants for non-admin default matrix
DEFAULT_GRANTED_MATRIX = {
    "hr_manager": ["user:view", "requisition:view", "requisition:create", "requisition:edit", "requisition:approve", "candidate:view", "candidate:create", "candidate:evaluate", "candidate:view_salary", "interview:view", "interview:schedule", "interview:evaluate", "offer:view", "offer:create", "offer:approve", "master_data:manage"],
    "recruiter": ["requisition:view", "candidate:view", "candidate:create", "candidate:evaluate", "interview:view", "interview:schedule", "interview:evaluate", "offer:view", "offer:create"],
    "hiring_manager": ["requisition:view", "requisition:create", "requisition:edit", "candidate:view", "candidate:evaluate", "interview:view", "interview:evaluate"],
    "interviewer": ["interview:view", "interview:evaluate", "candidate:view"],
    "approver": ["requisition:view", "requisition:approve", "offer:view", "offer:approve"],
    "employee": ["requisition:view"],
}
for _role, _codes in WORKSPACE_GRANTS.items():
    DEFAULT_GRANTED_MATRIX.setdefault(_role, []).extend(c for c in _codes if c not in DEFAULT_GRANTED_MATRIX[_role])


def ensure_permission_catalog(bind) -> int:
    """Additively insert permission codes missing from the DB and their default role grants.

    Never modifies existing rows, so matrix changes made by an admin are preserved. Used by the dev
    bootstrap and by Alembic revision e6c3b9a1f4d2. Returns the number of inserted role_permissions rows.
    """
    import sqlalchemy as sa
    tables = set(sa.inspect(bind).get_table_names())
    if not {"permissions", "role_permissions", "roles"} <= tables:
        return 0
    existing = {r[0] for r in bind.execute(sa.text("SELECT code FROM permissions"))}
    new_codes = [p for p in PERMISSIONS_DATA if p["code"] not in existing]
    for p in new_codes:
        bind.execute(sa.text("INSERT INTO permissions (code, name, module) VALUES (:c, :n, :m)"),
                     {"c": p["code"], "n": p["name"], "m": p["module"]})
    inserted = 0
    roles = [r[0] for r in bind.execute(sa.text("SELECT code FROM roles"))]
    for p in new_codes:
        for role in roles:
            if bind.execute(sa.text("SELECT 1 FROM role_permissions WHERE role_code = :r AND permission_code = :c"),
                            {"r": role, "c": p["code"]}).first():
                continue
            granted = role == "admin" or p["code"] in DEFAULT_GRANTED_MATRIX.get(role, [])
            bind.execute(sa.text("INSERT INTO role_permissions (role_code, permission_code, is_granted) VALUES (:r, :c, :g)"),
                         {"r": role, "c": p["code"], "g": granted})
            inserted += 1
    return inserted
