from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True, index=True)
    actor = Column(String(255), nullable=False, default="Hệ thống")
    email = Column(String(255), nullable=False, default="system@local")
    action = Column(String(255), nullable=False)
    module = Column(String(100), nullable=False)
    ip_address = Column(String(64), nullable=False, default="unknown")
    status = Column(String(20), nullable=False, default="success")
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": f"LOG-{self.id:06d}",
            "actor": self.actor,
            "email": self.email,
            "action": self.action,
            "module": self.module,
            "ip_address": self.ip_address,
            "status": self.status,
            "timestamp": self.created_at.isoformat() if self.created_at else None,
            "details": self.details or "",
        }


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    company_name = Column(String(255), nullable=False, default="Internal Recruitment System")
    allow_registration = Column(Boolean, nullable=False, default=True)
    require_approval = Column(Boolean, nullable=False, default=True)
    email_notifications = Column(Boolean, nullable=False, default=True)
    session_timeout = Column(Integer, nullable=False, default=60)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "company_name": self.company_name,
            "allow_registration": self.allow_registration,
            "require_approval": self.require_approval,
            "email_notifications": self.email_notifications,
            "session_timeout": self.session_timeout,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
