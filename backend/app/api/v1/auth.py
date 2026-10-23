import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Query
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
from app.api.deps import get_current_session_user, authenticate_bearer
from app.schemas.auth import (
    ChangePasswordRequest, ProfileUpdateRequest, UserLogin,
    RegistrationStartRequest, RegistrationVerifyRequest, RegistrationResendRequest,
    RegistrationChallengeResponse, RegistrationCompletedResponse,
    Token, UserResponse, ErrorResponse, RefreshRequest, SessionResponse,
    PasswordResetInitRequest, PasswordResetInitResponse,
    PasswordResetVerifyRequest, PasswordResetVerifyResponse,
    PasswordResetResendRequest, PasswordResetResendResponse,
    ForgotPasswordRequest, ForgotPasswordResponse
)
from app.services.password_reset_service import PasswordResetService
from app.services import login_guard


router = APIRouter()

# Pre-computed bcrypt hash used to equalise login timing for unknown emails.
_DUMMY_PASSWORD_HASH = hash_password("timing-equaliser-not-a-real-password")

# HttpOnly cookie carrying the access token for *page navigation checks only* (frontend proxy → /auth/route-access).
# API calls keep using the Authorization header. Path "/" so the browser also sends it to the Next.js server.
ROUTE_ACCESS_COOKIE = "ats_access"


def _set_route_cookie(resp: JSONResponse, access_token: str) -> None:
    resp.set_cookie(
        key=ROUTE_ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
        max_age=settings.SESSION_ABSOLUTE_TIMEOUT_HOURS * 3600,
    )


def _clear_route_cookie(resp: JSONResponse) -> None:
    resp.delete_cookie(ROUTE_ACCESS_COOKIE, path="/")

# ---------------------------------------------------------------------------------------------
# Public candidate self-registration with e-mail OTP (no admin approval; see registration_service)
# ---------------------------------------------------------------------------------------------
def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "127.0.0.1"


REGISTRATION_ERRORS = {
    404: {"model": ErrorResponse, "description": "OTP_CHALLENGE_NOT_FOUND"},
    409: {"model": ErrorResponse, "description": "EMAIL_ALREADY_REGISTERED / OTP_ALREADY_USED / OTP_SUPERSEDED"},
    410: {"model": ErrorResponse, "description": "OTP_EXPIRED / OTP_CHALLENGE_CANCELLED"},
    422: {"model": ErrorResponse, "description": "Sai định dạng dữ liệu / EMAIL_DOMAIN_NOT_ALLOWED"},
    429: {"model": ErrorResponse, "description": "OTP_RESEND_COOLDOWN / REGISTRATION_RATE_LIMITED / REGISTRATION_TEMPORARILY_BLOCKED"},
    502: {"model": ErrorResponse, "description": "EMAIL_DELIVERY_FAILED"},
    503: {"model": ErrorResponse, "description": "EMAIL_DELIVERY_UNAVAILABLE"},
}


@router.post("/register/start", response_model=RegistrationChallengeResponse, status_code=status.HTTP_202_ACCEPTED,
             responses=REGISTRATION_ERRORS)
def register_start(payload: RegistrationStartRequest, request: Request, db: Session = Depends(get_db)):
    """Validate the registration and e-mail a 6-digit code. No account exists until /register/verify succeeds."""
    from app.services import registration_service
    return registration_service.start_registration(
        db, full_name=payload.full_name, email=payload.email, password=payload.password,
        phone=payload.phone, client_ip=_client_ip(request))


# Legacy path kept for existing clients: it now only STARTS a registration (it never creates an account).
router.add_api_route("/register", register_start, methods=["POST"], response_model=RegistrationChallengeResponse,
                     status_code=status.HTTP_202_ACCEPTED, responses=REGISTRATION_ERRORS, include_in_schema=False)


@router.post("/register/verify", response_model=RegistrationCompletedResponse, status_code=status.HTTP_201_CREATED,
             responses={400: {"model": ErrorResponse, "description": "OTP_INVALID (remaining_attempts)"},
                        423: {"model": ErrorResponse, "description": "OTP_CHALLENGE_BLOCKED"}, **REGISTRATION_ERRORS})
