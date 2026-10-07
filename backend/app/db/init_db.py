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

from app.models.competency import CompetencyFramework, CompetencyCriteria, InterviewQuestion

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

        # 4. Seed CompetencyFrameworks if empty
        if db.query(CompetencyFramework).count() == 0:
            cf1 = CompetencyFramework(
                id="cf-1",
                code="CF-SWE-2026",
                name="Khung Năng Lực Kỹ Sư Phần Mềm (Software Engineer)",
                department="Khối Công Nghệ & Sản Phẩm (Technology)",
                status="active",
                updated_at="06/10/2026"
            )
            cf1.set_applied_job_titles([
                "Senior Backend Engineer",
                "Lead Developer",
                "Fullstack Developer",
                "Frontend Developer"
            ])
            db.add(cf1)
            db.commit()

            criteria1 = [
                CompetencyCriteria(id="c-101", framework_id="cf-1", code="TC-01", name="Kiến trúc hệ thống & Thiết kế CSDL", description="Khả năng thiết kế database tối ưu, phân tích microservices, xử lý locking và concurrency cao.", weight=30),
                CompetencyCriteria(id="c-102", framework_id="cf-1", code="TC-02", name="Kỹ năng lập trình chuyên sâu & Clean Code", description="Viết code rõ ràng, tuân thủ nguyên lý SOLID, thiết kế unit test và code coverage đạt chuẩn dự án.", weight=25),
                CompetencyCriteria(id="c-103", framework_id="cf-1", code="TC-03", name="Tư duy giải quyết vấn đề (Problem Solving)", description="Khả năng phân tích root cause, debug production, tối ưu hóa hiệu năng và profiling hệ thống.", weight=20),
                CompetencyCriteria(id="c-104", framework_id="cf-1", code="TC-04", name="Khả năng làm việc nhóm & Mentor", description="Review code văn minh, hỗ trợ junior developer, giao tiếp kỹ thuật rõ ràng với các bên liên quan.", weight=15),
                CompetencyCriteria(id="c-105", framework_id="cf-1", code="TC-05", name="Hiểu biết bảo mật & Cloud / DevOps", description="Nắm vững OWASP Top 10, cấu hình CI/CD pipelines, Docker containerization và triển khai đám mây.", weight=10),
            ]
            db.add_all(criteria1)

            cf2 = CompetencyFramework(
                id="cf-2",
                code="CF-TA-2026",
                name="Khung Năng Lực Chuyên Viên Tuyển Dụng (Talent Acquisition)",
                department="Phòng Tuyển Dụng & Đào Tạo",
                status="active",
                updated_at="04/10/2026"
            )
            cf2.set_applied_job_titles([
                "Chuyên viên Tuyển dụng (Recruiter)",
                "Trưởng nhóm Tuyển dụng"
            ])
            db.add(cf2)
            db.commit()

            criteria2 = [
                CompetencyCriteria(id="c-201", framework_id="cf-2", code="TC-HR-01", name="Kỹ năng Sourcing & Tiếp cận ứng viên", description="Chủ động tìm kiếm qua LinkedIn, GitHub, xây dựng talent pool ứng viên thụ động chất lượng cao.", weight=25),
                CompetencyCriteria(id="c-202", framework_id="cf-2", code="TC-HR-02", name="Phỏng vấn hành vi (Behavioral Interview - STAR)", description="Khai thác sâu kinh nghiệm thực tế qua mô hình STAR, đánh giá chuẩn xác độ phù hợp văn hóa.", weight=30),
                CompetencyCriteria(id="c-203", framework_id="cf-2", code="TC-HR-03", name="Thương lượng Offer & Chăm sóc ứng viên", description="Khéo léo phân tích Total Rewards, chốt offer hiệu quả, giữ tỉ lệ chuyển đổi offer acceptance > 85%.", weight=20),
                CompetencyCriteria(id="c-204", framework_id="cf-2", code="TC-HR-04", name="Phân tích dữ liệu tuyển dụng & Báo cáo SLA", description="Theo dõi Time-to-Hire, Cost-per-Hire, quản lý pipeline trên ATS và tối ưu hiệu suất quy trình.", weight=15),
                CompetencyCriteria(id="c-205", framework_id="cf-2", code="TC-HR-05", name="Xây dựng thương hiệu nhà tuyển dụng (Employer Branding)", description="Tạo nội dung tuyển dụng hấp dẫn, lan tỏa văn hóa doanh nghiệp trên mạng xã hội chuyên nghiệp.", weight=10),
            ]
            db.add_all(criteria2)
            db.commit()

        # 5. Seed InterviewQuestions if empty
        if db.query(InterviewQuestion).count() == 0:
            questions_seed = [
                InterviewQuestion(
                    id="q-1",
                    code="Q-BE-01",
                    content="Hãy giải thích cách bạn xử lý bài toán race condition trong cơ sở dữ liệu khi có nhiều giao dịch đồng thời đặt cùng một vị trí tuyển dụng?",
                    criteria_id="c-101",
                    criteria_name="Kiến trúc hệ thống & Thiết kế CSDL",
                    job_title="Senior Backend Engineer",
                    difficulty="hard",
                    suggested_answer="Ứng viên cần giải thích được: (1) Khái niệm Race condition và nguy cơ dữ liệu không đồng nhất; (2) Sự khác biệt giữa Optimistic Locking (dùng version/timestamp) và Pessimistic Locking (SELECT ... FOR UPDATE); (3) Mức độ Transaction Isolation; (4) Giải pháp phân tán (Distributed Lock với Redis/Redlock).",
                    is_referenced=True,
                    status="active",
                    times_used=6
                ),
                InterviewQuestion(
                    id="q-2",
                    code="Q-BE-02",
                    content="Bạn áp dụng nguyên lý Dependency Inversion (chữ D trong SOLID) như thế nào trong kiến trúc phân tầng (Clean Architecture / Onion)?",
                    criteria_id="c-102",
                    criteria_name="Kỹ năng lập trình chuyên sâu & Clean Code",
                    job_title="Senior Backend Engineer",
                    difficulty="medium",
                    suggested_answer="Module cấp cao không nên phụ thuộc vào module cấp thấp, cả hai nên phụ thuộc vào Abstraction/Interface. Nêu ví dụ cách tách Domain Service khỏi Database Repository cụ thể, giúp dễ viết Unit Test với Mock.",
                    is_referenced=True,
                    status="active",
                    times_used=4
                ),
                InterviewQuestion(
                    id="q-3",
                    code="Q-BE-03",
                    content="Kể lại một sự cố sập server hoặc nghẽn database (High CPU / Slow query) nghiêm trọng nhất bạn từng xử lý. Bạn đã debug và khắc phục từng bước thế nào?",
                    criteria_id="c-103",
                    criteria_name="Tư duy giải quyết vấn đề (Problem Solving)",
                    job_title="Senior Backend Engineer",
                    difficulty="hard",
                    suggested_answer="Đánh giá theo cấu trúc STAR: (1) Bối cảnh sự cố; (2) Nhiệm vụ; (3) Hành động: kiểm tra metrics APM, phân tích slow query log, EXPLAIN query, phân tích connection pool; (4) Kết quả: phục hồi thời gian bao lâu, giải pháp phòng ngừa dài hạn (indexing, caching).",
                    is_referenced=True,
                    status="active",
                    times_used=8
                ),
                InterviewQuestion(
                    id="q-4",
                    code="Q-BE-04",
                    content="Sự khác biệt căn bản giữa Authentication và Authorization là gì? Bạn bảo vệ API chống tấn công SQL Injection và CSRF như thế nào?",
                    criteria_id="c-105",
                    criteria_name="Hiểu biết bảo mật & Cloud / DevOps",
                    job_title="Senior Backend Engineer",
                    difficulty="easy",
                    suggested_answer="Authentication là xác thực danh tính ('Bạn là ai?'), Authorization là phân quyền ('Bạn được làm gì?'). SQL Injection phòng chống bằng Parameterized Queries/ORM; CSRF phòng chống bằng SameSite Cookie và Anti-CSRF Token.",
                    is_referenced=False,
                    status="active",
                    times_used=0
                ),
                InterviewQuestion(
                    id="q-5",
                    code="Q-HR-01",
                    content="Làm thế nào để bạn nhận biết một ứng viên đang trả lời phỏng vấn theo kịch bản chuẩn bị sẵn (học vẹt) thay vì trải nghiệm thực tế của họ?",
                    criteria_id="c-202",
                    criteria_name="Phỏng vấn hành vi (Behavioral Interview - STAR)",
                    job_title="Chuyên viên Tuyển dụng (Recruiter)",
                    difficulty="medium",
                    suggested_answer="Áp dụng kỹ thuật đào sâu (Drill-down): Hỏi về các số liệu cụ thể, cảm xúc tại thời điểm khó khăn, nguyên nhân tại sao chọn giải pháp đó thay vì giải pháp khác, và bài học cá nhân rút ra.",
                    is_referenced=True,
                    status="active",
                    times_used=3
                ),
                InterviewQuestion(
                    id="q-6",
                    code="Q-HR-02",
                    content="Khi một ứng viên xuất sắc từ chối Offer vì nhận được mức lương cao hơn 20% từ đối thủ, bạn sẽ làm gì để thuyết phục hoặc xử lý tình huống này?",
                    criteria_id="c-203",
                    criteria_name="Thương lượng Offer & Chăm sóc ứng viên",
                    job_title="Chuyên viên Tuyển dụng (Recruiter)",
                    difficulty="hard",
                    suggested_answer="Phân tích gói Total Rewards: cơ hội thăng tiến, văn hóa, lộ trình đào tạo, chế độ làm việc linh hoạt. Không công kích đối thủ. Nếu không thương lượng được, duy trì mối quan hệ tốt đẹp trong Talent Pool cho các cơ hội tương lai.",
                    is_referenced=False,
                    status="active",
                    times_used=0
                ),
            ]
            db.add_all(questions_seed)
            db.commit()

        # 6. Seed JobPostings if empty
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

        # 7. Seed Requisitions if empty
        if db.query(Requisition).count() == 0:
            reqs_seed = [
                Requisition(id="req-ov-1", code="REQ-2026-088", title="Senior AI / Deep Learning Researcher", department="Viện Nghiên cứu Trí tuệ Nhân tạo", level="Senior", target_count=1, recruiter_name="Trần Thị Mai", target_date="2026-10-02", open_days=35, priority="Urgent"),
                Requisition(id="req-ov-2", code="REQ-2026-092", title="Senior Backend Engineer (Golang / Cloud)", department="Khối Công nghệ & Sản phẩm", level="Senior", target_count=2, recruiter_name="Nguyễn Hoàng Long", target_date="2026-10-05", open_days=28, priority="High"),
            ]
            db.add_all(reqs_seed)
            db.commit()

        # 8. Seed AuditLogs if empty
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

