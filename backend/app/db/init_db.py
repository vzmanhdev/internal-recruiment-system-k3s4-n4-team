from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password, verify_password

def init_db():
    """
    Khởi tạo dữ liệu người dùng mặc định khi khởi động hệ thống.
    Đảm bảo luôn có tài khoản Admin System: admin@company.com / company123
    """
    db = SessionLocal()
    try:
        # 1. Đảm bảo tài khoản chính admin@company.com luôn tồn tại và đúng mật khẩu
        admin_company = db.query(User).filter(User.email == "admin@company.com").first()
        if not admin_company:
            admin_company = User(
                email="admin@company.com",
                full_name="Admin System",
                hashed_password=hash_password("company123"),
                role="admin",
                phone="0987654321",
                is_active=True
            )
            db.add(admin_company)
            db.commit()
            print("Đã khởi tạo thành công tài khoản quản trị: admin@company.com / company123")
        else:
            needs_update = False
            if not verify_password("company123", admin_company.hashed_password):
                admin_company.hashed_password = hash_password("company123")
                needs_update = True
            if admin_company.role != "admin" or not admin_company.is_active:
                admin_company.role = "admin"
                admin_company.is_active = True
                needs_update = True
            if needs_update:
                db.commit()
                print("Đã đồng bộ lại mật khẩu và quyền cho tài khoản: admin@company.com")

        # 2. Đồng bộ hỗ trợ tương thích nếu admin@gmail.com cũng được dùng
        admin_gmail = db.query(User).filter(User.email == "admin@gmail.com").first()
        if not admin_gmail:
            admin_gmail = User(
                email="admin@gmail.com",
                full_name="Admin System (Secondary)",
                hashed_password=hash_password("company123"),
                role="admin",
                phone="0987654321",
                is_active=True
            )
            db.add(admin_gmail)
            db.commit()
        else:
            if not verify_password("company123", admin_gmail.hashed_password):
                admin_gmail.hashed_password = hash_password("company123")
                admin_gmail.role = "admin"
                admin_gmail.is_active = True
                db.commit()
        # 3. Đảm bảo tài khoản Trưởng bộ phận (Hiring Manager): truongbophan@company.com / company123
        manager_user = db.query(User).filter(User.email == "truongbophan@company.com").first()
        if not manager_user:
            manager_user = User(
                email="truongbophan@company.com",
                full_name="Lê Trưởng Nhóm",
                hashed_password=hash_password("company123"),
                role="department_manager",
                phone="0912345678",
                is_active=True
            )
            db.add(manager_user)
            db.commit()
            print("Đã khởi tạo thành công tài khoản Trưởng bộ phận: truongbophan@company.com / company123")
        else:
            needs_update = False
            if not verify_password("company123", manager_user.hashed_password):
                manager_user.hashed_password = hash_password("company123")
                needs_update = True
            if manager_user.role != "department_manager" or not manager_user.is_active:
                manager_user.role = "department_manager"
                manager_user.is_active = True
                needs_update = True
            if needs_update:
                db.commit()
                print("Đã đồng bộ lại tài khoản Trưởng bộ phận: truongbophan@company.com / company123")
    except Exception as e:
        print(f"Lỗi khi khởi tạo tài khoản mặc định: {e}")
    finally:
        db.close()