def register_verify(payload: RegistrationVerifyRequest, request: Request, db: Session = Depends(get_db)):
    """Check the code; on success create the active, e-mail-verified candidate account (role: candidate)."""
    from app.services import registration_service
    return registration_service.verify_otp(db, payload.challenge_id, payload.otp, _client_ip(request))


@router.post("/register/resend-otp", response_model=RegistrationChallengeResponse, status_code=status.HTTP_202_ACCEPTED,
             responses=REGISTRATION_ERRORS)
def register_resend_otp(payload: RegistrationResendRequest, request: Request, db: Session = Depends(get_db)):
    """Issue a NEW challenge (new id, new code, fresh attempt counter); the previous one is invalidated."""
    from app.services import registration_service
    return registration_service.resend_otp(db, payload.challenge_id, _client_ip(request))


@router.get("/register/challenge-status", response_model=RegistrationChallengeResponse, responses=REGISTRATION_ERRORS)
def register_challenge_status(challenge_id: str = Query(..., min_length=20, max_length=64), db: Session = Depends(get_db)):
    """Server-side state of a challenge, so a reloaded page shows the real lockout / remaining attempts."""
    from app.services import registration_service
    return registration_service.challenge_status(db, challenge_id)


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
    # S1-01 AC3: throttling is tied to the browser session (HttpOnly cookie), never to the account,
    # so a new browser / incognito window can still sign in while this one is locked.
    client_id, _ = login_guard.client_id_from(request.cookies.get(login_guard.CLIENT_COOKIE))
    resp = _login(user_in, request, db, client_id)
    resp.set_cookie(
        key=login_guard.CLIENT_COOKIE,
        value=client_id,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
        max_age=login_guard.CLIENT_COOKIE_MAX_AGE,
    )
    return resp


def _locked_response(remaining_secs: int) -> JSONResponse:
    remaining_mins = max(1, (remaining_secs + 59) // 60)
    msg = (
        f"Phiên đăng nhập trên trình duyệt này đang bị tạm khóa {login_guard.LOCK_MINUTES} phút do nhập sai "
        f"{login_guard.MAX_FAILURES}/{login_guard.MAX_FAILURES} lần liên tiếp. "
        f"Tài khoản của bạn không bị khóa; bạn có thể thử lại sau {remaining_mins} phút hoặc đăng nhập từ thiết bị khác."
    )
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        headers={"Retry-After": str(remaining_secs)},
        content={
            "detail": msg,
            "error": {
                "code": "LOGIN_SESSION_LOCKED",
                "message": msg,
                "remaining_seconds": remaining_secs,
                "failed_count": login_guard.MAX_FAILURES,
                "max_failures": login_guard.MAX_FAILURES,
            },
            "remaining_seconds": remaining_secs,
            "failed_count": login_guard.MAX_FAILURES,
            "max_failures": login_guard.MAX_FAILURES,
        },
    )


