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
    avatar_url = Column(String(4000000), nullable=True)
    employee_code = Column(String(50), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def get_redirect_url(self) -> str:
        normalized = (self.role or "").lower().strip()
        if "admin" in normalized:
            return "/admin"
        elif "hr_manager" in normalized or "hr" in normalized:
            return "/hr"
        elif "recruiter" in normalized:
            return "/recruiter"
        elif "hiring_manager" in normalized or "manager" in normalized or "department_manager" in normalized:
            return "/manager"
        elif "interviewer" in normalized:
            return "/interviewer"
        elif "approver" in normalized:
            return "/approver"
        return "/jobs"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "employee_code": self.employee_code,
            "role": self.role,
            "roles": [role.strip() for role in (self.role or "").split(",") if role.strip()],
            "redirect_url": self.get_redirect_url(),
            "is_active": self.is_active,
            "account_status": self.account_status,
            "lock_reason": self.lock_reason,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

