import smtplib
import logging
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("email_service")

def _send_smtp_email_worker(to_email: str, subject: str, html_body: str) -> bool:
    """Synchronous worker that performs the actual SMTP network handshake."""
    if not settings.SMTP_USERNAME or not settings.SMTP_APP_PASSWORD:
        logger.warning(
            f"[SMTP DEV MODE] SMTP credentials not configured in .env. Email to {to_email} skipped. Subject: {subject}"
        )
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USERNAME}>"
    msg["To"] = to_email

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if settings.SMTP_STARTTLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=8)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=8)

        server.login(settings.SMTP_USERNAME, settings.SMTP_APP_PASSWORD)
        server.sendmail(settings.SMTP_USERNAME, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {to_email} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")
        return False

def send_smtp_email(to_email: str, subject: str, html_body: str) -> bool:
    """Dispatches SMTP email in a background daemon thread so HTTP response never hangs."""
    thread = threading.Thread(
        target=_send_smtp_email_worker,
        args=(to_email, subject, html_body),
        daemon=True
    )
    thread.start()
    return True

def send_otp_email(to_email: str, otp_code: str, expires_in_minutes: int = 10) -> bool:
    """Sends 6-digit OTP verification code email non-blockingly and logs to terminal."""
    log_msg = f"[DEV OTP CODE] EMAIL: {to_email} | OTP: {otp_code}"
    print(f"\n==================================================", flush=True)
    print(log_msg, flush=True)
    print(f"==================================================\n", flush=True)
    logger.info(log_msg)

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
    return send_smtp_email(to_email, subject, html_content)

def send_new_password_email(to_email: str, new_password: str) -> bool:
    """Sends new temporary password email non-blockingly and logs to terminal."""
    log_msg = f"[DEV NEW PASSWORD] EMAIL: {to_email} | PASS: {new_password}"
    print(f"\n==================================================", flush=True)
    print(log_msg, flush=True)
    print(f"==================================================\n", flush=True)
    logger.info(log_msg)

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
    return send_smtp_email(to_email, subject, html_content)