def _login(user_in: UserLogin, request: Request, db: Session, client_id: str) -> JSONResponse:
    now = datetime.utcnow()
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Locked browser session: refuse before checking the password (even a correct one).
    remaining = login_guard.locked_for(db, client_id, client_ip, user_in.email, now)
    if remaining:
        return _locked_response(remaining)

    user = db.query(User).filter(User.email == user_in.email).first()
    # S1-01 AC2: same response (and comparable bcrypt cost) whether or not the email exists.
    password_ok = verify_password(user_in.password, user.hashed_password if user else _DUMMY_PASSWORD_HASH) and user is not None

    if not password_ok:
        # Unknown e-mails count as failures too, so a lock never reveals whether an account exists.
        just_locked, failed_count, remaining_secs = login_guard.register_failure(db, client_id, client_ip, user_in.email, now)
        if just_locked:
            try:
                from app.models.audit import AuditLog
                db.add(AuditLog(
                    actor_id=user.id if user else None,
                    actor_email=user_in.email,
                    action="LOGIN_SESSION_THROTTLED",
                    target_entity="AUTH",
                    target_id=str(user.id) if user else None,
                    ip_address=client_ip,
                    payload_json=f"Trình duyệt bị tạm khóa đăng nhập {login_guard.LOCK_MINUTES} phút sau {failed_count}/{login_guard.MAX_FAILURES} lần sai liên tiếp (tài khoản không bị khóa)",
                ))
                db.commit()
            except Exception:
                db.rollback()
            return _locked_response(remaining_secs)

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": f"Tài khoản hoặc mật khẩu không chính xác. Bạn đã nhập sai {failed_count}/{login_guard.MAX_FAILURES} lần. Nếu nhập sai {login_guard.MAX_FAILURES} lần liên tiếp sẽ bị tạm khóa {login_guard.LOCK_MINUTES} phút.",
                # "field_errors": {
                #     "password": f"Tài khoản hoặc mật khẩu không chính xác (Đã sai {failed_count}/{login_guard.MAX_FAILURES} lần)."
                # }
            }
        )

    # Check account active & status (admin lock is the only account-level lock)
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

    login_guard.register_success(db, client_id, client_ip, user_in.email)
    # Legacy per-account counters are no longer used for throttling; clear any old values.
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
    # Absolute session lifetime: refreshing never extends it.
    session_exp = now + min(timedelta(hours=settings.SESSION_ABSOLUTE_TIMEOUT_HOURS),
                            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))

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
    from app.services.rbac_service import get_user_roles, get_effective_permissions, landing_path
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["permissions"] = get_effective_permissions(db, user)
    user_dict["redirect_url"] = landing_path(db, user)
    from app.services.rbac_service import landing_path
    redirect_path = landing_path(db, user)

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
        secure=settings.is_production,
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )
    _set_route_cookie(resp, access_token)

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
            (AuthSession.refresh_token_hash == incoming_hash) | (AuthSession.previous_refresh_token_hash == incoming_hash)
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

    # 5. ROTATE the refresh token IN PLACE (same server-side session, same absolute expiry).
    # Compare-and-set on the current hash: of two concurrent refreshes with the same token only one wins.
    new_refresh_token = generate_refresh_token()
    rotated = db.query(AuthSession).filter(
        AuthSession.id == auth_session.id,
        AuthSession.refresh_token_hash == incoming_hash,
        AuthSession.revoked_at.is_(None),
    ).update(
        {
            AuthSession.refresh_token_hash: hash_token(new_refresh_token),
            AuthSession.previous_refresh_token_hash: incoming_hash,
            AuthSession.refresh_rotated_at: now,
            AuthSession.last_active_at: now,
            AuthSession.ip_address: request.client.host if request.client else auth_session.ip_address,
        },
        synchronize_session=False,
    )
    if rotated != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "REFRESH_IN_PROGRESS", "message": "Phiên đang được làm mới ở một tab khác. Vui lòng thử lại."}
        )
    db.commit()

    # 6. Issue new Access Token bound to the SAME session
    new_access_token = create_access_token(
        subject=user.id,
        session_id=auth_session.id,
        security_version=user.security_version
    )

    user_dict = user.to_dict()
    from app.services.rbac_service import get_user_roles, get_effective_permissions, landing_path
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["permissions"] = get_effective_permissions(db, user)
    user_dict["redirect_url"] = landing_path(db, user)

    resp = JSONResponse(content={
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "redirect_url": landing_path(db, user),
        "user": user_dict
    })
    resp.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )
    _set_route_cookie(resp, new_access_token)
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
    resp.delete_cookie("refresh_token", path="/api/v1/auth")
    _clear_route_cookie(resp)
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
    resp.delete_cookie("refresh_token", path="/api/v1/auth")
    _clear_route_cookie(resp)
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



