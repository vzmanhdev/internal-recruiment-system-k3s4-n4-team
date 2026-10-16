from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, text

from app.db.session import Base


class RegistrationChallenge(Base):
    """Pending public candidate registration + its e-mail OTP challenge (purpose ``candidate_registration``).

    No user row exists until the OTP is verified: the challenge holds the registration data and only a
    bcrypt hash of the password. The OTP itself is stored as an HMAC digest and wiped once the challenge
    leaves the ``pending`` state. Each resend creates a NEW row and supersedes the previous one, so a
    blocked challenge stays blocked forever.

    status: pending → consumed (account created) | blocked (5 wrong codes) | expired | superseded
            (a newer code was issued) | cancelled (e-mail could not be delivered / e-mail already taken)
    """
    __tablename__ = "registration_challenges"

    id = Column(String(64), primary_key=True)  # secrets.token_urlsafe(32): the client's only handle on it
    purpose = Column(String(40), nullable=False, default="candidate_registration")
    email = Column(String(255), nullable=False)  # normalised (lower-case)
    email_fingerprint = Column(String(64), nullable=False, index=True)  # HMAC of the e-mail, for rate limits
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)  # bcrypt, never the raw password
    otp_digest = Column(String(255), nullable=True)  # HMAC-SHA256 of the OTP, NULL once not pending
    status = Column(String(20), nullable=False, default="pending")
    failed_attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    client_ip = Column(String(50), nullable=True)
    previous_challenge_id = Column(String(64), nullable=True)
    resend_available_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    blocked_at = Column(DateTime, nullable=True)
    consumed_at = Column(DateTime, nullable=True)
    invalidated_at = Column(DateTime, nullable=True)  # superseded / expired / cancelled
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        Index("idx_reg_challenge_ip_created", "client_ip", "created_at"),
        Index("idx_reg_challenge_fp_created", "email_fingerprint", "created_at"),
        # At most one live challenge per e-mail address (enforced by the database, not only by code).
        Index("uix_reg_challenge_one_pending", "email_fingerprint", unique=True,
              sqlite_where=text("status = 'pending'"), postgresql_where=text("status = 'pending'")),
    )
