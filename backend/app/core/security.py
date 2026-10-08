import bcrypt
import hashlib
import hmac
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt, JWTError
from app.core.config import settings

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None, token_version: int = 1) -> str:
    import uuid
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "purpose": "access", "ver": token_version, "jti": str(uuid.uuid4())}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str, db: Optional[Any] = None) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("purpose") != "access":
            return None
        if db is not None:
            from app.models.user import RevokedToken, User
            if db.query(RevokedToken).filter(RevokedToken.token == token).first():
                return None
            subject = payload.get("sub")
            try:
                user = db.query(User).filter(User.id == int(subject)).first()
            except (TypeError, ValueError):
                return None
            if not user or not user.is_active or payload.get("ver") != (user.token_version or 1):
                return None
        return payload.get("sub")
    except JWTError:
        return None

def revoke_token(token: str, db: Any) -> bool:
    try:
        from app.models.user import RevokedToken
        if not db.query(RevokedToken).filter(RevokedToken.token == token).first():
            db.add(RevokedToken(token=token))
            db.commit()
        return True
    except Exception:
        db.rollback()
        return False

def is_token_revoked(token: str, db: Any) -> bool:
    try:
        from app.models.user import RevokedToken
        return db.query(RevokedToken).filter(RevokedToken.token == token).first() is not None
    except Exception:
        return False

# =========================================================================
# OTP & PASSWORD RESET CRYPTOGRAPHIC HELPERS
# =========================================================================

def generate_secure_otp() -> str:
    """Generates a 6-digit cryptographically secure random numeric OTP string."""
    number = secrets.randbelow(900000) + 100000
    return str(number)

def hash_otp(otp: str) -> str:
    """Calculates an HMAC-SHA256 digest for an OTP string using system SECRET_KEY."""
    return hmac.new(settings.SECRET_KEY.encode('utf-8'), otp.strip().encode('utf-8'), hashlib.sha256).hexdigest()

def verify_otp_digest(otp: str, otp_digest: Optional[str]) -> bool:
    """Performs constant-time HMAC digest comparison for OTP verification."""
    if not otp or not otp_digest:
        return False
    computed = hash_otp(otp)
    return hmac.compare_digest(computed, otp_digest)

def email_fingerprint(email: str) -> str:
    """Calculates an HMAC-SHA256 fingerprint of normalized email address for privacy-preserving rate limiting."""
    normalized = email.strip().lower()
    return hmac.new(settings.SECRET_KEY.encode('utf-8'), normalized.encode('utf-8'), hashlib.sha256).hexdigest()

def mask_email(email: str) -> str:
    """Masks an email for user interface display without leaking full email identity (e.g., n***@gmail.com)."""
    if "@" not in email:
        return "***"
    username, domain = email.split("@", 1)
    if len(username) <= 1:
        masked_user = username + "***"
    elif len(username) == 2:
        masked_user = username[0] + "***"
    else:
        masked_user = username[0] + "***" + username[-1]
    return f"{masked_user}@{domain}"

def generate_secure_random_password(length: int = 16) -> str:
    """Generates a cryptographically secure random password meeting strict complexity rules."""
    length = max(length, 14)
    upper = string.ascii_uppercase
    lower = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*"

    # Ensure at least 2 characters from each character class
    password = [
        secrets.choice(upper),
        secrets.choice(upper),
        secrets.choice(lower),
        secrets.choice(lower),
        secrets.choice(digits),
        secrets.choice(digits),
        secrets.choice(special),
        secrets.choice(special),
    ]

    all_chars = upper + lower + digits + special
    for _ in range(length - len(password)):
        password.append(secrets.choice(all_chars))

    # Shuffle using Fisher-Yates cryptographically secure shuffle
    for i in range(len(password) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        password[i], password[j] = password[j], password[i]

    return "".join(password)
