from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
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
        400: {"model": ErrorResponse, "description": "Email không tồn tại hoặc sai mật khẩu"}
    }
)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    # Find user by email from Database
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài khoản Email Không Chính Xác.",
                "field_errors": {
                    "email": "Tài khoản Email không tồn tại trong hệ thống."
                }
            }
        )

    # Verify password
    if not verify_password(user_in.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài Khoản hoặc Mật khẩu không chính xác. Vui lòng thử lại.",
                "field_errors": {
                    "password": "Tài Khoản hoặc Mật khẩu không chính xác."
                }
            }
        )

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

    # Generate JWT token with Subject (User ID)
    access_token = create_access_token(subject=user.id)
    
    # DB-driven single source of truth for user role & workspace redirect
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

    user_id = decode_access_token(authorization.split(" ", 1)[1])
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
    db.commit()
    return {"success": True, "message": "Đổi mật khẩu thành công."}

def require_admin(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập bằng tài khoản Quản trị viên")
    user_id = decode_access_token(authorization.split(" ", 1)[1])
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    admin = db.query(User).filter(User.id == int(user_id)).first()
    roles = set([r.strip() for r in (admin.role or "").split(",") if r.strip()]) if admin else set()
    if not admin or "admin" not in roles or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản trị viên mới có quyền thực hiện thao tác này")
    return admin

def require_roles(authorization: Optional[str], db: Session, allowed_roles: set[str]) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập để tiếp tục")
    user_id = decode_access_token(authorization.split(" ", 1)[1])
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản không hoạt động hoặc không tồn tại")
    
    roles = set([r.strip() for r in (user.role or "").split(",") if r.strip()])
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
    user_id_str = decode_access_token(token)
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
    user_id = decode_access_token(authorization.split(" ", 1)[1])
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
