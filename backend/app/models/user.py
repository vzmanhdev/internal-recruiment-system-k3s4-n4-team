from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="candidate", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    account_status = Column(String(20), default="active", nullable=False)
    lock_reason = Column(String(500), nullable=True)
    avatar_url = Column(String(4000000), nullable=True)
    employee_code = Column(String(50), unique=True, nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    job_title = Column(String(255), nullable=True)
    department = Column(String(255), default="Nhân sự", nullable=True)
    bio = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    # Security & Audit Fields
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    security_version = Column(Integer, default=1, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    # Set when the user proved ownership of the e-mail address (candidate self-registration OTP).
    email_verified_at = Column(DateTime, nullable=True)
    version = Column(Integer, default=1, nullable=False) # Optimistic Locking

    auth_sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")

    def get_redirect_url(self) -> str:
        normalized = (self.role or "").lower().strip()
        if "admin" in normalized:
            return "/admin"
        roles_list = [r.strip() for r in normalized.split(",") if r.strip()]
        if len(roles_list) > 1:
            return "/workspace"
        if "hr_manager" in normalized or "hr" in normalized:
            return "/workspace"
        elif "recruiter" in normalized:
            return "/workspace"
        elif "hiring_manager" in normalized or "manager" in normalized:
            return "/workspace"
        elif "interviewer" in normalized or "approver" in normalized:
            return "/workspace"
        return "/jobs"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "employee_code": self.employee_code,
            "date_of_birth": self.date_of_birth,
            "dob": self.date_of_birth,
            "gender": self.gender or "Nam",
            "job_title": self.job_title or ("Quản trị hệ thống" if "admin" in (self.role or "").lower() else "Nhân viên"),
            "department": self.department or "Nhân sự",
            "bio": self.bio or "",
            "role": self.role,
            "roles": [role.strip() for role in (self.role or "").split(",") if role.strip()],
            "redirect_url": self.get_redirect_url(),
            "is_active": self.is_active,
            "account_status": self.account_status,
            "lock_reason": self.lock_reason,
            "avatar_url": self.avatar_url,
            "security_version": self.security_version,
            "email_verified": self.email_verified_at is not None,
            "email_verified_at": self.email_verified_at.isoformat() if self.email_verified_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }



