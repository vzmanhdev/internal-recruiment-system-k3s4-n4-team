"""Send interview invitations only when Recruiter explicitly requests it."""
from email.message import EmailMessage
import smtplib

from app.core.config import settings


def send_interview_invitation(recipient: str, title: str, response_url: str) -> bool:
    password = settings.SMTP_APP_PASSWORD or settings.SMTP_PASSWORD
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not password:
        return False
    message = EmailMessage()
    message['Subject'] = f'Mời phỏng vấn: {title}'
    message['From'] = settings.SMTP_USERNAME
    message['To'] = recipient
    message.set_content(
        f'Bạn được mời tham dự {title}.\n\n'
        f'Mở liên kết để xem thời gian, xác nhận tham dự hoặc đề nghị đổi lịch:\n{response_url}\n\n'
        'Liên kết có hiệu lực 14 ngày. Vui lòng không chia sẻ liên kết này.'
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USERNAME, password)
        server.send_message(message)
    return True