# Password reset (OTP) endpoints — restored after accidental removal in 4f30af6 (S1-03).
@router.post(
    "/password-reset/request",
    response_model=PasswordResetInitResponse,
    status_code=status.HTTP_202_ACCEPTED
)
def request_password_reset(
    payload: PasswordResetInitRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    return PasswordResetService.request_reset(db=db, email=payload.email, client_ip=client_ip)

@router.post(
    "/password-reset/verify",
    response_model=PasswordResetVerifyResponse,
    status_code=status.HTTP_200_OK
)
def verify_password_reset_otp(
    payload: PasswordResetVerifyRequest,
    db: Session = Depends(get_db)
):
    return PasswordResetService.verify_otp_and_reset_password(
        db=db,
        reset_session_id=payload.reset_session_id,
        otp=payload.otp
    )

@router.post(
    "/password-reset/resend",
    response_model=PasswordResetResendResponse,
    status_code=status.HTTP_200_OK
)
def resend_password_reset_otp(
    payload: PasswordResetResendRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    return PasswordResetService.resend_otp(
        db=db,
        reset_session_id=payload.reset_session_id,
        client_ip=client_ip
    )

# Legacy backwards-compatibility alias for /forgot-password
@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED
)
def forgot_password_legacy(
    req: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    return PasswordResetService.request_reset(db=db, email=req.email, client_ip=client_ip)


def require_admin(authorization: Optional[str], db: Session) -> User:
    """Legacy helper kept for existing routers; delegates to the shared session-validating guard."""
    return require_roles(authorization, db, {"admin"})

def require_roles(authorization: Optional[str], db: Session, allowed_roles: set[str]) -> User:
    """Authenticates via authenticate_bearer (JWT + server-side session + status + security version)
    and then checks the user's DB-assigned roles. Admin has full access."""
    user, _ = authenticate_bearer(authorization, db)

    from app.services.rbac_service import get_user_roles
    roles = set([r["code"] for r in get_user_roles(db, user)])
    if "admin" in roles:
        return user

    if not roles.intersection(allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "PERMISSION_DENIED", "message": "Bạn không có quyền thực hiện thao tác này."}
        )
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
    from app.services.rbac_service import get_user_roles, get_effective_permissions, landing_path
    user_dict["roles"] = get_user_roles(db, user)
    user_dict["permissions"] = get_effective_permissions(db, user)
    user_dict["redirect_url"] = landing_path(db, user)
    return user_dict

@router.get("/route-access")
def route_access(
    request: Request,
    required_all: Optional[str] = Query(None, alias="all"),
    required_any: Optional[str] = Query(None, alias="any"),
    workspace: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Authorization decision for one page navigation (used by the frontend proxy before rendering).

    401 → not authenticated / session revoked or expired (the page redirects to login).
    403 → authenticated but missing the route's required permissions (the page renders a real HTTP 403).
    The token comes from the Authorization header or the HttpOnly ``ats_access`` cookie.
    """
    from app.api.deps import authenticate_access_token
    from app.services import route_access as policy

    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    token = token or request.cookies.get(ROUTE_ACCESS_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"code": "NOT_AUTHENTICATED", "message": "Vui lòng đăng nhập để tiếp tục."})
    user, _session = authenticate_access_token(token, db, allow_expired_jwt=True)
    ws = workspace if workspace in policy.WORKSPACE_LABELS else None
    if not policy.decide(db, user, policy.parse_codes(required_all), policy.parse_codes(required_any)):
        import logging
        logging.getLogger("app.authz").info("route access denied user=%s workspace=%s", user.id, ws)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=policy.denial(ws))
    return {"allowed": True}


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
        # S2-03: only JPG/PNG ≤ 2MB — either an uploaded avatar file of this user or a validated data URL
        value = payload.avatar_url.strip()
        if value.startswith("data:"):
            from app.services.file_storage import decode_avatar_data_url
            decode_avatar_data_url(value)
        elif value:
            from app.models.master_data import StoredFile
            file_id = value.rstrip("/").split("/")[-1]
            if not value.startswith("/api/v1/files/") or not db.query(StoredFile.id).filter(
                    StoredFile.id == file_id, StoredFile.kind == "avatar", StoredFile.owner_id == user.id).first():
                raise HTTPException(status_code=422, detail="Ảnh đại diện phải là tệp JPG/PNG do bạn tải lên.")
        user.avatar_url = value or None
    if payload.date_of_birth is not None:
        user.date_of_birth = payload.date_of_birth
    elif payload.dob is not None:
        user.date_of_birth = payload.dob
    if payload.gender is not None:
        user.gender = payload.gender
    if payload.job_title is not None:
        user.job_title = payload.job_title
    # S2-02 AC2: email, department and roles are managed by administrators, never self-edited.
    # (payload.department is accepted for backward compatibility but ignored.)
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


