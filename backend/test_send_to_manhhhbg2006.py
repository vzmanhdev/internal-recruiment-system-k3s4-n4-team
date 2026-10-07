import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import Settings
from app.services.email_service import EmailService
from app.db.session import SessionLocal
from app.models.user import User

# Load settings from .env
settings = Settings()

print("==================================================")
print("SENDING LIVE OTP EMAIL TO: manhhhbg2006@gmail.com")
print("==================================================")
print(f"SMTP Username: {settings.SMTP_USERNAME}")
print(f"SMTP From Email: {settings.SMTP_FROM_EMAIL}")

target_email = "manhhhbg2006@gmail.com"

# 1. Direct test via EmailService
print(f"\n1. Direct EmailService dispatch to {target_email}...")
otp_code = "684920"
try:
    EmailService.send_otp_email(target_email, otp_code, expire_minutes=5)
    print(f"[SUCCESS] Email OTP '{otp_code}' successfully sent via Gmail SMTP to {target_email}!")
except Exception as e:
    print(f"[ERROR] Failed to send email: {e}")

# 2. Register/Ensure manhhhbg2006@gmail.com exists in DB for web testing
db = SessionLocal()
try:
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        from app.core.security import hash_password
        user = User(
            email=target_email,
            full_name="Mạnh Dev",
            hashed_password=hash_password("company123"),
            role="employee",
            employee_code="NV99999",
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"\n2. [DB CREATED] Created user '{target_email}' in DB so web /forgot-password page can trigger real OTPs!")
    else:
        print(f"\n2. [DB EXISTS] User '{target_email}' already exists in DB.")
finally:
    db.close()

print("\n==================================================")
print("COMPLETED LIVE EMAIL DISPATCH TEST!")
print("==================================================")
