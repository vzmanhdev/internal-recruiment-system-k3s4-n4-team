import logging
from typing import List, Dict, Any, Set
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.audit import Permission, RolePermission, AuditLog

logger = logging.getLogger("rbac_service")

# Default system roles mapping
DEFAULT_ROLES_MAP = {
    "admin": "Quản trị viên",
    "hr_manager": "Trưởng phòng HR",
    "recruiter": "Chuyên viên Tuyển dụng",
    "hiring_manager": "Trưởng bộ phận",
    "interviewer": "Người phỏng vấn",
    "approver": "Người duyệt",
    "employee": "Nhân sự nội bộ",
}


def sync_user_roles_from_legacy_string(db: Session, user: User) -> List[Role]:
    """Fallback migration helper to ensure legacy comma-separated user.role strings map to user_roles table."""
    role_codes = [r.strip() for r in (user.role or "").split(",") if r.strip()]
    if not role_codes:
        role_codes = ["employee"]

    existing_roles = db.query(Role).filter(Role.code.in_(role_codes)).all()
    existing_role_codes = {r.code for r in existing_roles}

    # Ensure missing roles exist in DB
    for code in role_codes:
        if code not in existing_role_codes:
            role_name = DEFAULT_ROLES_MAP.get(code, code.title())
            new_role = Role(code=code, name=role_name, is_active=True)
            db.add(new_role)
            db.commit()
            db.refresh(new_role)
            existing_roles.append(new_role)

    # Link user to user_roles
    user_roles_entries = db.query(UserRole).filter(UserRole.user_id == user.id).all()
    current_linked_role_ids = {ur.role_id for ur in user_roles_entries}

    for role in existing_roles:
        if role.id not in current_linked_role_ids:
            new_ur = UserRole(user_id=user.id, role_id=role.id)
            db.add(new_ur)

    db.commit()
    return existing_roles


def get_user_roles(db: Session, user: User) -> List[Dict[str, Any]]:
    """Returns all assigned role objects for a given user."""
    user_roles = (
        db.query(UserRole)
        .join(Role, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id, Role.is_active == True)
        .all()
    )

    if not user_roles:
        # Sync from legacy user.role string if empty
        roles = sync_user_roles_from_legacy_string(db, user)
        return [{"code": r.code, "name": r.name} for r in roles]

    return [{"code": ur.role.code, "name": ur.role.name} for ur in user_roles if ur.role]


def get_effective_permissions(db: Session, user: User) -> List[str]:
    """Calculates distinct UNION of active permissions for a user across all assigned roles.
    Super Admin (role='admin') automatically receives ALL active system permissions.
    """
    roles = get_user_roles(db, user)
    role_codes = [r["code"] for r in roles]

    # SUPER ADMIN FULL ALLOW ENFORCEMENT
    if "admin" in role_codes:
        all_perms = db.query(Permission.code).all()
        return sorted(list({p.code for p in all_perms}))

    if not role_codes:
        return []

    # DISTINCT UNION FOR OTHER ROLES
    granted_perms = (
        db.query(RolePermission.permission_code)
        .filter(
            RolePermission.role_code.in_(role_codes),
            RolePermission.is_granted == True
        )
        .distinct()
        .all()
    )

    return sorted(list({p.permission_code for p in granted_perms}))


def update_permission_matrix(db: Session, changes: List[Dict[str, Any]], actor_email: str) -> bool:
    """Updates role_permissions matrix in batch while enforcing IMMUTABLE Admin Column."""
    for change in changes:
        role_code = change.get("role_code")
        permission_code = change.get("permission_code")
        allowed = change.get("allowed", True)

        if role_code == "admin" and not allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quyền của vai trò Quản trị hệ thống là quyền toàn phần và không thể thay đổi.",
                headers={"X-Error-Code": "ADMIN_PERMISSION_IMMUTABLE"}
            )

        if role_code == "admin":
            continue  # Admin permissions are fixed ALLOW, ignore frontend changes

        # Check existing entry
        existing = db.query(RolePermission).filter(
            RolePermission.role_code == role_code,
            RolePermission.permission_code == permission_code
        ).first()

        if existing:
            existing.is_granted = allowed
        else:
            new_rp = RolePermission(
                role_code=role_code,
                permission_code=permission_code,
                is_granted=allowed
            )
            db.add(new_rp)

    db.commit()
    return True
