from app.db.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.master_data import Department, SalaryBand
from app.models.job import JobPosting
from app.models.requisition import Requisition
from app.core.security import hash_password, verify_password

SYSTEM_ROLES = [
    {
        "email": "admin@company.com",
        "password": "company123",
        "full_name": "Admin System",
        "role": "admin",
        "phone": "0987654321",
        "position_title": "Quản Trị Viên Hệ Thống",
        "department_id": "dept-1",
        "bio": "Quản trị toàn bộ cài đặt, phân quyền và cấu hình hệ thống."
    },
    {
        "email": "truongphong@company.com",
        "password": "company123",
        "full_name": "Trưởng Phòng Nhân Sự",
        "role": "hr_manager",
        "phone": "0912345001",
        "position_title": "Chủ Nhiệm Ban Nhân Sự (CHRO)",
        "department_id": "dept-4",
        "bio": "Quản lý toàn bộ ngân sách tuyển dụng, dải lương và phê duyệt định biên."
    },
    {
        "email": "truongbophan@company.com",
        "password": "company123",
        "full_name": "Lê Trưởng Nhóm",
        "role": "department_manager",
        "phone": "0912345002",
        "position_title": "Trưởng Bộ Phận Phát Triển Phần Mềm",
        "department_id": "dept-2-1",
        "bio": "Đề xuất nhu cầu tuyển dụng headcount và đánh giá chuyên môn ứng viên."
    },
    {
        "email": "tuyendung@company.com",
        "password": "company123",
        "full_name": "Nguyễn Tuyển Dụng",
        "role": "recruiter",
        "phone": "0912345003",
        "position_title": "Chuyên Viên Tuyển Dụng Cao Cấp (Senior TA)",
        "department_id": "dept-4-1",
        "bio": "Sàng lọc CV, lên lịch phỏng vấn và vận hành đường ống tuyển dụng."
    },
    {
        "email": "nguoiduyet@company.com",
        "password": "company123",
        "full_name": "Trần Đức Nam",
        "role": "approver",
        "phone": "0912345004",
        "position_title": "Giám Đốc Khối / Phê Duyệt Viên",
        "department_id": "dept-1",
        "bio": "Phê duyệt các yêu cầu tuyển dụng và đề xuất mức lương Offer."
    },
    {
        "email": "nhanvien@company.com",
        "password": "company123",
        "full_name": "Nguyễn Văn An",
        "role": "employee",
        "phone": "0912345005",
        "position_title": "Chuyên Viên Phần Mềm Nội Bộ",
        "department_id": "dept-2-1",
        "bio": "Ứng tuyển nội bộ hoặc giới thiệu nhân tài."
    },
    {
        "email": "ungvien@company.com",
        "password": "company123",
        "full_name": "Phạm Hoàng Nam",
        "role": "candidate",
        "phone": "0912345006",
        "position_title": "Ứng Viên Tự Do",
        "department_id": None,
        "bio": "Ứng viên nộp hồ sơ trực tuyến qua cổng tuyển dụng."
    },
]

def ensure_columns():
    """Tự động bổ sung các column còn thiếu cho SQLite local db khi schema thay đổi."""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("users")]
        with engine.connect() as conn:
            if "avatar_base64" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_base64 TEXT"))
            if "account_status" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR(50) DEFAULT 'active' NOT NULL"))
            if "failed_login_attempts" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL"))
            if "locked_until" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
            if "last_login_at" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
            if "password_changed_at" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_changed_at DATETIME"))
            if "updated_at" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
            if "employee_code" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN employee_code VARCHAR(50)"))
            conn.commit()

