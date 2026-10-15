from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_email = Column(String(255), index=True, nullable=False)
    action = Column(String(100), index=True, nullable=False)
    target_entity = Column(String(100), nullable=True)
    target_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "actor_email": self.actor_email,
            "action": self.action,
            "target_entity": self.target_entity,
            "target_id": self.target_id,
            "ip_address": self.ip_address,
            "payload_json": self.payload_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    module = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "module": self.module,
            "description": self.description,
        }

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_code = Column(String(50), nullable=False, index=True)
    permission_code = Column(String(100), nullable=False, index=True)
    is_granted = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "role_code": self.role_code,
            "permission_code": self.permission_code,
            "is_granted": self.is_granted,
        }
