import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.core.security import hash_password
import app.models  # Register all SQLAlchemy models and relationships
from app.models.user import User
from app.models.hr import Department, JobTitle, Competency, SharedCategory
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.referral_eval import InternalReferral
from app.models.email_automation import EmailTemplate, EmailLog
from app.models.audit import AuditLog, Permission, RolePermission
from app.db.seed_rbac import seed_rbac

def reset_and_seed_database(drop_tables: bool = False):
    if drop_tables:
        print("=========================================================================")
        print("[1/4] RESETTING DATABASE: Dropping all existing tables...")
        print("=========================================================================")
        try:
            Base.metadata.drop_all(bind=engine)
            print("[SUCCESS] All database tables successfully dropped.")
        except Exception as e:
            print(f"[WARNING] Table drop error (will proceed to create): {e}")

    print("\n[2/4] CREATING / CHECKING DATABASE SCHEMA...")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    seed_rbac()
    print("[SUCCESS] Database schema and RBAC successfully initialized.")

    db: Session = SessionLocal()

    try:
        print("\n[3/4] SEEDING DEMO DATA & 7 BUSINESS ROLE ACCOUNTS...")

        # 1. Users for all 7 Business Roles (Bcrypt Encrypted with 'password123')
        hashed_pwd = hash_password("password123")
        users_seed = [
            {
                "email": "admin@company.com",
                "full_name": "Quản Trị Viên Hệ Thống",
                "role": "admin",
                "phone": "0901234567",
                "code": "NV-ADMIN-01"
            },
            {
                "email": "hrmanager@company.com",
                "full_name": "Nguyễn Văn Trưởng HR",
                "role": "hr_manager",
                "phone": "0912345678",
                "code": "NV-HRM-02"
            },
            {
                "email": "truongbophan@company.com",
                "full_name": "Trần Trưởng Bộ Phận",
                "role": "hiring_manager",
                "phone": "0923456799",
                "code": "NV-TBP-04"
            },
            {
                "email": "recruiter@company.com",
                "full_name": "Trần Thị Recruiter",
                "role": "recruiter",
                "phone": "0934567891",
                "code": "NV-REC-05"
            },
            {
                "email": "interviewer@company.com",
                "full_name": "Phạm Văn Interviewer",
                "role": "interviewer",
                "phone": "0945678912",
                "code": "NV-INT-06"
            },
            {
                "email": "approver@company.com",
                "full_name": "Ban Giám Đốc Approver",
                "role": "approver",
                "phone": "0956789123",
                "code": "NV-APP-07"
            },
            {
                "email": "candidate@company.com",
                "full_name": "Phạm Văn Nhân Viên (Ứng Viên)",
                "role": "candidate",
                "phone": "0967891234",
                "code": "NV-CAN-08"
            },
            {
                "email": "employee@company.com",
                "full_name": "Hoàng Văn Nhân Viên Nội Bộ",
                "role": "employee",
                "phone": "0934567890",
                "code": "NV-EMP-09"
            },
        ]

        user_objs = {}
        for u in users_seed:
            user = db.query(User).filter(User.email == u["email"]).first()
            if not user:
                user = User(
                    email=u["email"],
                    hashed_password=hashed_pwd,
                    full_name=u["full_name"],
                    phone=u["phone"],
                    role=u["role"],
                    employee_code=u["code"],
                    is_active=True,
                    account_status="active"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            user_objs[u["role"]] = user
        print(f" -> Seeded {len(users_seed)} User Accounts across 7 Business Roles")
        seed_rbac()

        # 2. Departments with Multi-level Hierarchy (AC1) and Mandatory Head (AC2)
        root_depts = [
            ("Khối Công Nghệ Thông Tin", "IT", user_objs["hiring_manager"].id),
            ("Khối Nhân Sự & Đào Tạo", "HR", user_objs["hr_manager"].id),
            ("Khối Kinh Doanh & Phát Triển", "SALES", user_objs["approver"].id),
            ("Khối Tài Chính & Kế Toán", "FINANCE", user_objs["admin"].id),
            ("Khối Marketing & Truyền Thông", "MKT", user_objs["recruiter"].id)
        ]
        dept_objs = {}
        for name, code, head_id in root_depts:
            dept = db.query(Department).filter(Department.code == code).first()
            if not dept:
                dept = Department(name=name, code=code, head_user_id=head_id, is_active=True)
                db.add(dept)
                db.commit()
                db.refresh(dept)
            else:
                dept.head_user_id = head_id
                db.commit()
            dept_objs[code] = dept

        # Sub-departments (Level 2 & Level 3)
        sub_depts = [
            ("Bộ Phận Phát Triển Phần Mềm", "IT-DEV", dept_objs["IT"].id, user_objs["hiring_manager"].id, "Lập trình & giải pháp số"),
            ("Bộ Phận Vận Hành & An Ninh Mạng", "IT-OPS", dept_objs["IT"].id, user_objs["admin"].id, "Hạ tầng Cloud & Security"),
            ("Ban Tuyển Dụng & Thu Hút Nhân Tài", "HR-TA", dept_objs["HR"].id, user_objs["hr_manager"].id, "Tuyển dụng & Employer Branding"),
            ("Ban Đào Tạo & Phát Triển Văn Hóa", "HR-LD", dept_objs["HR"].id, user_objs["hr_manager"].id, "Đào tạo & văn hóa doanh nghiệp"),
        ]
        for name, code, parent_id, head_id, desc in sub_depts:
            sub = db.query(Department).filter(Department.code == code).first()
            if not sub:
                sub = Department(name=name, code=code, parent_id=parent_id, head_user_id=head_id, description=desc, is_active=True)
                db.add(sub)
                db.commit()
                db.refresh(sub)
            else:
                sub.parent_id = parent_id
                sub.head_user_id = head_id
                sub.description = desc
                db.commit()
            dept_objs[code] = sub

        if "IT-DEV" in dept_objs:
            lvl3 = [
                ("Nhóm Backend & Nền Tảng Cloud", "IT-DEV-BE", dept_objs["IT-DEV"].id, user_objs["hiring_manager"].id, "FastAPI, PostgreSQL & Cloud"),
                ("Nhóm Frontend & Trải Nghiệm Số", "IT-DEV-FE", dept_objs["IT-DEV"].id, user_objs["hiring_manager"].id, "Next.js & Design System"),
            ]
            for name, code, parent_id, head_id, desc in lvl3:
                l3 = db.query(Department).filter(Department.code == code).first()
                if not l3:
                    l3 = Department(name=name, code=code, parent_id=parent_id, head_user_id=head_id, description=desc, is_active=True)
                    db.add(l3)
                    db.commit()
                    db.refresh(l3)
                else:
                    l3.parent_id = parent_id
                    l3.head_user_id = head_id
                    l3.description = desc
                    db.commit()
                dept_objs[code] = l3
        print(f" -> Seeded multi-level hierarchy Departments with heads")

        # 3. Job Requisitions
        req1 = JobRequisition(
            code="REQ-2026-001",
            title="Kỹ Sư Backend Senior (Python / FastAPI)",
            department_id=dept_objs["IT"].id,
            quantity=2,
            reason="expansion",
            reason_detail="Mở rộng hệ thống Tuyển dụng Nội bộ K3S4",
            priority="high",
            employment_type="Full-time",
            work_location="Hà Nội",
            min_salary=25000000,
            max_salary=35000000,
            is_salary_negotiable=False,
            target_onboard_date="2026-11-01",
            job_description="Xây dựng và phát triển API FastAPI backend, kiến trúc PostgreSQL.",
            requirements="Tối thiểu 3 năm kinh nghiệm Python, FastAPI, PostgreSQL, Docker.",
            benefits="Bảo hiểm PVI, Thưởng KPI quý, Macbook Pro M3.",
            status="approved",
            current_approval_step="completed",
            created_by_id=user_objs["hiring_manager"].id
        )
        db.add(req1)
        db.commit()
        db.refresh(req1)

        req2 = JobRequisition(
            code="REQ-2026-002",
            title="Chuyên Viên Tuyển Dụng Cao Cấp (Tech HR)",
            department_id=dept_objs["HR"].id,
            quantity=1,
            reason="replacement",
            reason_detail="Thay thế nhân sự nghỉ thai sản",
            priority="medium",
            employment_type="Full-time",
            work_location="Hà Nội",
            min_salary=18000000,
            max_salary=25000000,
            is_salary_negotiable=True,
            target_onboard_date="2026-11-15",
            job_description="Vận hành pipeline ứng viên tech, phỏng vấn và gửi Offer.",
            requirements="Có 2+ năm kinh nghiệm recruitment tech.",
            benefits="Môi trường trẻ trung, chế độ thưởng hấp dẫn.",
            status="approved",
            current_approval_step="completed",
            created_by_id=user_objs["hr_manager"].id
        )
        db.add(req2)
        db.commit()
        db.refresh(req2)
        print(" -> Seeded 2 Job Requisitions")

        # 4. Job Postings
        job1 = JobPosting(
            slug="senior-python-backend-engineer",
            title="Senior Python Backend Engineer",
            requisition_id=req1.id,
            department_id=dept_objs["IT"].id,
            department_name=dept_objs["IT"].name,
            salary_range="25 - 35 Triệu",
            type="Full-time",
            level="Senior",
            location="Hà Nội",
            deadline="2026-12-31",
            description="Tham gia thiết kế kiến trúc Backend hệ thống Microservices & FastAPI, tối ưu hóa truy vấn cơ sở dữ liệu quy mô lớn.",
            requirements="Thành thạo Python, SQLAlchemy, PostgreSQL, Docker. Tối thiểu 3 năm kinh nghiệm phát triển backend enterprise.",
            benefits="Lương tháng 13, Thưởng dự án theo quý, Cấp Macbook Pro M3, Du lịch nghỉ dưỡng hàng năm.",
            status="published",
            created_by_id=user_objs["recruiter"].id,
            published_by_id=user_objs["hr_manager"].id,
            published_at=datetime.utcnow()
        )
        db.add(job1)

        job2 = JobPosting(
            slug="chuyen-vien-tuyen-dung-cao-cap-hr",
            title="Chuyên Viên Tuyển Dụng Cao Cấp (HR Specialist)",
            requisition_id=req2.id,
            department_id=dept_objs["HR"].id,
            department_name=dept_objs["HR"].name,
            salary_range="18 - 25 Triệu",
            type="Full-time",
            level="Mid-Level",
            location="Hà Nội",
            deadline="2026-11-30",
            description="Chịu trách nhiệm toàn bộ quy trình tuyển dụng nhân sự Công nghệ & Khối vận hành, xây dựng nguồn ứng viên chất lượng cao.",
            requirements="Có 2+ năm kinh nghiệm tuyển dụng Tech, kỹ năng phỏng vấn và đánh giá ứng viên chuyên sâu, giao tiếp xuất sắc.",
            benefits="Môi trường trẻ trung năng động, cơ hội thăng tiến Trưởng nhóm Tuyển dụng, chế độ bảo hiểm sức khỏe VIP.",
            status="published",
            created_by_id=user_objs["recruiter"].id,
            published_by_id=user_objs["hr_manager"].id,
            published_at=datetime.utcnow()
        )
        db.add(job2)

        job3 = JobPosting(
            slug="chuyen-vien-marketing-tuyen-dung",
            title="Chuyên Viên Marketing & Employer Branding",
            requisition_id=req2.id,
            department_id=dept_objs["MKT"].id,
            department_name=dept_objs["MKT"].name,
            salary_range="15 - 22 Triệu",
            type="Full-time",
            level="Mid-Level",
            location="TP. Hồ Chí Minh",
            deadline="2026-12-15",
            description="Xây dựng chiến dịch thương hiệu nhà tuyển dụng (Employer Branding), sáng tạo nội dung truyền thông tuyển dụng trên LinkedIn, TikTok và Website Career.",
            requirements="Tối thiểu 2 năm kinh nghiệm Marketing/Branding; sáng tạo nội dung thu hút; có kinh nghiệm chạy quảng cáo Meta/LinkedIn.",
            benefits="Laptop làm việc, Thưởng chiến dịch tuyển dụng, Du lịch nghỉ dưỡng 5 sao hàng năm, Phụ cấp ăn trưa.",
            status="pending_review",
            created_by_id=user_objs["recruiter"].id
        )
        db.add(job3)

        job4 = JobPosting(
            slug="data-engineer-postgresql-etl",
            title="Kỹ Sư Dữ Liệu (Data Engineer - ETL / PostgreSQL)",
            requisition_id=req1.id,
            department_id=dept_objs["IT"].id,
            department_name=dept_objs["IT"].name,
            salary_range="20 - 30 Triệu",
            type="Full-time",
            level="Mid-Level",
            location="Hà Nội",
            deadline="2026-12-20",
            description="Thiết kế và triển khai luồng dữ liệu ETL/ELT tổng hợp báo cáo tuyển dụng thời gian thực từ nhiều nguồn.",
            requirements="Thành thạo PostgreSQL, Python, SQL nâng cao, kinh nghiệm tối ưu hóa truy vấn Data Warehouse.",
            benefits="Thưởng theo hiệu quả công việc, Bảo hiểm quốc tế, Môi trường làm việc Hybrid linh hoạt.",
            status="draft",
            review_note="Cần điều chỉnh dải lương tối thiểu từ 20M lên 25M theo quy định dải lương mới của khối IT và bổ sung yêu cầu về Apache Airflow.",
            created_by_id=user_objs["recruiter"].id
        )
        db.add(job4)

        job5 = JobPosting(
            slug="thuc-tap-sinh-nhan-su-hr-intern",
            title="Thực Tập Sinh Nhân Sự (HR Intern - Đã đóng)",
            requisition_id=req2.id,
            department_id=dept_objs["HR"].id,
            department_name=dept_objs["HR"].name,
            salary_range="5 - 7 Triệu",
            type="Thực tập",
            level="Fresher",
            location="Hà Nội",
            deadline="2026-09-30",
            description="Hỗ trợ sắp xếp lịch phỏng vấn và lọc hồ sơ ứng viên bước đầu.",
            requirements="Sinh viên năm cuối các trường Đại học chuyên ngành Nhân sự, Quản trị kinh doanh.",
            benefits="Hỗ trợ dấu thực tập, Phụ cấp hàng tháng, Được đào tạo bài bản từ chuyên gia.",
            status="closed",
            created_by_id=user_objs["recruiter"].id
        )
        db.add(job5)
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        db.refresh(job3)
        db.refresh(job4)
        db.refresh(job5)
        print(" -> Seeded 5 Realistic Jobs (Pending, Published, Needs Revision, Closed)")

        # 5. Job Applications
        app1 = JobApplication(
            job_posting_id=job1.id,
            candidate_id=user_objs["candidate"].id,
            full_name="Phạm Văn Nhân Viên",
            email="candidate@company.com",
            phone="0967891234",
            current_company="Tập đoàn FPT",
            current_position="Kỹ sư Phần mềm",
            years_of_experience=4,
            status="interviewing",
            score=88
        )
        db.add(app1)

        app2 = JobApplication(
            job_posting_id=job1.id,
            full_name="Nguyễn Minh Hoàng",
            email="hoang.nguyen@gmail.com",
            phone="0987654321",
            current_company="VNG Corporation",
            current_position="Backend Engineer",
            years_of_experience=5,
            status="offered",
            score=92
        )
        db.add(app2)
        db.commit()
        print(" -> Seeded 2 Applications")

        # 6. Interview Schedule
        from datetime import datetime, timedelta
        int1 = InterviewSchedule(
            application_id=app1.id,
            round_number=1,
            round_name="Phỏng vấn Vòng 1: Chuyên môn Technical Backend",
            scheduled_time=datetime.utcnow() + timedelta(days=3),
            duration_minutes=60,
            location="Meeting Room 302 / Zoom Online",
            meeting_link="https://zoom.us/j/9876543210",
            status="scheduled",
            created_by_id=user_objs["recruiter"].id
        )
        db.add(int1)
        db.commit()
        print(" -> Seeded 1 Interview Schedule")

        # 7. Default RBAC Permissions & Role Permissions
        print(" -> Seeding RBAC Roles, Permissions & User Mappings...")
        seed_rbac()
        print(" -> Seeded Default RBAC Permissions & Role Mappings")

        # 8. Seed Initial Audit Log
        audit_init = AuditLog(
            actor_id=user_objs["admin"].id,
            actor_email="admin@company.com",
            action="SYSTEM_INIT_SEED",
            target_entity="Database",
            target_id="0",
            ip_address="127.0.0.1",
            payload_json='{"message": "Database initialized with 7 business roles and demo data"}'
        )
        db.add(audit_init)
        db.commit()
        print(" -> Seeded Initial System Audit Log")

        # 9. Seed Email Template
        tpl = EmailTemplate(
            code="PASSWORD_RESET_OTP",
            name="Mẫu Email Mã OTP Đặt Lại Mật Khẩu",
            category="Hệ thống",
            subject="[Mã OTP] Yêu cầu đặt lại mật khẩu hệ thống",
            body_html="<p>Xin chào <b>{user_name}</b>,</p><p>Mã OTP của bạn là: <b>{otp_code}</b>. Hạn dùng 5 phút.</p>",
            is_auto_send=True,
            is_active=True
        )
        db.add(tpl)
        db.commit()
        print(" -> Seeded Email Template")

        # 10. Master Data (JobTitles, Competencies, SharedCategories)
        jt1 = JobTitle(name="Kỹ Sư Backend", department_id=dept_objs["IT"].id, level="Senior", min_salary=25000000, max_salary=35000000, description="Kỹ sư phát triển Backend")
        jt2 = JobTitle(name="Chuyên Viên Tuyển Dụng", department_id=dept_objs["HR"].id, level="Mid-Level", min_salary=18000000, max_salary=25000000, description="Recruitment Specialist")
        db.add(jt1)
        db.add(jt2)

        c1 = Competency(name="Kỹ năng Lập trình Python / FastAPI", category="Technical", description="Thành thạo REST API, ORM", required_level=4, weight=0.4)
        c2 = Competency(name="Kỹ năng Giao tiếp & Đàm phán", category="Soft Skills", description="Khả năng làm việc nhóm & trao đổi ứng viên", required_level=3, weight=0.3)
        db.add(c1)
        db.add(c2)

        categories_seed = [
            # 1. candidate_source (Nguồn ứng viên)
            ("candidate_source", "Cổng tuyển dụng công ty (Career Site)", 1),
            ("candidate_source", "Mạng xã hội LinkedIn", 2),
            ("candidate_source", "Giới thiệu nội bộ (Referral)", 3),
            ("candidate_source", "TopCV", 4),
            ("candidate_source", "VietnamWorks", 5),
            ("candidate_source", "Headhunter / Đơn vị săn đầu người", 6),
            ("candidate_source", "Ngày hội việc làm (Job Fair)", 7),

            # 2. rejection_reason (Lý do loại hồ sơ)
            ("rejection_reason", "Kỹ năng chuyên môn chưa đáp ứng yêu cầu", 1),
            ("rejection_reason", "Kỳ vọng mức lương vượt khung ngân sách", 2),
            ("rejection_reason", "Không phù hợp văn hóa doanh nghiệp", 3),
            ("rejection_reason", "Ứng viên từ chối nhận offer", 4),
            ("rejection_reason", "Không đến tham dự phỏng vấn", 5),
            ("rejection_reason", "Đã tuyển đủ chỉ tiêu cho vị trí", 6),

            # 3. work_location (Địa điểm làm việc)
            ("work_location", "Hà Nội - Trụ sở chính (Tòa Keangnam)", 1),
            ("work_location", "TP. Hồ Chí Minh - Chi nhánh miền Nam", 2),
            ("work_location", "Đà Nẵng - Trung tâm R&D", 3),
            ("work_location", "Cần Thơ - Văn phòng đại diện", 4),
            ("work_location", "Hải Phòng", 5),

            # 4. work_type (Hình thức làm việc)
            ("work_type", "Toàn thời gian (Full-time)", 1),
            ("work_type", "Bán thời gian (Part-time)", 2),
            ("work_type", "Làm việc từ xa (Remote)", 3),
            ("work_type", "Làm việc kết hợp (Hybrid)", 4),
            ("work_type", "Thực tập sinh (Internship)", 5),

            # 5. contract_type (Loại hợp đồng)
            ("contract_type", "Hợp đồng thử việc 2 tháng", 1),
            ("contract_type", "Hợp đồng xác định thời hạn 1 năm", 2),
            ("contract_type", "Hợp đồng xác định thời hạn 3 năm", 3),
            ("contract_type", "Hợp đồng không xác định thời hạn", 4),
            ("contract_type", "Hợp đồng cộng tác viên", 5),

            # 6. approval_type (Loại luồng phê duyệt)
            ("approval_type", "Tuyển dụng tiêu chuẩn (Standard Requisition)", 1),
            ("approval_type", "Vượt ngân sách định biên (Over-budget)", 2),
            ("approval_type", "Tuyển gấp bổ sung (Urgent Headcount)", 3),
            ("approval_type", "Tuyển dụng cấp quản lý (Executive Hiring)", 4),

            # 7. tag (Nhãn ứng viên)
            ("tag", "Tiềm năng (Talent Pool)", 1),
            ("tag", "Ưu tiên phỏng vấn", 2),
            ("tag", "Đã từng làm việc tại công ty", 3),
            ("tag", "Giới thiệu bởi ban lãnh đạo", 4),
            ("tag", "Tiếng Anh thành thạo", 5),
        ]

        for cat_type, name, order in categories_seed:
            existing_cat = db.query(SharedCategory).filter(
                SharedCategory.category_type == cat_type,
                SharedCategory.name == name
            ).first()
            if not existing_cat:
                db.add(SharedCategory(category_type=cat_type, name=name, sort_order=order, is_active=True))

        db.commit()
        print(" -> Seeded Job Titles, Competencies & Master Data Categories (7 Groups)")

        print("\n=========================================================================")
        print("[4/4] SEED COMPLETED SUCCESSFULLY! DEMO ACCOUNTS READY FOR TESTING:")
        print("=========================================================================")
        print(f"{'Role':<20} | {'Email':<25} | {'Password':<12} | {'Redirect Route':<15}")
        print("-" * 80)
        for u in users_seed:
            role = u['role']
            email = u['email']
            pwd = "password123"
            norm = role.lower()
            if "admin" in norm: redir = "/admin"
            elif "hr" in norm: redir = "/hr"
            elif "recruiter" in norm: redir = "/recruiter"
            elif "manager" in norm: redir = "/manager"
            elif "interviewer" in norm: redir = "/interviewer"
            elif "approver" in norm: redir = "/approver"
            else: redir = "/jobs"
            print(f"{role:<20} | {email:<25} | {pwd:<12} | {redir:<15}")
        print("=========================================================================\n")

    except Exception as e:
        print(f"[ERROR] Seeding failed with error: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed_database()
