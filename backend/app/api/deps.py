from datetime import datetime, timedelta
from typing import Optional, Tuple, Set
from fastapi import Depends, HTTPException, status, Header, Request, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.auth_session import AuthSession
from app.core.security import decode_access_token
from app.core.config import settings

def authenticate_bearer(authorization: Optional[str], db: Session) -> Tuple[User, AuthSession]:
    """
    Centralized server-side authentication: JWT signature/expiry/type -> server-side session
    (exists, owned, not revoked, not expired, not idle) -> account status -> security version.
    Every guard (dependencies and legacy helpers) must go through this function.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "TOKEN_INVALID",
                "message": "Header Authorization bị thiếu hoặc không đúng định dạng 'Bearer <token>'"
            }
        )

    return authenticate_access_token(authorization.split(" ", 1)[1], db)


def authenticate_access_token(token: str, db: Session, allow_expired_jwt: bool = False) -> Tuple[User, AuthSession]:
    """Validate an access token and its server-side session.

    ``allow_expired_jwt`` is used only by the route-access check (page navigation): the JWT signature is
    still verified, and every session rule below (exists, owner, not revoked, absolute + idle expiry,
    account status, security version) still applies, so a revoked or expired session is always rejected.
    """
    payload = decode_access_token(token, verify_exp=not allow_expired_jwt)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "TOKEN_EXPIRED",
                "message": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
            }
        )

    user_id_str = payload.get("sub")
    session_id = payload.get("sid")
    token_ver = payload.get("ver", 1)

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Token không hợp lệ (thiếu user id)"}
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "User ID trong token không đúng định dạng"}
        )

    now = datetime.utcnow()

    # 1. Load User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Tài khoản không tồn tại trên hệ thống"}
        )

    if not user.is_active or user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "ACCOUNT_LOCKED" if user.account_status == "locked" else "ACCOUNT_INACTIVE",
                "message": user.lock_reason or "Tài khoản đang bị khóa hoặc không hoạt động."
            }
        )

    # 2. Security Version Check (Kill-switch)
    if int(token_ver) != user.security_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "SECURITY_VERSION_MISMATCH",
                "message": "Phiên đăng nhập không còn hợp lệ do mật khẩu hoặc quyền hạn đã được cập nhật. Vui lòng đăng nhập lại."
            }
        )

    # 3. Server-side session is mandatory: a token without a session id cannot be revoked.
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Token không gắn với phiên đăng nhập. Vui lòng đăng nhập lại."}
        )
    session_rec = db.query(AuthSession).filter(AuthSession.id == session_id).first()
    if not session_rec:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "SESSION_NOT_FOUND", "message": "Không tìm thấy phiên làm việc phía máy chủ."}
        )

    if session_rec.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "SESSION_ACCESS_DENIED", "message": "Phiên đăng nhập không thuộc về tài khoản này."}
        )

    if session_rec.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "SESSION_REVOKED",
                "message": f"Phiên đăng nhập này đã bị thu hồi ({session_rec.revoke_reason or 'Đã đăng xuất'})."
            }
        )

    if session_rec.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "SESSION_EXPIRED", "message": "Phiên đăng nhập đã hết hạn tối đa. Vui lòng đăng nhập lại."}
        )

    # Check Idle Timeout (60 minutes)
    idle_seconds = (now - session_rec.last_active_at).total_seconds()
    if settings.SESSION_IDLE_TIMEOUT_MINUTES > 0 and idle_seconds > (settings.SESSION_IDLE_TIMEOUT_MINUTES * 60):
        session_rec.revoked_at = now
        session_rec.revoke_reason = "SESSION_IDLE_EXPIRED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "SESSION_IDLE_EXPIRED",
                "message": "Phiên làm việc đã hết hạn do không hoạt động trong thời gian dài. Vui lòng đăng nhập lại."
            }
        )

    # Throttled update of last_active_at (at most once every 2 minutes)
    if (now - session_rec.last_active_at).total_seconds() > 120:
        session_rec.last_active_at = now
        db.commit()

    return user, session_rec


def get_current_session_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Tuple[User, AuthSession]:
    """FastAPI dependency wrapper around authenticate_bearer or query token. Returns (User, AuthSession)."""
    if authorization and authorization.startswith("Bearer "):
        return authenticate_access_token(authorization.split(" ", 1)[1], db)
    if token:
        return authenticate_access_token(token, db)
    return authenticate_bearer(authorization, db)

def get_current_user_obj(deps_data: Tuple[User, AuthSession] = Depends(get_current_session_user)) -> User:
    return deps_data[0]

def require_roles_dep(allowed_roles: Set[str]):
    def _role_checker(
        deps_data: Tuple[User, AuthSession] = Depends(get_current_session_user),
        db: Session = Depends(get_db)
    ) -> User:
        from app.services.rbac_service import get_user_roles
        user = deps_data[0]
        roles = get_user_roles(db, user)
        role_codes = {r["code"] for r in roles}
        if "admin" in role_codes:
            return user
        if not role_codes.intersection(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "Bạn không có quyền thực hiện thao tác này."}
            )
        return user
    return _role_checker


def require_permission(permission_code: str):
    def _permission_checker(
        deps_data: Tuple[User, AuthSession] = Depends(get_current_session_user),
        db: Session = Depends(get_db)
    ) -> User:
        from app.services.rbac_service import get_effective_permissions, get_user_roles
        user = deps_data[0]
        roles = get_user_roles(db, user)
        # Admin Full Allow does not depend on the permissions table being seeded.
        if any(r["code"] == "admin" for r in roles):
            return user

        effective_permissions = set(get_effective_permissions(db, user))
        if permission_code in effective_permissions:
            return user

        role_names = ", ".join([r["name"] for r in roles]) if roles else (user.role or "Không xác định")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PERMISSION_DENIED",
                "message": f"Tài khoản thuộc vai trò '{role_names}' chưa được cấp quyền [{permission_code}] trong Ma trận Phân quyền CSDL."
            }
        )
    return _permission_checker
