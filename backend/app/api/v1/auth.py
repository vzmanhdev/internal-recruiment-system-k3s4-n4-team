import base64
import re
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.services.email_service import EmailService
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, create_access_token, decode_access_token,
    generate_secure_otp, hash_otp, verify_otp_hash,
    create_password_reset_token, decode_password_reset_token
)
from app.schemas.auth import (
    UserRegister, UserLogin, ForgotPasswordRequest, Token, UserResponse,
    ErrorResponse, BulkImportRequest, ProfileUpdateRequest, ChangePasswordRequest,
    PasswordResetVerify, PasswordResetConfirm
)

router = APIRouter()

@router.post("/password-reset/request")
@router.post("/forgot-password")
def request_password_reset(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Bước 1: Tiếp nhận yêu cầu đặt lại mật khẩu và gửi OTP qua Gmail SMTP.
    Áp dụng Email Enumeration Security: Trả về generic success message để ngăn chặn dò tìm email.
    """
    clean_email = req.email.strip().lower()
    
    # Query user bằng SQLAlchemy ORM
    user = db.query(User).filter(User.email == clean_email).first()
    
    generic_success_msg = {
        "message": "Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến."
    }

    if not user:
        # Nếu email không tồn tại trong DB -> Không tạo OTP, không gửi email, trả về generic success
        return generic_success_msg

    # Kiểm tra Resend Cooldown (60 giây)
    now = datetime.utcnow()
    latest_otp = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.user_id == user.id)
        .order_by(PasswordResetOTP.id.desc())
        .first()
    )

    if latest_otp and latest_otp.created_at:
        seconds_since_last = (now - latest_otp.created_at).total_seconds()
        cooldown_limit = settings.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
        if seconds_since_last < cooldown_limit:
            wait_seconds = int(cooldown_limit - seconds_since_last) + 1
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Bạn thao tác quá nhanh. Vui lòng đợi {wait_seconds} giây trước khi yêu cầu mã OTP mới.",
                    "field_errors": {
                        "email": f"Vui lòng đợi {wait_seconds}s trước khi gửi lại."
                    }
                }
            )

    # Vô hiệu hóa tất cả các OTP cũ chưa dùng của user
    active_otps = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used_at == None,
            PasswordResetOTP.invalidated_at == None
        )
        .all()
    )
    for old_otp in active_otps:
        old_otp.invalidated_at = now

    # Tạo mã OTP 6 chữ số ngẫu nhiên an toàn bằng secrets
    otp_code = generate_secure_otp()
    otp_hashed = hash_otp(otp_code)
    expire_minutes = settings.PASSWORD_RESET_OTP_EXPIRE_MINUTES
    expires_at = now + timedelta(minutes=expire_minutes)

    # Lưu bản ghi PasswordResetOTP
    otp_record = PasswordResetOTP(
        user_id=user.id,
        email=clean_email,
        otp_hash=otp_hashed,
        expires_at=expires_at,
        attempt_count=0,
        max_attempts=settings.PASSWORD_RESET_MAX_ATTEMPTS,
        created_at=now
    )
    db.add(otp_record)

    # Gửi Email qua Gmail SMTP
    try:
        EmailService.send_otp_email(clean_email, otp_code, expire_minutes=expire_minutes)
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Hiện không thể gửi email xác thực. Vui lòng thử lại sau ít phút.",
                "field_errors": {
                    "email": "Không thể gửi email OTP qua máy chủ SMTP."
                }
            }
        )

    # Ghi nhật ký bảo mật
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        action="Yêu cầu OTP đặt lại mật khẩu",
        details=f"Tài khoản {user.email} đã yêu cầu mã OTP khôi phục mật khẩu."
    )
    db.add(log_entry)
    db.commit()

    return generic_success_msg

@router.post("/password-reset/verify")
def verify_password_reset_otp(req: PasswordResetVerify, db: Session = Depends(get_db)):
    """
    Bước 2: Xác nhận mã OTP 6 chữ số do người dùng nhập vào.
    Nếu hợp lệ -> Phát hành reset_token thời hạn ngắn (10 phút).
    """
    clean_email = req.email.strip().lower()
    otp_input = req.otp.strip()

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.",
                "field_errors": {
                    "otp": "Mã OTP không hợp lệ."
                }
            }
        )

    now = datetime.utcnow()
    otp_record = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used_at == None,
            PasswordResetOTP.invalidated_at == None
        )
        .order_by(PasswordResetOTP.id.desc())
        .first()
    )

    if not otp_record or otp_record.is_expired or otp_record.attempt_count >= otp_record.max_attempts:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Mã OTP đã hết hạn, bị vô hiệu hóa hoặc quá số lần thử cho phép. Vui lòng gửi yêu cầu mã mới.",
                "field_errors": {
                    "otp": "Mã OTP đã hết hạn hoặc quá số lần thử."
                }
            }
        )

    # Verify OTP hash
    if not verify_otp_hash(otp_input, otp_record.otp_hash):
        otp_record.attempt_count += 1
        if otp_record.attempt_count >= otp_record.max_attempts:
            otp_record.invalidated_at = now
            
        db.commit()

        # Audit log thất bại
        from app.models.audit_log import AuditLog
        log_entry = AuditLog(
            user_id=user.id,
            user_email=user.email,
            user_name=user.full_name,
            action="Xác thực OTP thất bại",
            details=f"Tài khoản {user.email} nhập sai mã OTP ({otp_record.attempt_count}/{otp_record.max_attempts})."
        )
        db.add(log_entry)
        db.commit()

        attempts_left = max(0, otp_record.max_attempts - otp_record.attempt_count)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": f"Mã OTP không chính xác. Bạn còn {attempts_left} lần thử.",
                "field_errors": {
                    "otp": f"Mã OTP không chính xác. Còn {attempts_left} lần thử."
                }
            }
        )

    # OTP hợp lệ -> Tạo reset_token thời hạn 10 phút
    reset_token = create_password_reset_token(user.id, expire_minutes=10)

    # Audit log thành công
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        action="Xác thực OTP thành công",
        details=f"Tài khoản {user.email} đã xác thực mã OTP khôi phục mật khẩu thành công."
    )
    db.add(log_entry)
    db.commit()

    return {
        "message": "Xác thực mã OTP thành công!",
        "reset_token": reset_token
    }

@router.post("/password-reset/confirm")
def confirm_password_reset(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Bước 3: Đặt mật khẩu mới bằng reset_token đã cấp và cập nhật CSDL.
    """
    user_id = decode_password_reset_token(req.reset_token)
    if not user_id:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu.",
                "field_errors": {
                    "reset_token": "Phiên làm việc hết hạn."
                }
            }
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "detail": "Không tìm thấy tài khoản người dùng tương ứng.",
                "field_errors": {
                    "user": "Tài khoản không tồn tại."
                }
            }
        )

    np = req.new_password
    if req.confirm_password and req.confirm_password != np:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Mật khẩu mới và xác nhận mật khẩu không trùng khớp.",
                "field_errors": {
                    "confirm_password": "Xác nhận mật khẩu không trùng khớp."
                }
            }
        )

    # Check Password Policy
    if len(np) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 8 ký tự.")
    if not any(c.isupper() for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa.")
    if not any(c.islower() for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 chữ cái viết thường.")
    if not any(c.isdigit() for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 chữ số.")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt.")

    email_name = user.email.split("@")[0].lower()
    if np.lower() == email_name:
        raise HTTPException(status_code=400, detail="Mật khẩu mới không được trùng với tên email cá nhân.")

    if verify_password(np, user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu mới không được trùng với mật khẩu hiện tại.")

    now = datetime.utcnow()
    
    # Cập nhật hashed_password mới vào DATABASE
    user.hashed_password = hash_password(np)
    user.password_changed_at = now
    user.updated_at = now
    user.failed_login_attempts = 0
    user.locked_until = None
    if user.account_status == "locked":
        user.account_status = "active"

    # Vô hiệu hóa OTP record đã dùng
    otp_record = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used_at == None
        )
        .order_by(PasswordResetOTP.id.desc())
        .first()
    )
    if otp_record:
        otp_record.used_at = now

    # Ghi nhật ký hệ thống
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        action="Đặt lại mật khẩu qua OTP",
        details=f"Tài khoản {user.email} đã đặt lại mật khẩu mới thành công qua xác thực OTP."
    )
    db.add(log_entry)
    db.commit()

    return {
        "message": "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới."
    }

