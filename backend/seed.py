import sys
import os

# Ensure UTF-8 output encoding on Windows terminals
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


from app.db.session import engine, SessionLocal, Base
from app.core.security import hash_password

# Import all models to ensure metadata has complete table registrations
from app.models.user import User
from app.models.hr import Department
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.referral_eval import InternalReferral, CandidateEvaluation
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.offer_onboarding import JobOffer, OnboardingChecklist


def reset_and_seed_database():
    print("=" * 60)
    print("🔄 DANG RESET TOAN BO DATABASE VÀ KHOI TẠO DU LIEU BEN MẶC DINH...")
    print("=" * 60)

    # 1. Drop all existing tables
    print("🔻 1. Xóa toàn bộ các bảng hiện có (Drop all tables)...")
    Base.metadata.drop_all(bind=engine)

    # 2. Re-create all tables
    print("✨ 2. Khởi tạo lại cấu trúc các bảng mới (Create all tables)...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 3. Create Default Departments
        print("🏢 3. Khởi tạo danh mục Phòng ban mặc định...")
        dept_eng = Department(name="Khối Kỹ Thuật (Engineering)", code="ENG", sort_order=1, is_active=True)
        dept_prod = Department(name="Khối Sản Phẩm (Product)", code="PROD", sort_order=2, is_active=True)
        dept_sales = Department(name="Khối Kinh Doanh (Sales)", code="SALES", sort_order=3, is_active=True)
        dept_hr = Department(name="Phòng Nhân Sự (HR)", code="HR", sort_order=4, is_active=True)

        db.add_all([dept_eng, dept_prod, dept_sales, dept_hr])
        db.commit()

        # 4. Create Default Accounts
        print("👤 4. Tạo tài khoản Admin & các vai trò mặc định...")
        default_users = [
            User(
                email="admin@company.com",
                hashed_password=hash_password("admin123"),
                full_name="Quản Trị Viên Hệ Thống (System Admin)",
                role="admin",
                is_active=True,
                account_status="active",
            ),
            User(
                email="hr@company.com",
                hashed_password=hash_password("admin123"),
                full_name="Trưởng Phòng HR (HR Manager)",
                role="hr_manager",
                is_active=True,
                account_status="active",
            ),
            User(
                email="depthead@company.com",
                hashed_password=hash_password("admin123"),
                full_name="Trưởng Phòng Kỹ Thuật (Dept Head)",
                role="dept_head",
                is_active=True,
                account_status="active",
            ),
            User(
                email="employee@company.com",
                hashed_password=hash_password("admin123"),
                full_name="Nguyễn Văn Nhân Viên (Employee)",
                role="employee",
                is_active=True,
                account_status="active",
            ),
        ]

        db.add_all(default_users)
        db.commit()

        print("\n" + "✅" * 30)
        print("🎉 RESET DATABASE THÀNH CÔNG!")
        print("=" * 60)
        print("📋 DANH SÁCH TÀI KHOẢN MẶC ĐỊNH ĐÃ TẠO:")
        print("------------------------------------------------------------")
        print("1. 🔑 ADMIN (Quản trị hệ thống):")
        print("   - Email:    admin@company.com")
        print("   - Password: admin123")
        print("   - Role:     admin")
        print("------------------------------------------------------------")
        print("2. 👩‍💼 HR MANAGER (Quản lý Nhân sự):")
        print("   - Email:    hr@company.com")
        print("   - Password: admin123")
        print("   - Role:     hr_manager")
        print("------------------------------------------------------------")
        print("3. 👨‍💼 DEPT HEAD (Trưởng phòng Ban):")
        print("   - Email:    depthead@company.com")
        print("   - Password: admin123")
        print("   - Role:     dept_head")
        print("------------------------------------------------------------")
        print("4. 🧑‍💻 EMPLOYEE (Nhân viên nội bộ):")
        print("   - Email:    employee@company.com")
        print("   - Password: admin123")
        print("   - Role:     employee")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi khởi tạo Seed Data: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed_database()
