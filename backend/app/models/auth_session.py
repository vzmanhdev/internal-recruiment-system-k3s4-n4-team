import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    refresh_token_hash = Column(String(255), nullable=False)
    refresh_family_id = Column(String(36), nullable=False, default=lambda: str(uuid.uuid4()), index=True)

    device_name = Column(String(255), nullable=True)
    browser = Column(String(255), nullable=True)
    os = Column(String(255), nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)

    revoked_at = Column(DateTime, nullable=True, index=True)
    revoke_reason = Column(String(255), nullable=True)

    refresh_rotated_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="auth_sessions")

    def is_valid(self, idle_timeout_minutes: int = 60) -> bool:
        now = datetime.utcnow()
        if self.revoked_at is not None:
            return False
        if self.expires_at <= now:
            return False
        if idle_timeout_minutes > 0:
            idle_seconds = (now - self.last_active_at).total_seconds()
            if idle_seconds > idle_timeout_minutes * 60:
                return False
        return True

    def to_dict(self, current_session_id: str = None):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "device_name": self.device_name or "Thiết bị chưa xác định",
            "browser": self.browser or "Trình duyệt chưa xác định",
            "os": self.os or "Hệ điều hành chưa xác định",
            "ip_address": self.ip_address or "127.0.0.1",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_active_at": self.last_active_at.isoformat() if self.last_active_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_revoked": self.revoked_at is not None,
            "revoke_reason": self.revoke_reason,
            "current": self.id == current_session_id
        }
