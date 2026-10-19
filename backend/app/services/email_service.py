import smtplib
import logging
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("email_service")

SENSITIVE_BODY_PLACEHOLDER = "[Nội dung bảo mật (OTP/mật khẩu) — không lưu vào nhật ký]"


def smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_APP_PASSWORD)


def _dev_console(message: str) -> None:
    """Echo a message that may contain a secret ONLY on a development machine without SMTP.

    Production/test logs never contain OTPs or passwords.
    """
    if settings.APP_ENV.strip().lower() == "development" and not smtp_configured():
        print(f"[DEV ONLY - SMTP not configured] {message}", flush=True)


def _mask(email: str) -> str:
    name, _, domain = (email or "").partition("@")
    return f"{name[:2]}***@{domain}" if domain else "***"


def _smtp_send(to_email: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    if settings.SMTP_STARTTLS:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=8)
        server.ehlo()
        server.starttls()
        server.ehlo()
    else:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=8)
    try:
        server.login(settings.SMTP_USERNAME, settings.SMTP_APP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME, [to_email], msg.as_string())
    finally:
        try:
            server.quit()
        except Exception:
            pass


def deliver_email_log(log_id: int, html_body: str, db=None) -> str:
    """Attempt delivery for an EmailLog row and record the REAL outcome: sent / failed / skipped."""
    from datetime import datetime
    from app.db.session import SessionLocal
    from app.models.email_automation import EmailLog

    owns_session = db is None
    db = db or SessionLocal()
    try:
        log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
        if not log:
            return "missing"
        log.status = "processing"
        db.commit()
        if not smtp_configured():
            log.status = "skipped"
            log.error_message = "SMTP chưa được cấu hình — email KHÔNG được gửi."
            logger.warning("email_log=%s to=%s skipped: SMTP not configured", log.id, _mask(log.recipient_email))
        else:
            try:
                _smtp_send(log.recipient_email, log.subject, html_body)
                log.status = "sent"
                log.error_message = None
                log.sent_at = datetime.utcnow()
                logger.info("email_log=%s to=%s sent", log.id, _mask(log.recipient_email))
            except Exception as exc:  # network/auth/SMTP errors
                log.status = "failed"
                log.error_message = f"{type(exc).__name__}: không gửi được email qua SMTP."
                logger.error("email_log=%s to=%s failed: %s", log.id, _mask(log.recipient_email), type(exc).__name__)
        db.commit()
        return log.status
    finally:
        if owns_session:
            db.close()


def send_smtp_email(to_email: str, subject: str, html_body: str, template_code: Optional[str] = None,
                    recipient_name: Optional[str] = None, sensitive: bool = False) -> Optional[int]:
    """Queue an email: persist an EmailLog (status=queued) then deliver it on a background thread.

    Returns the EmailLog id. The returned value only means "queued", never "sent".
    """
    from app.db.session import SessionLocal
    from app.models.email_automation import EmailLog

    db = SessionLocal()
    try:
        log = EmailLog(
            template_code=template_code,
            recipient_name=recipient_name or to_email,
            recipient_email=to_email,
            subject=subject,
            body_html=SENSITIVE_BODY_PLACEHOLDER if sensitive else html_body,
            status="queued",
        )
        db.add(log)
        db.commit()
        log_id = log.id
    except Exception:
        db.rollback()
        logger.exception("Could not persist email log for %s", _mask(to_email))
        return None
    finally:
        db.close()

    threading.Thread(target=deliver_email_log, args=(log_id, html_body), daemon=True).start()
    return log_id

