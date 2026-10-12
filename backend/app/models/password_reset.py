import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base

class PasswordResetSession(Base):
    __tablename__ = "password_reset_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    email_fingerprint = Column(String(64), nullable=False, index=True) # HMAC-SHA256 of normalized email
    otp_digest = Column(String(255), nullable=True) # HMAC-SHA256 digest of 6-digit OTP, NEVER plaintext
    otp_expires_at = Column(DateTime, nullable=True)
    resend_available_at = Column(DateTime, nullable=True)
    attempts_used = Column(Integer, default=0, nullable=False)
    send_count = Column(Integer, default=1, nullable=False)
    status = Column(String(20), default="pending", nullable=False) # pending, used, locked, expired, cancelled
    client_ip = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    used_at = Column(DateTime, nullable=True)
    locked_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="password_reset_sessions")

    __table_args__ = (
        Index("idx_pwd_reset_fingerprint_status", "email_fingerprint", "status"),
        Index("idx_pwd_reset_ip_created", "client_ip", "created_at"),
    )
