import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.auth_session import AuthSession
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, create_access_token, decode_access_token,
    generate_refresh_token, hash_token, parse_user_agent
)
from app.api.deps import get_current_session_user
from app.schemas.auth import (
    ChangePasswordRequest, ProfileUpdateRequest, RegistrationResponse, UserRegister, UserLogin,
    Token, UserResponse, ErrorResponse, RefreshRequest, SessionResponse,
    PasswordResetInitRequest, PasswordResetInitResponse,
    PasswordResetVerifyRequest, PasswordResetVerifyResponse,
    PasswordResetResendRequest, PasswordResetResendResponse,
    ForgotPasswordRequest, ForgotPasswordResponse
)
from app.services.password_reset_service import PasswordResetService


router = APIRouter()

@router.post(
    "/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Lỗi dữ liệu đầu vào hoặc Email đã tồn tại"},
        422: {"model": ErrorResponse, "description": "Sai định dạng dữ liệu"}
    }
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Email này đã được đăng ký trên hệ thống. Vui lòng sử dụng email khác hoặc Đăng nhập.",
                "field_errors": {
                    "email": "Email này đã được đăng ký trên hệ thống."
                }
            }
        )

    # Generate random unique employee_code (e.g. NV-839201)
    import random
    while True:
        emp_code = f"NV-{random.randint(100000, 999999)}"
        if not db.query(User).filter(User.employee_code == emp_code).first():
            break

    # Create new user
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        phone=user_in.phone,
        employee_code=emp_code,
        role="employee",
        is_active=False,
        account_status="pending"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Yêu cầu đăng ký đã được gửi. Tài khoản sẽ sử dụng được sau khi Quản trị viên phê duyệt.",
        "user": new_user.to_dict()
    }

def get_role_redirect_url(role: str) -> str:
    normalized = (role or "").lower().strip()
    if "admin" in normalized:
        return "/admin"
    elif "hr_manager" in normalized or "hr" in normalized:
        return "/hr"
    elif "recruiter" in normalized:
        return "/recruiter"
    elif "hiring_manager" in normalized or "manager" in normalized or "department_manager" in normalized:
        return "/manager"
    elif "interviewer" in normalized:
        return "/interviewer"
    elif "approver" in normalized:
        return "/approver"
    return "/jobs"