def generate_random_employee_code(db: Session) -> str:
    """Sinh ngẫu nhiên mã nhân viên NVxxxxx chưa tồn tại trong CSDL."""
    import secrets
    while True:
        code = f"NV{secrets.randbelow(90000) + 10000}"
        if not db.query(User).filter(User.employee_code == code).first():
            return code

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Lỗi dữ liệu đầu vào hoặc Email đã tồn tại"},
        422: {"model": ErrorResponse, "description": "Sai định dạng dữ liệu"}
    }
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
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

    # Nếu người dùng tự đăng ký không có employee_code -> tự động tạo ngẫu nhiên mã NVxxxxx
    emp_code = user_in.employee_code.strip().upper() if user_in.employee_code and user_in.employee_code.strip() else generate_random_employee_code(db)

    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        email=clean_email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        phone=user_in.phone,
        employee_code=emp_code,
        role=user_in.role or "employee",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user.to_dict()
    }

def get_current_user_from_header(authorization: Optional[str], db: Session) -> User:
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
            detail="Không tìm thấy thông tin người dùng trong CSDL"
        )
    return user

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user_from_header(authorization, db)

    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác. Vui lòng thử lại."
        )

    if payload.confirm_password and payload.confirm_password != payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới và xác nhận mật khẩu không trùng khớp."
        )

    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới không được trùng với mật khẩu hiện tại."
        )

    # Password Policy Validation
    np = payload.new_password
    if len(np) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 8 ký tự.")
    if not any(c.isupper() for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa.")
    if not any(c.islower() for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 chữ cái viết thường.")
    if not any(c.isdigit() for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 chữ số.")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in np):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt.")
    
    email_name = user.email.split("@")[0].lower()
    if np.lower() == email_name:
        raise HTTPException(status_code=400, detail="Mật khẩu không được trùng với tên email cá nhân.")

    now = datetime.utcnow()
    user.hashed_password = hash_password(np)
    user.password_changed_at = now
    user.updated_at = now
    db.commit()
    db.refresh(user)

    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        action="Đổi mật khẩu tài khoản",
        details=f"Tài khoản {user.email} đã đổi mật khẩu thành công."
    )
    db.add(log_entry)
    db.commit()

    return {"message": "Đổi mật khẩu thành công!", "user": user.to_dict()}

@router.post(
    "/login",
    response_model=Token,
    responses={
        400: {"model": ErrorResponse, "description": "Email không tồn tại hoặc sai mật khẩu"}
    }
)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()

    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
                "field_errors": {
                    "email": "Tài khoản Email không tồn tại trong hệ thống."
                }
            }
        )

    if not user.is_active or user.account_status in ["inactive", "disabled"]:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.",
                "field_errors": {
                    "email": "Tài khoản bị vô hiệu hóa."
                }
            }
        )

    now = datetime.utcnow()
    if user.locked_until:
        if user.locked_until > now:
            minutes_left = int((user.locked_until - now).total_seconds() // 60) + 1
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "detail": f"Tài khoản bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau {minutes_left} phút.",
                    "field_errors": {
                        "password": "Tài khoản bị tạm khóa."
                    }
                }
            )
        else:
            user.locked_until = None
            user.account_status = "active"
            user.failed_login_attempts = 0

    if not verify_password(user_in.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.account_status = "locked"
            user.locked_until = now + timedelta(minutes=15)
            db.commit()
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "detail": "Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản đã bị tạm khóa trong 15 phút.",
                    "field_errors": {
                        "password": "Tài khoản đã bị tạm khóa 15 phút."
                    }
                }
            )
        db.commit()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": f"Mật khẩu không chính xác. Vui lòng thử lại. (Cảnh báo: Lần thứ {user.failed_login_attempts}/5)",
                "field_errors": {
                    "password": "Mật khẩu không chính xác."
                }
            }
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    user.account_status = "active"
    user.last_login_at = now
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@router.post(
    "/forgot-password",
    responses={
        400: {"model": ErrorResponse, "description": "Email không tồn tại trong hệ thống"}
    }
)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Nếu email tồn tại trong hệ thống, liên kết khôi phục đã được gửi. Vui lòng kiểm tra hộp thư.",
                "field_errors": {
                    "email": "Email không tồn tại trong hệ thống."
                }
            }
        )

    return {
        "message": f"Hướng dẫn khôi phục mật khẩu đã được gửi đến email {req.email}. Vui lòng kiểm tra hộp thư đến."
    }

