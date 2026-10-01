from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="employee", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    account_status = Column(String(20), default="active", nullable=False)
    lock_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "roles": [role for role in self.role.split(",") if role],
            "is_active": self.is_active,
            "account_status": self.account_status,
            "lock_reason": self.lock_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