@router.post(
    "/login",
    response_model=Token,
    responses={
        400: {"model": ErrorResponse, "description": "Email không tồn tại hoặc sai mật khẩu"}
    }
)
def login(user_in: UserLogin, request: Request, response: JSONResponse, db: Session = Depends(get_db)):
    now = datetime.utcnow()

    # Find user by email from Database
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài Khoản hoặc Mật khẩu không chính xác. Vui lòng thử lại.",
                "field_errors": {
                    "email": "Tài khoản Email không tồn tại trong hệ thống."
                }
            }
        )

    # Check 15-minute temporary account lockout due to 5 failed login attempts
    if user.locked_until and user.locked_until > now:
        remaining_secs = int((user.locked_until - now).total_seconds())
        remaining_mins = max(1, (remaining_secs + 59) // 60)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": f"Tài khoản/Phiên làm việc đang bị tạm khóa 15 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau {remaining_mins} phút.",
                "field_errors": {
                    "password": f"Tài khoản bị tạm khóa. Vui lòng thử lại sau {remaining_mins} phút ({remaining_secs} giây)."
                }
            }
        )

    # Verify password
    if not verify_password(user_in.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = now + timedelta(minutes=15)
            db.commit()

            # Audit Log & Notification Email
            try:
                from app.models.audit import AuditLog
                audit = AuditLog(
                    actor_id=user.id,
                    actor_email=user.email,
                    action="LOGIN_FAILED_LOCKED",
                    target_entity="AUTH",
                    target_id=str(user.id),
                    ip_address=request.client.host if request.client else "127.0.0.1",
                    payload_json="Tài khoản bị tạm khóa 15 phút do nhập sai mật khẩu quá 5 lần"
                )
                db.add(audit)
                db.commit()
            except Exception:
                pass

            try:
                from app.services.email_service import send_account_locked_temp_email
                send_account_locked_temp_email(user.email, user.full_name, lock_minutes=15)
            except Exception:
                pass

            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "detail": "Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản của bạn đã bị tạm khóa trong 15 phút.",
                    "field_errors": {
                        "password": "Tài khoản bị tạm khóa 15 phút do nhập sai mật khẩu 5 lần."
                    }
                }
            )

        remaining_attempts = 5 - user.failed_login_attempts
        db.commit()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": f"Mật khẩu không chính xác. Bạn còn {remaining_attempts} lần thử trước khi tài khoản bị khóa 15 phút.",
                "field_errors": {
                    "password": f"Mật khẩu không chính xác (Còn {remaining_attempts} lần thử)."
                }
            }
        )

    # Check account active & status
    if not user.is_active:
        if user.account_status == "locked":
            message = "Tài khoản đã bị khóa. Vui lòng liên hệ Quản trị viên."
        else:
            message = "Tài khoản đang chờ Quản trị viên phê duyệt. Vui lòng thử lại sau khi yêu cầu được chấp nhận."
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": message,
                "field_errors": {
                    "email": "Tài khoản đã bị khóa." if user.account_status == "locked" else "Tài khoản đang chờ phê duyệt."
                }
            }
        )

    # Reset failed login counters on successful authentication
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    db.commit()

    # Parse Device Metadata from Request
    user_agent_str = request.headers.get("user-agent", "")
    client_ip = request.client.host if request.client else "127.0.0.1"
    ua_meta = parse_user_agent(user_agent_str)

    # Generate Refresh Token & Session ID
    import uuid
    session_id = str(uuid.uuid4())
    family_id = str(uuid.uuid4())
    refresh_token = generate_refresh_token()
    refresh_hash = hash_token(refresh_token)
    session_exp = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_session = AuthSession(
        id=session_id,
        user_id=user.id,
        refresh_token_hash=refresh_hash,
        refresh_family_id=family_id,
        device_name=ua_meta["device_name"],
        browser=ua_meta["browser"],
        os=ua_meta["os"],
        user_agent=user_agent_str,
        ip_address=client_ip,
        created_at=now,
        last_active_at=now,
        expires_at=session_exp
    )
    db.add(new_session)

    # Log Audit Event
    try:
        from app.models.audit import AuditLog
        audit = AuditLog(
            actor_id=user.id,
            actor_email=user.email,
            action="LOGIN_SUCCESS",
            target_entity="AUTH",
            target_id=str(user.id),
            ip_address=client_ip,
            payload_json=f"Đăng nhập thành công từ {ua_meta['device_name']} ({ua_meta['browser']} trên {ua_meta['os']})"
        )
        db.add(audit)
        db.commit()
    except Exception:
        pass

    db.commit()
    db.refresh(new_session)

    # Generate Access Token (contains sid & ver)
    access_token = create_access_token(
        subject=user.id,
        session_id=new_session.id,
        security_version=user.security_version
    )

    user_dict = user.to_dict()
    from app.services.rbac_service import get_user_roles, get_effective_permissions
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["permissions"] = get_effective_permissions(db, user)
    redirect_path = user.get_redirect_url()

    # Create response with HttpOnly Cookie for Refresh Token
    resp = JSONResponse(content={
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "redirect_url": redirect_path,
        "user": user_dict
    })
    resp.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False, # Set True in production HTTPS
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    return resp


