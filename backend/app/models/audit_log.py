from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    user_name = Column(String(255), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(String(1000), nullable=True)
    ip_address = Column(String(100), default="127.0.0.1", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_email": self.user_email or "Hệ thống",
            "user_name": self.user_name or "System Administrator",
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.strftime("%H:%M:%S - %d/%m/%Y") if self.created_at else ""
        }