@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Chưa xác thực hoặc Token hết hạn"}
    }
)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_current_user_from_header(authorization, db)
    return user.to_dict()

@router.put("/me")
@router.patch("/me")
def update_profile(
    payload: ProfileUpdateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user_from_header(authorization, db)

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone.strip()
    if payload.position_title is not None:
        user.position_title = payload.position_title.strip()
    if payload.bio is not None:
        user.bio = payload.bio.strip()

    if payload.avatar_base64 is not None:
        raw_b64 = payload.avatar_base64.strip()
        if raw_b64:
            if "," in raw_b64:
                header, b64_str = raw_b64.split(",", 1)
                valid_mime = any(fmt in header.lower() for fmt in ["image/jpeg", "image/png", "image/webp", "image/jpg"])
                if not valid_mime:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP."
                    )
            else:
                b64_str = raw_b64

            try:
                decoded_bytes = base64.b64decode(b64_str)
                if len(decoded_bytes) > 2 * 1024 * 1024:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Kích thước ảnh đại diện vượt quá giới hạn 2MB."
                    )
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Dữ liệu Base64 ảnh đại diện không hợp lệ."
                )

            user.avatar_base64 = raw_b64

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        action="Cập nhật thông tin cá nhân",
        details=f"Tài khoản {user.email} đã cập nhật hồ sơ cá nhân / ảnh đại diện."
    )
    db.add(log_entry)
    db.commit()

    return user.to_dict()


