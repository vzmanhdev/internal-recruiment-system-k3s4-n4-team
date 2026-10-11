import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    generate_secure_otp,
    hash_otp,
    verify_otp_digest,
    email_fingerprint,
    mask_email,
    generate_secure_random_password,
    hash_password
)
from app.models.user import User
from app.models.password_reset import PasswordResetSession
from app.services.email_service import send_otp_email, send_new_password_email

logger = logging.getLogger("password_reset_service")

class PasswordResetService:

    @staticmethod
    def request_reset(db: Session, email: str, client_ip: str = "127.0.0.1") -> Dict[str, Any]:
        """
        Processes initial password reset request.
        Implements strict Email Enumeration protection, rate limiting, and OTP digest generation.
        """
        normalized_email = email.strip().lower()
        fingerprint = email_fingerprint(normalized_email)
        now = datetime.utcnow()

        # 1. Rate Limiting Check by Email Fingerprint
        email_window_start = now - timedelta(seconds=settings.PASSWORD_RESET_EMAIL_WINDOW_SECONDS)
        email_req_count = db.query(PasswordResetSession).filter(
            PasswordResetSession.email_fingerprint == fingerprint,
            PasswordResetSession.created_at >= email_window_start
        ).count()

        if email_req_count >= settings.PASSWORD_RESET_EMAIL_LIMIT:
            logger.warning(f"Rate limit exceeded for email fingerprint: {fingerprint[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Bạn đã gửi quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút."
            )

        # 2. Rate Limiting Check by Client IP
        ip_window_start = now - timedelta(seconds=settings.PASSWORD_RESET_IP_WINDOW_SECONDS)
        ip_req_count = db.query(PasswordResetSession).filter(
            PasswordResetSession.client_ip == client_ip,
            PasswordResetSession.created_at >= ip_window_start
        ).count()

        if ip_req_count >= settings.PASSWORD_RESET_IP_LIMIT:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Địa chỉ IP của bạn đã tạo quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."
            )

        # 3. Lookup real user
        # S1-03 AC3: an unknown email gets exactly the same response; a decoy session (user_id=None) is
        # created and no email is sent, so the reset flow cannot be used to enumerate accounts.
        user = db.query(User).filter(User.email == normalized_email).first()

        # 4. Generate Cryptographic OTP
        otp_code = generate_secure_otp()
        otp_digest_hash = hash_otp(otp_code)

        otp_expires_at = now + timedelta(seconds=settings.PASSWORD_RESET_OTP_TTL_SECONDS)
        resend_available_at = now + timedelta(seconds=settings.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS)

        # 5. Create PasswordResetSession record
        session = PasswordResetSession(
            user_id=user.id if user else None,
            email_fingerprint=fingerprint,
            otp_digest=otp_digest_hash,
            otp_expires_at=otp_expires_at,
            resend_available_at=resend_available_at,
            attempts_used=0,
            send_count=1,
            status="pending",
            client_ip=client_ip,
            created_at=now,
            updated_at=now
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # 6. Send OTP Email only if user exists
        if user:
            send_otp_email(
                to_email=user.email,
                otp_code=otp_code,
                expires_in_minutes=int(settings.PASSWORD_RESET_OTP_TTL_SECONDS / 60)
            )

        masked = mask_email(normalized_email)
        return {
            "message": "Nếu email này tồn tại trong hệ thống, mã xác thực sẽ được gửi đến email.",
            "reset_session_id": session.id,
            "masked_email": masked,
            "expires_in_seconds": settings.PASSWORD_RESET_OTP_TTL_SECONDS,
            "resend_cooldown_seconds": settings.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
        }

    @staticmethod
    def verify_otp_and_reset_password(db: Session, reset_session_id: str, otp: str) -> Dict[str, Any]:
        """
        Verifies OTP against session digest, increments attempts, locks on 5th error,
        and atomically generates new password, hashes it with Bcrypt, updates database,
        invalidates session & old password, and emails new temporary password.
        """
        # Fetch session
        session = db.query(PasswordResetSession).filter(
            PasswordResetSession.id == reset_session_id
        ).with_for_update().first() if db.bind.name != "sqlite" else db.query(PasswordResetSession).filter(
            PasswordResetSession.id == reset_session_id
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phiên xác thực không tồn tại hoặc đã hết hạn."
            )

        now = datetime.utcnow()

        # Check Session Status Constraints
        if session.status == "used":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP này đã được sử dụng. Vui lòng yêu cầu mã mới."
            )

        if session.status == "locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phiên xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới."
            )

        if session.status == "expired" or (session.otp_expires_at and session.otp_expires_at < now):
            session.status = "expired"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP đã hết hạn. Vui lòng nhấn 'Gửi lại mã' để nhận mã mới."
            )

        if session.attempts_used >= settings.PASSWORD_RESET_MAX_ATTEMPTS:
            session.status = "locked"
            session.locked_at = now
            session.otp_digest = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phiên xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới."
            )

        # Constant-Time OTP Digest Comparison
        is_correct = verify_otp_digest(otp, session.otp_digest)

        if not is_correct:
            session.attempts_used += 1
            remaining = settings.PASSWORD_RESET_MAX_ATTEMPTS - session.attempts_used

            if session.attempts_used >= settings.PASSWORD_RESET_MAX_ATTEMPTS:
                session.status = "locked"
                session.locked_at = now
                session.otp_digest = None # Invalidate digest immediately
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phiên xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới."
                )

            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã OTP không chính xác. Bạn còn {remaining} lần thử."
            )

        # Correct OTP! Proceed with Atomic Password Reset Execution
        user = db.query(User).filter(User.id == session.user_id).first() if session.user_id else None

        if not user:
            # Dummy session execution (anti-enumeration)
            session.status = "used"
            session.used_at = now
            session.otp_digest = None
            db.commit()
            return {
                "message": "Nếu tài khoản hợp lệ, mật khẩu mới đã được gửi đến email của bạn.",
                "success": True,
                "masked_email": "***@company.com"
            }

        # 1. Generate Secure Random Password (16 characters)
        new_password = generate_secure_random_password(length=settings.PASSWORD_RESET_PASSWORD_LENGTH)

        # 2. Hash password with Bcrypt
        new_hashed_pwd = hash_password(new_password)

        # 3. Update User Password & Session Status atomically inside Transaction
        try:
            user.hashed_password = new_hashed_pwd
            session.status = "used"
            session.used_at = now
            session.otp_digest = None # Wipe digest after single use

            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to commit password reset transaction for user {user.id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Lỗi hệ thống khi cập nhật mật khẩu mới. Vui lòng thử lại sau."
            )

        # 4. Send Email with New Temporary Password to User
        send_new_password_email(user.email, new_password)

        return {
            "message": "Đặt lại mật khẩu thành công. Mật khẩu mới đã được gửi đến email của bạn.",
            "success": True,
            "masked_email": mask_email(user.email)
        }

    @staticmethod
    def resend_otp(db: Session, reset_session_id: str, client_ip: str = "127.0.0.1") -> Dict[str, Any]:
        """
        Resends a new 6-digit OTP code for an active password reset session.
        Invalidates previous OTP immediately and resets cooldown & expiry.
        """
        session = db.query(PasswordResetSession).filter(
            PasswordResetSession.id == reset_session_id
        ).first()

        if not session or session.status in ("used", "locked", "cancelled"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phiên xác thực không hợp lệ hoặc đã bị khóa. Vui lòng tạo yêu cầu mới."
            )

        now = datetime.utcnow()

        # Enforce Resend Cooldown
        if session.resend_available_at and now < session.resend_available_at:
            cooldown_left = int((session.resend_available_at - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vui lòng chờ {cooldown_left} giây trước khi yêu cầu gửi lại mã OTP."
            )

        # Enforce Max Sends Per Session
        if session.send_count >= settings.PASSWORD_RESET_MAX_SENDS_PER_SESSION:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Bạn đã đạt số lần gửi lại mã OTP tối đa cho phiên này. Vui lòng tạo yêu cầu mới."
            )

        # Generate NEW OTP & Immediately Invalidate Old OTP Digest
        new_otp_code = generate_secure_otp()
        session.otp_digest = hash_otp(new_otp_code)
        session.otp_expires_at = now + timedelta(seconds=settings.PASSWORD_RESET_OTP_TTL_SECONDS)
        session.resend_available_at = now + timedelta(seconds=settings.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS)
        session.send_count += 1
        session.status = "pending"
        session.updated_at = now

        db.commit()

        # Send new OTP email if real user attached
        if session.user_id:
            user = db.query(User).filter(User.id == session.user_id).first()
            if user:
                send_otp_email(
                    to_email=user.email,
                    otp_code=new_otp_code,
                    expires_in_minutes=int(settings.PASSWORD_RESET_OTP_TTL_SECONDS / 60)
                )

        return {
            "message": "Mã OTP mới đã được gửi đến email của bạn.",
            "reset_session_id": session.id,
            "resend_cooldown_seconds": settings.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
        }