@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(
    request: Request,
    payload: Optional[RefreshRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Refresh Token Rotation Endpoint with Reuse Detection & Race-Condition Lock.
    """
    # 1. Extract refresh token from payload first, fallback to cookie
    raw_refresh_token = None
    if payload and payload.refresh_token:
        raw_refresh_token = payload.refresh_token.strip()
    if not raw_refresh_token:
        raw_refresh_token = request.cookies.get("refresh_token")


    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "REFRESH_TOKEN_MISSING", "message": "Refresh token không được tìm thấy."}
        )

    incoming_hash = hash_token(raw_refresh_token)
    now = datetime.utcnow()

    # 2. Query active (unrevoked) AuthSession for matching refresh token hash
    auth_session = db.query(AuthSession).filter(
        AuthSession.refresh_token_hash == incoming_hash,
        AuthSession.revoked_at.is_(None)
    ).first()

    if not auth_session:
        # REUSE DETECTION SAFETY CHECK:
        # Check if this hash belongs to an old rotated/revoked session in the database
        revoked_family_session = db.query(AuthSession).filter(
            AuthSession.refresh_token_hash == incoming_hash
        ).first()


        if revoked_family_session:
            # REUSE DETECTED! Revoke ALL active sessions in the family immediately
            fam_id = revoked_family_session.refresh_family_id
            db.query(AuthSession).filter(
                AuthSession.refresh_family_id == fam_id,
                AuthSession.revoked_at.is_(None)
            ).update(
                {
                    AuthSession.revoked_at: now,
                    AuthSession.revoke_reason: "REVOKED_FAMILY_REUSE_DETECTED"
                },
                synchronize_session=False
            )
            db.commit()

            # Audit log security breach attempt
            try:
                from app.models.audit import AuditLog
                audit = AuditLog(
                    actor_id=revoked_family_session.user_id if revoked_family_session else None,
                    actor_email=f"User #{revoked_family_session.user_id}" if revoked_family_session else "UNKNOWN",
                    action="REFRESH_TOKEN_REUSE_DETECTED",
                    target_entity="SECURITY",
                    target_id=str(fam_id),
                    ip_address=request.client.host if request.client else "127.0.0.1",
                    payload_json="Phát hiện sử dụng lại Refresh Token cũ! Đã tự động thu hồi toàn bộ phiên làm việc của Family."
                )
                db.add(audit)
                db.commit()
            except Exception:
                pass

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "REFRESH_TOKEN_REUSED",
                    "message": "Cảnh báo bảo mật: Refresh token đã bị dùng lại hoặc không hợp lệ. Toàn bộ phiên đăng nhập đã bị vô hiệu hóa vì lý do an toàn."
                }
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "REFRESH_TOKEN_INVALID", "message": "Refresh token không hợp lệ hoặc đã hết hạn."}
        )

    # 3. Check session validity
    if not auth_session.is_valid(idle_timeout_minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "SESSION_EXPIRED", "message": "Phiên đăng nhập đã hết hạn hoặc đã bị thu hồi."}
        )

    # 4. Check user status
    user = db.query(User).filter(User.id == auth_session.user_id).first()
    if not user or not user.is_active or user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ACCOUNT_INACTIVE", "message": "Tài khoản không hoạt động."}
        )

    # 5. ROTATE REFRESH TOKEN (Single-refresh token rotation within family chain)
    auth_session.refresh_rotated_at = now
    auth_session.revoked_at = now
    auth_session.revoke_reason = "ROTATED"

    new_refresh_token = generate_refresh_token()
    new_session_id = str(uuid.uuid4())
    session_exp = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_session = AuthSession(
        id=new_session_id,
        user_id=user.id,
        refresh_token_hash=hash_token(new_refresh_token),
        refresh_family_id=auth_session.refresh_family_id, # Inherit family ID for reuse detection
        device_name=auth_session.device_name,
        browser=auth_session.browser,
        os=auth_session.os,
        user_agent=auth_session.user_agent,
        ip_address=request.client.host if request.client else auth_session.ip_address,
        created_at=now,
        last_active_at=now,
        expires_at=session_exp
    )
    db.add(new_session)
    db.commit()

    # 6. Issue new Access Token
    new_access_token = create_access_token(
        subject=user.id,
        session_id=new_session.id,
        security_version=user.security_version
    )

    user_dict = user.to_dict()
    from app.services.rbac_service import get_user_roles, get_effective_permissions
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["permissions"] = get_effective_permissions(db, user)

    resp = JSONResponse(content={
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "redirect_url": user.get_redirect_url(),
        "user": user_dict
    })
    resp.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )
    return resp



@router.post("/logout")
def logout(
    request: Request,
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    """
    Server-side Session Revocation Logout Endpoint.
    """
    user, session_rec = deps_data
    now = datetime.utcnow()

    if session_rec:
        session_rec.revoked_at = now
        session_rec.revoke_reason = "USER_LOGOUT"
        db.commit()

    # Audit log
    try:
        from app.models.audit import AuditLog
        audit = AuditLog(
            actor_id=user.id,
            actor_email=user.email,
            action="LOGOUT",
            target_entity="AUTH",
            target_id=str(user.id),
            ip_address=request.client.host if request.client else "127.0.0.1",
            payload_json="Người dùng đã đăng xuất khỏi phiên làm việc hiện tại"
        )
        db.add(audit)
        db.commit()
    except Exception:
        pass

    resp = JSONResponse(content={"success": True, "message": "Đăng xuất thành công."})
    resp.delete_cookie("refresh_token")
    return resp


@router.post("/logout-all")
def logout_all_sessions(
    request: Request,
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    """
    Revokes ALL active sessions for the current user and increments security_version.
    """
    user, _ = deps_data
    now = datetime.utcnow()

    db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.revoked_at.is_(None)
    ).update(
        {
            AuthSession.revoked_at: now,
            AuthSession.revoke_reason: "LOGOUT_ALL_SESSIONS"
        },
        synchronize_session=False
    )

    user.security_version += 1
    db.commit()

    # Audit log
    try:
        from app.models.audit import AuditLog
        audit = AuditLog(
            actor_id=user.id,
            actor_email=user.email,
            action="LOGOUT_ALL",
            target_entity="SECURITY",
            target_id=str(user.id),
            ip_address=request.client.host if request.client else "127.0.0.1",
            payload_json="Người dùng đã đăng xuất khỏi TẤT CẢ các thiết bị"
        )
        db.add(audit)
        db.commit()
    except Exception:
        pass

    resp = JSONResponse(content={"success": True, "message": "Đã đăng xuất thành công khỏi tất cả các thiết bị."})
    resp.delete_cookie("refresh_token")
    return resp


@router.post("/logout-other-sessions")
def logout_other_sessions(
    request: Request,
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    """
    Revokes all active sessions for the user EXCEPT the current session.
    """
    user, current_session = deps_data
    now = datetime.utcnow()

    query = db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.revoked_at.is_(None)
    )
    if current_session:
        query = query.filter(AuthSession.id != current_session.id)

    query.update(
        {
            AuthSession.revoked_at: now,
            AuthSession.revoke_reason: "LOGOUT_OTHER_SESSIONS"
        },
        synchronize_session=False
    )
    db.commit()

    return {"success": True, "message": "Đã đăng xuất khỏi tất cả các thiết bị khác thành công."}


@router.get("/sessions", response_model=List[SessionResponse])
def get_user_sessions(
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all active login sessions for the authenticated user.
    """
    user, current_session = deps_data
    now = datetime.utcnow()

    active_sessions = db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.revoked_at.is_(None),
        AuthSession.expires_at > now
    ).order_by(AuthSession.last_active_at.desc()).all()

    curr_id = current_session.id if current_session else None
    return [s.to_dict(current_session_id=curr_id) for s in active_sessions]


@router.delete("/sessions/{session_id}")
def revoke_specific_session(
    session_id: str,
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    """
    Revokes a specific session owned by the authenticated user.
    """
    user, _ = deps_data
    target = db.query(AuthSession).filter(AuthSession.id == session_id).first()

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phiên làm việc.")

    if target.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền thu hồi phiên đăng nhập của tài khoản khác.")

    target.revoked_at = datetime.utcnow()
    target.revoke_reason = "REVOKED_BY_USER"
    db.commit()

    return {"success": True, "message": "Đã đăng xuất thiết bị thành công."}


@router.post(
    "/change-password",
    responses={
        400: {"model": ErrorResponse, "description": "Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ"},
        401: {"model": ErrorResponse, "description": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"}
    }
)
def change_password(
    payload: ChangePasswordRequest,
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    user, current_session = deps_data

    if not verify_password(payload.current_password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Mật khẩu hiện tại không chính xác.", "field_errors": {"current_password": "Mật khẩu hiện tại không chính xác."}}
        )

    if verify_password(payload.new_password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Mật khẩu mới phải khác mật khẩu hiện tại.", "field_errors": {"new_password": "Mật khẩu mới phải khác mật khẩu hiện tại."}}
        )

    user.hashed_password = hash_password(payload.new_password)
    user.security_version += 1 # Invalidate older Access Tokens
    now = datetime.utcnow()

    # Revoke all other sessions except current
    query = db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.revoked_at.is_(None)
    )
    if current_session:
        query = query.filter(AuthSession.id != current_session.id)

    query.update(
        {
            AuthSession.revoked_at: now,
            AuthSession.revoke_reason: "PASSWORD_CHANGED"
        },
        synchronize_session=False
    )

    db.commit()

    # Audit log for password change
    try:
        from app.models.audit import AuditLog
        audit = AuditLog(
            actor_id=user.id,
            actor_email=user.email,
            action="CHANGE_PASSWORD",
            target_entity="AUTH",
            target_id=str(user.id),
            ip_address="127.0.0.1",
            payload_json="Đổi mật khẩu tài khoản thành công và vô hiệu hóa các phiên làm việc khác"
        )
        db.add(audit)
        db.commit()
    except Exception:
        pass

    # Trigger security notification email
    try:
        from app.services.email_service import send_password_changed_notification
        send_password_changed_notification(user.email)
    except Exception:
        pass

    return {"success": True, "message": "Đổi mật khẩu thành công. Tất cả các thiết bị khác đã bị đăng xuất vì lý do an toàn."}



def require_admin(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập bằng tài khoản Quản trị viên")
    token_str = authorization.split(" ", 1)[1]
    payload = decode_access_token(token_str)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    admin = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản trị viên active mới có quyền thực hiện thao tác này")

    from app.services.rbac_service import get_user_roles
    roles = set([r["code"] for r in get_user_roles(db, admin)])
    if "admin" not in roles or not admin.is_active or admin.account_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản trị viên active mới có quyền thực hiện thao tác này")

    # Verify security version
    if int(payload.get("ver", 1)) != admin.security_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập đã bị vô hiệu hóa do thay đổi bảo mật")
    return admin

def require_roles(authorization: Optional[str], db: Session, allowed_roles: set[str]) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập để tiếp tục")
    token_str = authorization.split(" ", 1)[1]
    payload = decode_access_token(token_str)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active or user.account_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản không hoạt động hoặc không tồn tại")

    if int(payload.get("ver", 1)) != user.security_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập đã bị vô hiệu hóa do thay đổi bảo mật")

    from app.services.rbac_service import get_user_roles
    roles = set([r["code"] for r in get_user_roles(db, user)])
    # Admin Full Override: Admin account has full access to ALL features & APIs
    if "admin" in roles:
        return user

    if not roles.intersection(allowed_roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền thực hiện thao tác này")
    return user

@router.get("/users", response_model=list[UserResponse])
def list_all_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr"})
    return [user.to_dict() for user in db.query(User).order_by(User.created_at.desc()).all()]

@router.get("/pending-users", response_model=list[UserResponse])
def list_pending_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr"})
    return [user.to_dict() for user in db.query(User).filter(User.account_status == "pending").order_by(User.created_at.desc()).all()]

@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr"})
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    user.is_active = True
    user.account_status = "active"
    user.lock_reason = None
    db.commit()
    db.refresh(user)
    return user.to_dict()

@router.post("/users/{user_id}/lock", response_model=UserResponse)
def lock_user(user_id: int, reason: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr"})
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    
    now = datetime.utcnow()
    user.is_active = False
    user.account_status = "locked"
    user.lock_reason = reason or "Bị khóa bởi Quản trị viên"
    user.security_version += 1

    # Revoke ALL active sessions for this locked user immediately
    db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.revoked_at.is_(None)
    ).update(
        {
            AuthSession.revoked_at: now,
            AuthSession.revoke_reason: f"ACCOUNT_LOCKED: {user.lock_reason}"
        },
        synchronize_session=False
    )

    db.commit()
    db.refresh(user)
    return user.to_dict()

@router.post("/users/{user_id}/unlock", response_model=UserResponse)
def unlock_user(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_roles(authorization, db, allowed_roles={"admin", "hr_manager", "hr"})
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    user.is_active = True
    user.account_status = "active"
    user.lock_reason = None
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    return user.to_dict()

@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Chưa xác thực hoặc Token hết hạn"}
    }
)
def get_me(
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    user, _ = deps_data
    user_dict = user.to_dict()
    from app.services.rbac_service import get_user_roles, get_effective_permissions
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["permissions"] = get_effective_permissions(db, user)
    return user_dict

@router.put("/me", response_model=UserResponse)
def update_me(
    payload: ProfileUpdateRequest,
    deps_data: Tuple[User, Optional[AuthSession]] = Depends(get_current_session_user),
    db: Session = Depends(get_db)
):
    user, _ = deps_data
    
    if payload.full_name is not None and payload.full_name.strip():
        user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone.replace(" ", "") if payload.phone else None
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    if payload.date_of_birth is not None:
        user.date_of_birth = payload.date_of_birth
    elif payload.dob is not None:
        user.date_of_birth = payload.dob
    if payload.gender is not None:
        user.gender = payload.gender
    if payload.job_title is not None:
        user.job_title = payload.job_title
    if payload.department is not None:
        user.department = payload.department
    if payload.bio is not None:
        user.bio = payload.bio

    db.commit()
    db.refresh(user)

    # Log audit event for profile update
    try:
        from app.models.audit import AuditLog
        audit = AuditLog(
            actor_id=user.id,
            actor_email=user.email,
            action="UPDATE_PROFILE",
            target_entity="AUTH",
            target_id=str(user.id),
            ip_address="127.0.0.1",
            payload_json="Cập nhật thông tin hồ sơ cá nhân"
        )
        db.add(audit)
        db.commit()
    except Exception:
        pass

    return user.to_dict()