@router.post(
    "/import-users",
    response_model=dict,
    status_code=status.HTTP_201_CREATED
)
def import_users(payload: BulkImportRequest, db: Session = Depends(get_db)):
    imported_users = []
    skipped_emails = []

    for u_item in payload.users:
        clean_email = u_item.email.strip().lower()
        existing = db.query(User).filter(User.email == clean_email).first()
        if existing:
            skipped_emails.append(clean_email)
            continue

        raw_password = u_item.password or "company123"
        new_user = User(
            email=clean_email,
            full_name=u_item.full_name,
            hashed_password=hash_password(raw_password),
            phone=u_item.phone,
            role=u_item.role or "employee",
            position_title=u_item.position_title,
            department_id=u_item.department_id,
            is_active=True
        )
        db.add(new_user)
        imported_users.append(new_user)

    db.commit()
    for u in imported_users:
        db.refresh(u)

    # Log audit event for bulk import
    if len(imported_users) > 0:
        from app.models.audit_log import AuditLog
        log_entry = AuditLog(
            user_email="admin@company.com",
            user_name="Admin System",
            action="Nhập danh sách từ Excel/CSV",
            details=f"Đã nhập thành công {len(imported_users)} tài khoản nhân sự mới vào hệ thống."
        )
        db.add(log_entry)
        db.commit()

    return {
        "message": f"Đã nhập thành công {len(imported_users)} tài khoản.",
        "imported_count": len(imported_users),
        "skipped_count": len(skipped_emails),
        "skipped_emails": skipped_emails,
        "imported_users": [u.to_dict() for u in imported_users]
    }