def send_otp_email(to_email: str, otp_code: str, expires_in_minutes: int = 10) -> bool:
    """Sends 6-digit OTP verification code email non-blockingly and logs to terminal."""
    log_msg = f"[DEV OTP CODE] EMAIL: {to_email} | OTP: {otp_code}"
    _dev_console(log_msg)

    subject = f"[{otp_code}] Ma xac thuc dat lai mat khau - TUYEN DUNG NOI BO"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 28px; line-height: 1.5; }}
        .otp-box {{ background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 36px; font-weight: 800; color: #0369a1; letter-spacing: 10px; font-family: monospace; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
        .warning {{ color: #e11d48; font-weight: 600; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Xác Thực Quên Mật Khẩu</div>
        <div class="subtitle">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ứng dụng Tuyển Dụng Nội Bộ. Sử dụng mã OTP bên dưới để tiếp tục:</div>
        
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
        </div>

        <div class="subtitle" style="margin-bottom: 16px;">Mã OTP có hiệu lực trong <strong>{expires_in_minutes} phút</strong>.</div>

        <div class="notice">
          <p class="warning">⚠️ Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ Quản trị viên hệ thống để bảo vệ tài khoản.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content, template_code="PASSWORD_RESET_OTP", sensitive=True)

def send_new_password_email(to_email: str, new_password: str) -> bool:
    """Sends new temporary password email non-blockingly and logs to terminal."""
    log_msg = f"[DEV NEW PASSWORD] EMAIL: {to_email} | PASS: {new_password}"
    _dev_console(log_msg)

    subject = "Dat lai mat khau thanh cong - TUYEN DUNG NOI BO"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 28px; line-height: 1.5; }}
        .pass-box {{ background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
        .pass-text {{ font-size: 22px; font-weight: 700; color: #0f172a; font-family: monospace; letter-spacing: 2px; word-break: break-all; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
        .button {{ display: block; width: 100%; text-align: center; background: #0284c7; color: #ffffff !important; font-weight: 700; padding: 14px 0; border-radius: 10px; text-decoration: none; margin-top: 20px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Đặt Lại Mật Khẩu Thành Công</div>
        <div class="subtitle">Mật khẩu mới của bạn đã được khởi tạo thành công. Bạn có thể sử dụng mật khẩu tạm thời bên dưới để đăng nhập ngay:</div>
        
        <div class="pass-box">
          <div class="pass-text">{new_password}</div>
        </div>

        <div class="notice">
          <p>📌 <strong>Khuyên dùng:</strong> Sau khi đăng nhập bằng mật khẩu tạm thời này, vui lòng truy cập Trang quản lý hồ sơ cá nhân để đổi lại mật khẩu cá nhân của bạn.</p>
        </div>

        <a href="{settings.FRONTEND_URL}/login" class="button">Đăng Nhập Ngay</a>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content, template_code="PASSWORD_RESET_NEW_PASSWORD", sensitive=True)


def send_password_changed_notification(to_email: str) -> bool:
    """Sends a security alert email when a user's password has been updated."""
    log_msg = f"[SECURITY ALERT EMAIL] Password changed for: {to_email}"
    _dev_console(log_msg)

    subject = "Canh bao bao mat: Mat khau tai khoan da duoc thay doi - TUYEN DUNG NOI BO"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
        .warning {{ color: #e11d48; font-weight: 600; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Thông Báo Cập Nhật Mật Khẩu</div>
        <div class="subtitle">Mật khẩu tài khoản (<strong>{to_email}</strong>) vừa được thay đổi thành công vào thời điểm hiện tại.</div>
        
        <div class="notice">
          <p class="warning">⚠️ Nếu KHÔNG phải bạn thực hiện thay đổi này, vui lòng liên hệ ngay với Quản trị viên hệ thống (Admin) để khóa tài khoản và bảo vệ dữ liệu.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content)


def send_account_created_email(to_email: str, full_name: str, initial_password: str, roles_str: str) -> bool:
    """Sends welcome email with initial credentials to newly created user non-blockingly."""
    log_msg = f"[NEW USER ACCOUNT CREATED EMAIL] EMAIL: {to_email} | FULL_NAME: {full_name} | PASS: {initial_password}"
    _dev_console(log_msg)

    subject = "Thong bao khoi tao tai khoan nguoi dung - TUYEN DUNG NOI BO"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
        .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }}
        .info-row {{ margin-bottom: 8px; font-size: 13px; }}
        .info-label {{ color: #64748b; font-weight: 600; }}
        .info-value {{ color: #0f172a; font-weight: 700; word-break: break-all; }}
        .pass-box {{ background: #f0f9ff; border: 1.5px dashed #0284c7; border-radius: 10px; padding: 14px; text-align: center; margin-top: 14px; }}
        .pass-text {{ font-size: 20px; font-weight: 800; color: #0369a1; font-family: monospace; letter-spacing: 1.5px; word-break: break-all; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
        .button {{ display: block; width: 100%; text-align: center; background: #0284c7; color: #ffffff !important; font-weight: 700; padding: 14px 0; border-radius: 10px; text-decoration: none; margin-top: 20px; box-sizing: border-box; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Tài Khoản Mới Đã Được Khởi Tạo</div>
        <div class="subtitle">Xin chào <strong>{full_name}</strong>, Quản trị viên vừa khởi tạo tài khoản truy cập hệ thống Tuyển Dụng Nội Bộ cho bạn.</div>
        
        <div class="info-box">
          <div class="info-row"><span class="info-label">Họ và tên:</span> <span class="info-value">{full_name}</span></div>
          <div class="info-row"><span class="info-label">Email đăng nhập:</span> <span class="info-value">{to_email}</span></div>
          <div class="info-row"><span class="info-label">Vai trò hệ thống:</span> <span class="info-value">{roles_str}</span></div>
          
          <div class="pass-box">
            <div style="font-size: 11px; color: #0284c7; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Mật khẩu ban đầu của bạn</div>
            <div class="pass-text">{initial_password}</div>
          </div>
        </div>

        <div class="notice">
          <p>📌 <strong>Khuyên dùng:</strong> Vì mục đích an toàn thông tin, vui lòng đổi lại mật khẩu cá nhân ngay sau lần đăng nhập đầu tiên.</p>
        </div>

        <a href="{settings.FRONTEND_URL}/login" class="button">Đăng Nhập Ngay</a>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content, template_code="ACCOUNT_CREATED", recipient_name=full_name, sensitive=True)


def send_account_status_email(to_email: str, full_name: str, is_locked: bool, reason: Optional[str] = None) -> bool:
    """Sends email notification when a user's account is locked or unlocked by admin."""
    action_text = "Đã bị khóa" if is_locked else "Đã được mở khóa"
    subject_status = "KHOA TAI KHOAN" if is_locked else "MO KHOA TAI KHOAN"
    log_msg = f"[ACCOUNT STATUS EMAIL] EMAIL: {to_email} | LOCKED: {is_locked} | REASON: {reason}"
    _dev_console(log_msg)

    subject = f"Canh bao bao mat: Tai khoan {subject_status} - TUYEN DUNG NOI BO"
    status_badge_bg = "#fef2f2" if is_locked else "#f0fdf4"
    status_badge_border = "#fecaca" if is_locked else "#bbf7d0"
    status_badge_color = "#dc2626" if is_locked else "#16a34a"

    reason_html = f"""
    <div class="info-box" style="background: #fff1f2; border-color: #fecaca; margin-top: 16px;">
      <div style="font-size: 11px; color: #9f1239; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Lý do thực hiện</div>
      <div style="font-size: 13px; color: #881337; font-weight: 600;">{reason}</div>
    </div>
    """ if (is_locked and reason) else ""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
        .status-badge {{ background: {status_badge_bg}; border: 1px solid {status_badge_border}; color: {status_badge_color}; padding: 12px 20px; border-radius: 12px; text-align: center; font-weight: 800; font-size: 15px; margin-bottom: 20px; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Thông Báo Trạng Thái Tài Khoản</div>
        <div class="subtitle">Xin chào <strong>{full_name}</strong>, Quản trị viên vừa cập nhật trạng thái truy cập tài khoản của bạn.</div>
        
        <div class="status-badge">Trạng thái tài khoản: {action_text}</div>

        {reason_html}

        <div class="notice">
          <p>Nếu bạn có bất kỳ thắc mắc nào về thay đổi này, vui lòng liên hệ trực tiếp với Ban Quản Trị Hệ Thống (Admin).</p>
        </div>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content)


def send_roles_updated_email(to_email: str, full_name: str, new_roles_str: str) -> bool:
    """Sends email notification when a user's assigned roles/permissions are updated."""
    log_msg = f"[ROLES UPDATED EMAIL] EMAIL: {to_email} | ROLES: {new_roles_str}"
    _dev_console(log_msg)

    subject = "Cap nhat vai tro va quuyen han truy cap - TUYEN DUNG NOI BO"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
        .roles-box {{ background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px; }}
        .roles-text {{ font-size: 16px; font-weight: 800; color: #0284c7; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
        .button {{ display: block; width: 100%; text-align: center; background: #0284c7; color: #ffffff !important; font-weight: 700; padding: 14px 0; border-radius: 10px; text-decoration: none; margin-top: 20px; box-sizing: border-box; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Thay Đổi Vai Trò & Phân Quyền</div>
        <div class="subtitle">Xin chào <strong>{full_name}</strong>, Quản trị viên vừa cập nhật danh sách vai trò và quyền hạn làm việc của bạn trên hệ thống.</div>
        
        <div class="roles-box">
          <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Danh sách vai trò hiện tại</div>
          <div class="roles-text">{new_roles_str}</div>
        </div>

        <div class="notice">
          <p>Các quyền hạn mới sẽ có hiệu lực lập tức cho các thao tác làm việc tiếp theo của bạn.</p>
        </div>

        <a href="{settings.FRONTEND_URL}/login" class="button">Truy Cập Hệ Thống</a>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content)


def send_account_locked_temp_email(to_email: str, full_name: str, lock_minutes: int = 15) -> bool:
    """Sends email notification when account is temporarily locked due to 5 failed login attempts."""
    log_msg = f"[ACCOUNT TEMP LOCKED EMAIL] EMAIL: {to_email} | LOCK_MINUTES: {lock_minutes}"
    _dev_console(log_msg)

    subject = f"Canh bao bao mat: Tai khoan bi tam khoa {lock_minutes} phut - TUYEN DUNG NOI BO"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px; }}
        .subtitle {{ font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
        .status-badge {{ background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 20px; border-radius: 12px; text-align: center; font-weight: 800; font-size: 15px; margin-bottom: 20px; }}
        .notice {{ font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">TUYỂN DỤNG NỘI BỘ</div>
        <div class="title">Cảnh Báo Bảo Mật Đăng Nhập</div>
        <div class="subtitle">Xin chào <strong>{full_name}</strong>, hệ thống phát hiện <strong>5 lần đăng nhập không thành công liên tiếp</strong> vào tài khoản của bạn.</div>
        
        <div class="status-badge">Tài khoản tạm thời bị khóa trong {lock_minutes} phút</div>

        <div class="notice">
          <p>Vì lý do an toàn bảo mật, tính năng đăng nhập vào tài khoản của bạn sẽ bị tạm dừng trong {lock_minutes} phút. Nếu đây không phải là thao tác của bạn, vui lòng liên hệ Quản trị viên hệ thống ngay.</p>
        </div>
      </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, html_content)




REGISTRATION_OTP_SUBJECT = "Mã xác thực đăng ký tài khoản Tuyển dụng nội bộ"


def send_registration_otp_email(to_email: str, full_name: str, otp_code: str, expires_in_minutes: int = 10) -> str:
    """Deliver the candidate-registration OTP NOW (synchronously) and return the real outcome.

    Returns "sent", "skipped" (SMTP not configured), "failed" or "error" (log could not be written).
    The OTP is never written to logs, the console or the EmailLog body.
    """
    from app.db.session import SessionLocal
    from app.models.email_automation import EmailLog
    from html import escape

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
        <div style="font-size: 18px; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 24px; text-transform: uppercase;">TUYỂN DỤNG NỘI BỘ</div>
        <div style="font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 8px;">Xác Thực Đăng Ký Tài Khoản</div>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Xin chào <strong>{escape(full_name)}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Mã xác thực của bạn là:</p>
        <div style="background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
          <div style="font-size: 36px; font-weight: 800; color: #0369a1; letter-spacing: 10px; font-family: monospace;">{otp_code}</div>
        </div>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">Mã có hiệu lực trong <strong>{expires_in_minutes} phút</strong>. Không chia sẻ mã này với người khác.</p>
        <p style="font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này. Tài khoản chỉ được tạo sau khi mã được xác thực.</p>
      </div>
    </body>
    </html>
    """
    db = SessionLocal()
    try:
        log = EmailLog(template_code="CANDIDATE_REGISTRATION_OTP", recipient_name=full_name or to_email,
                       recipient_email=to_email, subject=REGISTRATION_OTP_SUBJECT,
                       body_html=SENSITIVE_BODY_PLACEHOLDER, status="queued")
        db.add(log)
        db.commit()
        log_id = log.id
    except Exception:
        db.rollback()
        logger.exception("Could not persist registration OTP email log for %s", _mask(to_email))
        return "error"
    finally:
        db.close()
    return deliver_email_log(log_id, html_content)
