import bcrypt
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

def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def generate_secure_otp() -> str:
    """Tạo mã OTP 6 chữ số bằng cryptographically secure random generator (secrets)."""
    import secrets
    return f"{secrets.randbelow(1000000):06d}"

def hash_otp(otp_code: str) -> str:
    """Tạo HMAC/SHA256 hash an toàn cho OTP kết hợp server SECRET_KEY (không lưu plaintext)."""
    import hmac
    import hashlib
    key = settings.SECRET_KEY.encode('utf-8')
    msg = otp_code.strip().encode('utf-8')
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def verify_otp_hash(otp_code: str, otp_hash: str) -> bool:
    """Xác thực mã OTP nhập vào với hash lưu trong CSDL."""
    import hmac
    expected_hash = hash_otp(otp_code)
    return hmac.compare_digest(expected_hash, otp_hash)

def create_password_reset_token(user_id: int, expire_minutes: int = 10) -> str:
    """Tạo short-lived JWT authorization token cho bước đặt lại mật khẩu mới."""
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "type": "password_reset"
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_password_reset_token(token: str) -> Optional[int]:
    """Giải mã và xác thực token đặt lại mật khẩu."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        sub = payload.get("sub")
        return int(sub) if sub else None
    except Exception:
        return None
