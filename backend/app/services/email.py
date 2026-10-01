import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("uvicorn")


def send_password_reset_email(recipient: str, reset_url: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info("SMTP is not configured. Development reset URL: %s", reset_url)
        return False

    message = EmailMessage()
    message["Subject"] = "Đặt lại mật khẩu - Tuyển dụng nội bộ"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(
        "Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau trong vòng "
        f"{settings.PASSWORD_RESET_EXPIRE_MINUTES} phút:\n\n{reset_url}\n\n"
        "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)
    return True
