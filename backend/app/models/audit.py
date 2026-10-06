from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_name = Column(String(255), nullable=False)
    actor_email = Column(String(255), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    target = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True, default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "actor_name": self.actor_name,
            "actor_email": self.actor_email,
            "action": self.action,
            "target": self.target or "",
            "details": self.details or "",
            "ip_address": self.ip_address or "127.0.0.1",
            "created_at": self.created_at.strftime("%d/%m/%Y %H:%M:%S") if self.created_at else None,
        }
