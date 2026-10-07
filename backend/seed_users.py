import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.db.session import SessionLocal, Base, engine
from app.models.user import User
from app.core.security import hash_password, verify_password

SYSTEM_ROLES_DATA = [
    {
        "email": "admin@company.com",
        "password": "company123",
        "full_name": "Admin System",
        "role": "admin",
        "phone": "0987654321",
        "position_title": "Quản Trị Viên Hệ Thống (System Admin)",
        "department_id": "dept-1",
        "bio": "Quản trị toàn bộ cài đặt, phân quyền và cấu hình hệ thống.",
        "redirect_route": "/admin"
    },
    {
        "email": "truongphong@company.com",
        "password": "company123",
        "full_name": "Trưởng Phòng Nhân Sự",
        "role": "hr_manager",
        "phone": "0912345001",
        "position_title": "Chủ Nhiệm Ban Nhân Sự (CHRO / HR Manager)",
        "department_id": "dept-4",
        "bio": "Quản lý toàn bộ ngân sách tuyển dụng, dải lương và phê duyệt định biên.",
        "redirect_route": "/hr-manager"
    },
    {
        "email": "truongbophan@company.com",
        "password": "company123",
        "full_name": "Lê Trưởng Nhóm",
        "role": "department_manager",
        "phone": "0912345002",
        "position_title": "Trưởng Bộ Phận Phát Triển Phần Mềm (Dev Lead)",
        "department_id": "dept-2-1",
        "bio": "Đề xuất nhu cầu tuyển dụng headcount và đánh giá chuyên môn ứng viên.",
        "redirect_route": "/manager"
    },
    {
        "email": "tuyendung@company.com",
        "password": "company123",
        "full_name": "Nguyễn Tuyển Dụng",
        "role": "recruiter",
        "phone": "0912345003",
        "position_title": "Chuyên Viên Tuyển Dụng Cao Cấp (Senior TA)",
        "department_id": "dept-4-1",
        "bio": "Sàng lọc CV, lên lịch phỏng vấn và vận hành đường ống tuyển dụng (Pipeline).",
        "redirect_route": "/recruiter"
    },
    {
        "email": "nguoiduyet@company.com",
        "password": "company123",
        "full_name": "Trần Đức Nam",
        "role": "approver",
        "phone": "0912345004",
        "position_title": "Giám Đốc Khối / Phê Duyệt Viên (Board Approver)",
        "department_id": "dept-1",
        "bio": "Phê duyệt các yêu cầu tuyển dụng và đề xuất mức lương Offer.",
        "redirect_route": "/approver"
    },
    {
        "email": "nhanvien@company.com",
        "password": "company123",
        "full_name": "Nguyễn Văn An",
        "role": "employee",
        "phone": "0912345005",
        "position_title": "Chuyên Viên Phát Triển Phần Mềm Nội Bộ",
        "department_id": "dept-2-1",
        "bio": "Ứng tuyển nội bộ hoặc giới thiệu nhân tài (Internal Referral).",
        "redirect_route": "/employee"
    },
    {
        "email": "ungvien@company.com",
        "password": "company123",
        "full_name": "Phạm Hoàng Nam",
        "role": "candidate",
        "phone": "0912345006",
        "position_title": "Ứng Viên Tự Do (External Candidate)",
        "department_id": None,
        "bio": "Ứng viên nộp hồ sơ trực tuyến qua cổng tuyển dụng.",
        "redirect_route": "/"
    },
]

def seed_system_roles():
    print("==================================================")
    print("STARTING SEEDING 7 SYSTEM ROLE ACCOUNTS")
    print("==================================================")
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    created_count = 0
    updated_count = 0

    try:
        for u_data in SYSTEM_ROLES_DATA:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    hashed_password=hash_password(u_data["password"]),
                    role=u_data["role"],
                    phone=u_data["phone"],
                    position_title=u_data["position_title"],
                    department_id=u_data["department_id"],
                    bio=u_data["bio"],
                    is_active=True
                )
                db.add(user)
                created_count += 1
                print(f"[CREATED] Role: {u_data['role']:<20} | Email: {u_data['email']:<25} | Pass: {u_data['password']} -> Route: {u_data['redirect_route']}")
            else:
                user.full_name = u_data["full_name"]
                user.role = u_data["role"]
                user.phone = u_data["phone"]
                user.position_title = u_data["position_title"]
                user.department_id = u_data["department_id"]
                user.bio = u_data["bio"]
                user.is_active = True
                updated_count += 1
                print(f"[PRESERVED] Role: {u_data['role']:<20} | Email: {u_data['email']:<25} (Password preserved) -> Route: {u_data['redirect_route']}")

        db.commit()
        print("--------------------------------------------------")
        print(f"SUCCESSFULLY SEEDED: {created_count} created, {updated_count} updated.")
        print("==================================================")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_system_roles()
