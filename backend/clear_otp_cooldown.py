from app.db.session import SessionLocal
from app.models.password_reset_otp import PasswordResetOTP
from app.models.user import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "manhhhbg2006@gmail.com").first()
    if user:
        deleted = db.query(PasswordResetOTP).filter(PasswordResetOTP.user_id == user.id).delete()
        db.commit()
        print(f"Cleared {deleted} OTP records for manhhhbg2006@gmail.com")
    else:
        print("User manhhhbg2006@gmail.com not found")
finally:
    db.close()
