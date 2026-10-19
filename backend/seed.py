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

def reset_and_seed_database():
    print("=========================================================================")
    print("[1/4] RESETTING DATABASE: Dropping all existing tables...")
    print("=========================================================================")
    try:
        Base.metadata.drop_all(bind=engine)
        print("[SUCCESS] All database tables successfully dropped.")
    except Exception as e:
        print(f"[WARNING] Table drop error (will proceed to create): {e}")

    print("\n[2/4] CREATING DATABASE SCHEMA...")
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Database schema successfully initialized.")

    db: Session = SessionLocal()

    try:
        print("\n[3/4] SEEDING DEMO DATA & 7 BUSINESS ROLE ACCOUNTS...")

        # 1. Departments
        depts_data = [
            ("Khối Công Nghệ Thông Tin", "IT"),
            ("Khối Nhân Sự & Đào Tạo", "HR"),
            ("Khối Kinh Doanh & Phát Triển", "SALES"),
            ("Khối Tài Chính & Kế Toán", "FINANCE"),
            ("Khối Marketing & Truyền Thông", "MKT")
        ]
        dept_objs = {}
        for name, code in depts_data:
            dept = Department(name=name, code=code)
            db.add(dept)
            db.commit()
            db.refresh(dept)
            dept_objs[code] = dept
        print(f" -> Created {len(dept_objs)} Departments")

        # 2. Users for all 7 Business Roles (Bcrypt Encrypted with 'password123')
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
            description="Tham gia thiết kế kiến trúc Backend hệ thống Microservices & FastAPI.",
            requirements="Thành thạo Python, SQLAlchemy, PostgreSQL, Docker.",
            benefits="Lương tháng 13, Thưởng dự án, Du lịch hàng năm.",
            status="published",
            created_by_id=user_objs["hr_manager"].id
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
            description="Chịu trách nhiệm toàn bộ quy trình tuyển dụng nhân sự Công nghệ & Khối vận hành.",
            requirements="Có 2+ năm kinh nghiệm tuyển dụng Tech, giao tiếp xuất sắc.",
            benefits="Môi trường trẻ trung, cơ hội thăng tiến Trưởng nhóm.",
            status="published",
            created_by_id=user_objs["hr_manager"].id
        )
        db.add(job2)
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        print(" -> Seeded 2 Published Jobs")

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

        sc1 = SharedCategory(category_type="candidate_source", name="Cổng tuyển dụng công ty (Career Site)", sort_order=1)
        sc2 = SharedCategory(category_type="candidate_source", name="Mạng xã hội LinkedIn", sort_order=2)
        sc3 = SharedCategory(category_type="candidate_source", name="Giới thiệu nội bộ (Referral)", sort_order=3)
        db.add(sc1)
        db.add(sc2)
        db.add(sc3)
        db.commit()
        print(" -> Seeded Job Titles, Competencies & Master Data Categories")

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
