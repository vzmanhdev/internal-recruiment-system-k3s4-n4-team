from typing import Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.system import AuditLog
from app.models.user import User


def write_audit_log(
    db: Session,
    *,
    action: str,
    module: str,
    request: Optional[Request] = None,
    user: Optional[User] = None,
    email: Optional[str] = None,
    status: str = "success",
    details: str = "",
) -> None:
    ip_address = request.client.host if request and request.client else "unknown"
    entry = AuditLog(
        actor_id=user.id if user else None,
        actor=user.full_name if user else "Hệ thống",
        email=user.email if user else (email or "system@local"),
        action=action,
        module=module,
        ip_address=ip_address,
        status=status,
        details=details,
    )
    db.add(entry)
    db.commit()
