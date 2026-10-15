from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.session import Base


class LoginAttemptGuard(Base):
    """Failed-login throttling per browser session (S1-01 AC3), not per account.

    key = "client:<hmac of the ats_login_client cookie>"  → 5 consecutive failures lock that browser for 15 min
    key = "ipmail:<hmac of ip|email>"                       → ceiling for clients that drop cookies
    A new browser (e.g. an incognito window) gets a new cookie and can still sign in; the account is never locked.
    """
    __tablename__ = "login_attempt_guards"

    id = Column(Integer, primary_key=True, index=True)
    guard_key = Column(String(128), unique=True, nullable=False, index=True)
    failed_count = Column(Integer, default=0, nullable=False)
    window_started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