def init_db():
    """
    Khởi tạo dữ liệu người dùng mặc định & Master Data khi khởi động hệ thống.
    """
    Base.metadata.create_all(bind=engine)
    ensure_columns()
    db = SessionLocal()
    try:
        # 1. Seed 7 System Role Accounts
        for u_info in SYSTEM_ROLES:
            user = db.query(User).filter(User.email == u_info["email"]).first()
            if not user:
                user = User(
                    email=u_info["email"],
                    full_name=u_info["full_name"],
                    hashed_password=hash_password(u_info["password"]),
                    role=u_info["role"],
                    phone=u_info["phone"],
                    position_title=u_info["position_title"],
                    department_id=u_info["department_id"],
                    bio=u_info["bio"],
                    is_active=True
                )
                db.add(user)
            else:
                user.full_name = u_info["full_name"]
                user.role = u_info["role"]
                user.phone = u_info["phone"]
                user.position_title = u_info["position_title"]
                user.department_id = u_info["department_id"]
                user.bio = u_info["bio"]
                user.is_active = True
        db.commit()

        # 2. Seed Departments if empty
        if db.query(Department).count() == 0:
            departments_seed = [
                Department(id="dept-1", code="BGD", name="Ban Giám Đốc & Khối Điều Hành", manager_name="Trần Viết Long", manager_title="Tổng Giám Đốc (CEO)", headcount_current=5, headcount_budget=5, active_jobs=0),
                Department(id="dept-2", code="TECH", name="Khối Công Nghệ & Sản Phẩm (Technology)", manager_name="Đỗ Văn Lâm", manager_title="Giám Đốc Công Nghệ (CTO)", headcount_current=28, headcount_budget=35, active_jobs=4, parent_id="dept-1"),
                Department(id="dept-2-1", code="DEV", name="Trung Tâm Phát Triển Phần Mềm (Software Center)", manager_name="Lê Trưởng Nhóm", manager_title="Trưởng Bộ Phận Dev", headcount_current=18, headcount_budget=22, active_jobs=3, parent_id="dept-2"),
                Department(id="dept-2-2", code="INFRA", name="Phòng Hạ Tầng & Bảo Mật Đám Mây (Cloud & DevOps)", manager_name="Hoàng Minh Tuấn", manager_title="Lead DevOps Architect", headcount_current=6, headcount_budget=8, active_jobs=1, parent_id="dept-2"),
                Department(id="dept-3", code="MKT", name="Khối Tiếp Thị & Tăng Trưởng Số (Marketing & Growth)", manager_name="Nguyễn Hương Giang", manager_title="Giám Đốc Tiếp Thị (CMO)", headcount_current=14, headcount_budget=16, active_jobs=2, parent_id="dept-1"),
                Department(id="dept-4", code="HR", name="Ban Quản Trị & Phát Triển Nguồn Nhân Lực", manager_name="Trưởng Phòng Nhân Sự", manager_title="Chủ Nhiệm Ban Nhân Sự (CHRO)", headcount_current=8, headcount_budget=9, active_jobs=1, parent_id="dept-1"),
                Department(id="dept-4-1", code="TA", name="Trung Tâm Thu Hút Nhân Tài (TA Center)", manager_name="Nguyễn Tuyển Dụng", manager_title="Trưởng Nhóm Recruitment", headcount_current=4, headcount_budget=5, active_jobs=1, parent_id="dept-4"),
            ]
            db.add_all(departments_seed)
            db.commit()

        # 3. Seed SalaryBands if empty
        if db.query(SalaryBand).count() == 0:
            salary_bands_seed = [
                SalaryBand(id="band-1", code="DEV-JR", title="Kỹ Sư Phần Mềm Junior (Frontend / Backend)", level="Junior", min_salary=12000000, max_salary=18000000, department="Trung Tâm Phát Triển Phần Mềm"),
                SalaryBand(id="band-2", code="DEV-MID", title="Chuyên Viên Phát Triển Phần Mềm Middle", level="Middle", min_salary=20000000, max_salary=32000000, department="Trung Tâm Phát Triển Phần Mềm"),
                SalaryBand(id="band-3", code="DEV-SR", title="Kỹ Sư Phần Mềm Cao Cấp (Senior Engineer)", level="Senior", min_salary=35000000, max_salary=52000000, department="Trung Tâm Phát Triển Phần Mềm"),
                SalaryBand(id="band-4", code="TECH-LEAD", title="Trưởng Nhóm Kỹ Thuật (Tech Lead / Architect)", level="Lead", min_salary=48000000, max_salary=68000000, department="Khối Công Nghệ & Sản Phẩm"),
                SalaryBand(id="band-5", code="ENG-MGR", title="Trưởng Phòng Kỹ Thuật (Engineering Manager)", level="Manager", min_salary=60000000, max_salary=85000000, department="Khối Công Nghệ & Sản Phẩm"),
            ]
            db.add_all(salary_bands_seed)
            db.commit()

        # 4. Seed JobPostings if empty
        if db.query(JobPosting).count() == 0:
            j1 = JobPosting(id="data-analyst", title="Data Analyst", department="Khối Công nghệ", location="Hà Nội", employment_type="Toàn thời gian", openings="1–2 người", status="open", description="Phân tích dữ liệu, cung cấp báo cáo và insight phục vụ quyết định kinh doanh.", deadline="30/11/2026")
            j1.set_skills(["SQL", "Power BI", "Excel", "Phân tích dữ liệu"])
            j1.set_responsibilities(["Xây dựng dashboard và báo cáo định kỳ", "Phân tích dữ liệu hỗ trợ các đơn vị kinh doanh"])
            j1.set_requirements(["Có kinh nghiệm với SQL và công cụ BI", "Tư duy phân tích và giao tiếp tốt"])

            j2 = JobPosting(id="internal-communications", title="Internal Communications", department="Khối Nhân sự", location="Hồ Chí Minh", employment_type="Toàn thời gian", openings="1 người", status="open", description="Xây dựng và triển khai các hoạt động truyền thông nội bộ.", deadline="15/11/2026")
            j2.set_skills(["Truyền thông nội bộ", "Sáng tạo nội dung", "Tổ chức sự kiện"])
            j2.set_responsibilities(["Lập kế hoạch nội dung nội bộ", "Điều phối sự kiện gắn kết nhân viên"])
            j2.set_requirements(["Kỹ năng viết và tổ chức tốt", "Chủ động phối hợp liên phòng ban"])

            db.add_all([j1, j2])
            db.commit()

        # 5. Seed Requisitions if empty
        if db.query(Requisition).count() == 0:
            reqs_seed = [
                Requisition(id="req-ov-1", code="REQ-2026-088", title="Senior AI / Deep Learning Researcher", department="Viện Nghiên cứu Trí tuệ Nhân tạo", level="Senior", target_count=1, recruiter_name="Trần Thị Mai", target_date="2026-10-02", open_days=35, priority="Urgent"),
                Requisition(id="req-ov-2", code="REQ-2026-092", title="Senior Backend Engineer (Golang / Cloud)", department="Khối Công nghệ & Sản phẩm", level="Senior", target_count=2, recruiter_name="Nguyễn Hoàng Long", target_date="2026-10-05", open_days=28, priority="High"),
            ]
        # 6. Seed AuditLogs if empty
        from app.models.audit_log import AuditLog
        if db.query(AuditLog).count() == 0:
            initial_logs = [
                AuditLog(user_id=1, user_email="admin@company.com", user_name="Admin System", action="Đăng nhập hệ thống", details="Đăng nhập thành công từ địa chỉ IP 192.168.1.100"),
                AuditLog(user_id=1, user_email="admin@company.com", user_name="Admin System", action="Khởi tạo cơ sở dữ liệu", details="Khởi tạo dữ liệu người dùng và phân quyền hệ thống"),
                AuditLog(user_id=1, user_email="admin@company.com", user_name="Admin System", action="Cấu hình hệ thống", details="Cập nhật chính sách bảo mật và khôi phục mật khẩu"),
            ]
            db.add_all(initial_logs)
            db.commit()

    except Exception as e:
        print(f"Lỗi khi khởi tạo database: {e}")
    finally:
        db.close()
