import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal, engine, Base
import app.models
import app.main
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission

from app.db.rbac_catalog import (  # noqa: F401  re-exported for existing imports
    ROLES_DATA, PERMISSIONS_DATA, DEFAULT_GRANTED_MATRIX, WORKSPACE_GRANTS, ensure_permission_catalog,
)


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