# --- ADMIN DATABASE USER MANAGEMENT & AUDIT LOG ENDPOINTS ---

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả tài khoản thực tế từ Database."""
    users = db.query(User).order_by(User.id.desc()).all()
    return [u.to_dict() for u in users]

@router.post("/create-user", status_code=status.HTTP_201_CREATED)
def create_user_by_admin(payload: dict, db: Session = Depends(get_db)):
    """Admin tạo tài khoản người dùng mới trực tiếp vào Database."""
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email không được để trống")
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã tồn tại trên hệ thống")

    raw_password = payload.get("password") or "company123"
    new_user = User(
        email=email,
        full_name=payload.get("name") or payload.get("full_name") or "Người dùng mới",
        hashed_password=hash_password(raw_password),
        phone=payload.get("phone") or "0912345678",
        role=payload.get("role") or "employee",
        department_id=payload.get("department_id") or "dept-1",
        position_title=payload.get("position_title") or payload.get("role") or "Nhân viên",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Ghi nhật ký thao tác
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_email="admin@company.com",
        user_name="Admin System",
        action="Tạo tài khoản mới",
        details=f"Tạo thành công tài khoản cho {new_user.full_name} ({new_user.email}) với vai trò {new_user.role}."
    )
    db.add(log_entry)
    db.commit()

    return new_user.to_dict()

@router.put("/users/{user_id}/status")
def toggle_user_status(user_id: int, payload: dict, db: Session = Depends(get_db)):
    """Khóa hoặc Mở khóa tài khoản người dùng trong Database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng")

    new_status = payload.get("is_active")
    if new_status is None:
        new_status = not user.is_active

    user.is_active = new_status
    db.commit()

    status_str = "Mở khóa" if user.is_active else "Khóa"
    
    # Ghi nhật ký thao tác
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_email="admin@company.com",
        user_name="Admin System",
        action="Thay đổi trạng thái tài khoản",
        details=f"Đã {status_str} tài khoản {user.full_name} ({user.email})."
    )
    db.add(log_entry)
    db.commit()

    return {"message": f"Đã {status_str} tài khoản thành công", "user": user.to_dict()}

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, payload: dict, db: Session = Depends(get_db)):
    """Cập nhật vai trò/phân quyền của người dùng trong Database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng")

    new_role = payload.get("role")
    if not new_role:
        raise HTTPException(status_code=400, detail="Thiếu thông tin vai trò mới")

    old_role = user.role
    user.role = new_role
    db.commit()

    # Ghi nhật ký thao tác
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_email="admin@company.com",
        user_name="Admin System",
        action="Cập nhật phân quyền / vai trò",
        details=f"Cập nhật vai trò của {user.email} từ '{old_role}' thành '{new_role}'."
    )
    db.add(log_entry)
    db.commit()

    return {"message": "Cập nhật vai trò thành công", "user": user.to_dict()}

@router.post("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, db: Session = Depends(get_db)):
    """Khôi phục mật khẩu tài khoản về company123 trong Database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng")

    user.hashed_password = hash_password("company123")
    db.commit()

    # Ghi nhật ký thao tác
    from app.models.audit_log import AuditLog
    log_entry = AuditLog(
        user_email="admin@company.com",
        user_name="Admin System",
        action="Khôi phục mật khẩu",
        details=f"Đã khôi phục mật khẩu tài khoản {user.email} về mặc định (company123)."
    )
    db.add(log_entry)
    db.commit()

    return {"message": f"Mật khẩu của {user.email} đã được khôi phục về company123"}

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    """Lấy danh sách nhật ký hệ thống thực tế từ Database."""
    from app.models.audit_log import AuditLog
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).all()
    return [l.to_dict() for l in logs]


