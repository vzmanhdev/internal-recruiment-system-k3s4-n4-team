from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.db.session import Base

ROLE_REDIRECT_MAP = {
    "recruiter": "/recruiter",
    "approver": "/approver",
    "employee": "/employee",
    "candidate": "/",
    "admin": "/admin",
    "hr_manager": "/hr-manager",
    "department_manager": "/manager",
    "hiring_manager": "/manager"
}

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    employee_code = Column(String(50), nullable=True)
    role = Column(String(50), default="employee", nullable=False)
    avatar_url = Column(String(500), nullable=True)
    avatar_base64 = Column(Text, nullable=True)
    bio = Column(String(1000), nullable=True)
    department_id = Column(String(100), nullable=True)
    position_title = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    account_status = Column(String(50), default="active", nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def redirect_route(self) -> str:
        return ROLE_REDIRECT_MAP.get(self.role, "/")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "employee_code": self.employee_code,
            "role": self.role,
            "redirect_route": self.redirect_route,
            "avatar_url": self.avatar_url,
            "avatar_base64": self.avatar_base64,
            "bio": self.bio,
            "department_id": self.department_id,
            "position_title": self.position_title,
            "is_active": self.is_active,
            "account_status": self.account_status,
            "failed_login_attempts": self.failed_login_attempts,
            "locked_until": self.locked_until.isoformat() if self.locked_until else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "password_changed_at": self.password_changed_at.isoformat() if self.password_changed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

