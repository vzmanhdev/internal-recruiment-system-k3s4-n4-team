import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal, engine, Base
import app.models
import app.main
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission

ROLES_DATA = [
    {"code": "admin", "name": "Quản trị viên", "description": "Toàn quyền quản trị hệ thống và truy cập Admin Console"},
    {"code": "hr_manager", "name": "Trưởng phòng HR", "description": "Quản lý tổng quan tuyển dụng, định biên và quy trình"},
    {"code": "recruiter", "name": "Chuyên viên Tuyển dụng", "description": "Thực thi đăng tuyển, lọc hồ sơ và điều phối ứng viên"},
    {"code": "hiring_manager", "name": "Trưởng bộ phận", "description": "Khởi tạo đề xuất nhu cầu và quyết định tuyển dụng"},
    {"code": "interviewer", "name": "Người phỏng vấn", "description": "Tham gia đánh giá và nộp phiếu phỏng vấn ứng viên"},
    {"code": "approver", "name": "Người duyệt", "description": "Phê duyệt các đề xuất tuyển dụng và đề nghị Offer"},
    {"code": "employee", "name": "Nhân sự nội bộ", "description": "Xem cơ hội việc làm nội bộ, giới thiệu ứng viên và cập nhật hồ sơ"},
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
]

# Baseline role grants for non-admin default matrix
DEFAULT_GRANTED_MATRIX = {
    "hr_manager": ["user:view", "requisition:view", "requisition:create", "requisition:edit", "requisition:approve", "candidate:view", "candidate:create", "candidate:evaluate", "candidate:view_salary", "interview:view", "interview:schedule", "interview:evaluate", "offer:view", "offer:create", "offer:approve", "master_data:manage"],
    "recruiter": ["requisition:view", "candidate:view", "candidate:create", "candidate:evaluate", "interview:view", "interview:schedule", "interview:evaluate", "offer:view", "offer:create"],
    "hiring_manager": ["requisition:view", "requisition:create", "requisition:edit", "candidate:view", "candidate:evaluate", "interview:view", "interview:evaluate"],
    "interviewer": ["interview:view", "interview:evaluate", "candidate:view"],
    "approver": ["requisition:view", "requisition:approve", "offer:view", "offer:approve"],
    "employee": ["requisition:view"],
}


def seed_rbac():
    db = SessionLocal()
    try:
        # 1. Create tables if not exist
        Base.metadata.create_all(bind=engine)

        print("[SEED RBAC] Seeding roles...")
        role_objs = {}
        for r_data in ROLES_DATA:
            role = db.query(Role).filter(Role.code == r_data["code"]).first()
            if not role:
                role = Role(code=r_data["code"], name=r_data["name"], description=r_data["description"])
                db.add(role)
                db.commit()
                db.refresh(role)
            role_objs[role.code] = role

        print("[SEED RBAC] Seeding permissions...")
        perm_objs = {}
        for p_data in PERMISSIONS_DATA:
            perm = db.query(Permission).filter(Permission.code == p_data["code"]).first()
            if not perm:
                perm = Permission(code=p_data["code"], name=p_data["name"], module=p_data["module"])
                db.add(perm)
                db.commit()
                db.refresh(perm)
            perm_objs[perm.code] = perm

        print("[SEED RBAC] Seeding role_permissions matrix...")
        for role_code, role in role_objs.items():
            if role_code == "admin":
                # Admin automatically has ALL permissions ALLOWED
                for p_code in perm_objs.keys():
                    existing = db.query(RolePermission).filter(RolePermission.role_code == "admin", RolePermission.permission_code == p_code).first()
                    if not existing:
                        db.add(RolePermission(role_code="admin", permission_code=p_code, is_granted=True))
            else:
                granted_list = DEFAULT_GRANTED_MATRIX.get(role_code, [])
                for p_code in perm_objs.keys():
                    is_granted = p_code in granted_list
                    existing = db.query(RolePermission).filter(RolePermission.role_code == role_code, RolePermission.permission_code == p_code).first()
                    if not existing:
                        db.add(RolePermission(role_code=role_code, permission_code=p_code, is_granted=is_granted))
        db.commit()

        print("[SEED RBAC] Migrating users to user_roles table...")
        users = db.query(User).all()
        for u in users:
            role_codes = [r.strip() for r in (u.role or "").split(",") if r.strip()]
            for r_code in role_codes:
                if r_code in role_objs:
                    r_id = role_objs[r_code].id
                    existing_ur = db.query(UserRole).filter(UserRole.user_id == u.id, UserRole.role_id == r_id).first()
                    if not existing_ur:
                        db.add(UserRole(user_id=u.id, role_id=r_id))
        db.commit()
        print("[SEED RBAC] RBAC Seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_rbac()
