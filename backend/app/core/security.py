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

def create_access_token(
    subject: Any, 
    session_id: Optional[str] = None, 
    security_version: int = 1, 
    expires_delta: Optional[timedelta] = None
) -> str:
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "sid": str(session_id) if session_id else "",
        "typ": "access",
        "ver": int(security_version),
        "iat": int(now.timestamp()),
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str, verify_exp: bool = True) -> Optional[dict]:
    """Verify signature + type. ``verify_exp=False`` is only for route-access decisions, where the
    server-side session (revocation, absolute/idle expiry, security version) is the authority."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM],
                             options={"verify_exp": verify_exp})
        # Backwards compatibility check: support legacy tokens with purpose="access" or typ="access"
        token_typ = payload.get("typ") or payload.get("purpose")
        if token_typ != "access":
            return None
        return payload
    except JWTError:
        return None

def generate_refresh_token() -> str:
    """Generates a 64-character cryptographically secure random hex string for Refresh Token."""
    return secrets.token_hex(32)

def hash_token(token: str) -> str:
    """Calculates HMAC-SHA256 digest of refresh token for safe DB storage."""
    if not token:
        return ""
    return hmac.new(settings.SECRET_KEY.encode('utf-8'), token.strip().encode('utf-8'), hashlib.sha256).hexdigest()

def parse_user_agent(user_agent_str: Optional[str]) -> dict:
    """Simple User-Agent parser extracting device, browser, and OS names."""
    if not user_agent_str:
        return {
            "device_name": "Thiết bị không xác định",
            "browser": "Trình duyệt Web",
            "os": "Hệ điều hành Web"
        }
    
    ua = user_agent_str.lower()
    
    # Extract OS
    os_name = "Hệ điều hành Web"
    if "windows" in ua:
        os_name = "Windows PC"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS Mobile"
    elif "android" in ua:
        os_name = "Android Mobile"
    elif "linux" in ua:
        os_name = "Linux"

    # Extract Browser
    browser_name = "Trình duyệt Web"
    if "edg/" in ua or "edge/" in ua:
        browser_name = "Microsoft Edge"
    elif "chrome/" in ua and "safari/" in ua and "edg" not in ua:
        browser_name = "Google Chrome"
    elif "firefox/" in ua:
        browser_name = "Mozilla Firefox"
    elif "safari/" in ua and "chrome" not in ua:
        browser_name = "Apple Safari"
    elif "opera" in ua or "opr/" in ua:
        browser_name = "Opera"

    # Extract Device Name
    device = "Desktop PC"
    if "mobile" in ua or "iphone" in ua or "android" in ua:
        device = "Điện thoại Di động"
    elif "ipad" in ua or "tablet" in ua:
        device = "Máy tính bảng"

    return {
        "device_name": device,
        "browser": browser_name,
        "os": os_name
    }


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
