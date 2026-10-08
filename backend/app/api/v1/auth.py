from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token, revoke_token, is_token_revoked
from app.schemas.auth import (
    ChangePasswordRequest, ProfileUpdateRequest, RegistrationResponse, UserRegister, UserLogin,
    Token, UserResponse, ErrorResponse,
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
        400: {"model": ErrorResponse, "description": "Email hoặc mật khẩu không chính xác hoặc tài khoản bị khóa"}
    }
)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    # S1-01 AC: Sai thông tin hiển thị thông báo chung, không tiết lộ email có tồn tại hay không
    GENERIC_AUTH_ERROR = {
        "detail": "Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c. Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i.",
        "field_errors": {
            "email": "Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c.",
            "password": "Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c."
        }
    }

    user = db.query(User).filter(User.email == user_in.email.strip().lower()).first()

    # S1-01 AC: Kiểm tra nếu tài khoản đang bị tạm khóa 15 phút do 5 lần sai liên tiếp
    lockout_msg = {
        "detail": "Tài khoản đã bị tạm khóa 15 phút do nhập sai thông tin 5 lần liên tiếp. Vui lòng thử lại sau.",
        "field_errors": {
            "password": "Tài khoản bị tạm khóa 15 phút."
        }
    }
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        return JSONResponse(status_code=400, content=lockout_msg)
    if user and user.locked_until and user.locked_until <= datetime.utcnow():
        user.locked_until = None
        user.failed_login_attempts = 0

    # Nếu không tìm thấy người dùng hoặc mật khẩu sai
    if not user or not verify_password(user_in.password, user.hashed_password):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                # S1-01 AC: Khóa tạm 15 phút sau 5 lần sai liên tiếp
                user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                db.commit()
                return JSONResponse(status_code=400, content=lockout_msg)
            db.commit()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=GENERIC_AUTH_ERROR
        )

    # Kiểm tra trạng thái tài khoản bị khóa bởi quản trị viên hoặc chờ duyệt
    if not user.is_active:
        if user.account_status == "locked":
            message = "Tài khoản đã bị khóa bởi Quản trị viên. Lý do: " + (user.lock_reason or "Liên hệ Quản trị viên để được hỗ trợ.")
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

    if not user.is_active:
        return JSONResponse(status_code=400, content=GENERIC_AUTH_ERROR)

    # Generate JWT token with Subject (User ID)
    access_token = create_access_token(subject=user.id, token_version=user.token_version or 1)
    
    # S1-01 AC: Đăng nhập đúng thì vào được trang chủ tương ứng với vai trò
    user_dict = user.to_dict()
    redirect_path = user.get_redirect_url()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "redirect_url": redirect_path,
        "user": user_dict
    }

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

@router.post(
    "/change-password",
    responses={
        400: {"model": ErrorResponse, "description": "Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ"},
        401: {"model": ErrorResponse, "description": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"}
    }
)
def change_password(
    payload: ChangePasswordRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    token = authorization.split(" ", 1)[1]
    user_id = decode_access_token(token, db=db)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

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
    user.token_version = (user.token_version or 1) + 1
    db.commit()

    # S1-04 AC: Đổi xong thu hồi các phiên đăng nhập khác / thu hồi token hiện tại
    revoke_token(token, db)
    return {"success": True, "message": "Đổi mật khẩu thành công. Các phiên làm việc cũ đã được thu hồi bảo mật."}

# S1-02 AC: Đăng xuất làm mất hiệu lực phiên ngay lập tức phía server
@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    token = authorization.split(" ", 1)[1]
    user_id = decode_access_token(token, db=db)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    revoke_token(token, db)
    return {"message": "Đăng xuất thành công, phiên đăng nhập đã được hủy bỏ phía server."}

# S1-02 AC: Phiên được gia hạn tự động khi còn hoạt động
@router.post("/refresh-session")
def refresh_session(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    token = authorization.split(" ", 1)[1]
    user_id = decode_access_token(token, db=db)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản không hoạt động hoặc không tồn tại")

    new_token = create_access_token(subject=user.id, token_version=user.token_version or 1)
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "redirect_url": user.get_redirect_url(),
        "user": user.to_dict()
    }

def require_admin(authorization: Optional[str], db: Session) -> User:
    return require_roles(authorization, db, allowed_roles={"admin"})

# S1-05 AC: Mọi chức năng đều kiểm quyền ở tầng server, mặc định từ chối, thông báo tiếng Việt rõ ràng
def require_roles(authorization: Optional[str], db: Session, allowed_roles: set[str]) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c.")
    token = authorization.split(" ", 1)[1]
    user_id = decode_access_token(token, db=db)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phi\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n.")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="T\u00e0i kho\u1ea3n kh\u00f4ng ho\u1ea1t \u0111\u1ed9ng ho\u1eb7c kh\u00f4ng t\u1ed3n t\u1ea1i.")

    roles = {role.strip().lower() for role in (user.role or "").split(",") if role.strip()}
    normalized_allowed = {role.strip().lower() for role in allowed_roles if role.strip()}
    if not roles.intersection(normalized_allowed):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n th\u1ef1c hi\u1ec7n thao t\u00e1c n\u00e0y."
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
    user.is_active = False
    user.account_status = "locked"
    user.lock_reason = reason or "Bị khóa bởi Quản trị viên"
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
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header Authorization bị thiếu hoặc không đúng định dạng 'Bearer <token>'"
        )

    token = authorization.split(" ")[1]
    user_id_str = decode_access_token(token, db=db)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
        )

    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng"
        )

    return user.to_dict()

@router.put("/me", response_model=UserResponse)
def update_me(payload: ProfileUpdateRequest, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    user_id = decode_access_token(authorization.split(" ", 1)[1], db=db)
    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    
    if payload.full_name is not None and payload.full_name.strip():
        user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone.replace(" ", "") if payload.phone else None
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(user)
    return user.to_dict()
