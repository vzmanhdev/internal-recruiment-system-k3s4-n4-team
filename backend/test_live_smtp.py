import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import Settings

# Force re-load settings from .env
settings = Settings()

print("==================================================")
print("TESTING LIVE GMAIL SMTP DISPATCH")
print("==================================================")
print(f"SMTP Username: {settings.SMTP_USERNAME}")
print(f"SMTP From: {settings.SMTP_FROM_EMAIL}")
print(f"SMTP Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")

to_email = settings.SMTP_USERNAME
subject = "[Tuyển Dụng Nội Bộ] Thử nghiệm gửi email OTP thực tế"
content = """
<!DOCTYPE html>
<html>
<body>
    <h2>Thử nghiệm gửi Email từ Hệ thống Tuyển Dụng Nội Bộ</h2>
    <p>Nếu bạn nhận được email này, cấu hình Gmail SMTP đã hoạt động 100% thành công!</p>
</body>
</html>
"""

msg = MIMEMultipart("alternative")
msg["Subject"] = subject
msg["From"] = f"Tuyển Dụng Nội Bộ <{settings.SMTP_FROM_EMAIL}>"
msg["To"] = to_email
msg.attach(MIMEText(content, "html", "utf-8"))

try:
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_APP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
    print("SUCCESS: Live email sent successfully to", to_email)
except Exception as e:
    print(f"ERROR: {type(e).__name__} - {e}")
