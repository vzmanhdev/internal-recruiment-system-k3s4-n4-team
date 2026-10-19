"""Browser-session login throttling (S1-01 AC3).

Five consecutive wrong passwords lock *the browser session that made them* for 15 minutes.
The account itself is never locked, so the same user can still sign in from another browser or an
incognito window. Failures for unknown e-mails count too, so a lock never reveals whether an account exists.
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.core.security import hash_token
from app.models.login_guard import LoginAttemptGuard

CLIENT_COOKIE = "ats_login_client"
CLIENT_COOKIE_MAX_AGE = 24 * 3600          # survives a browser restart within a day; incognito starts fresh
MAX_FAILURES = 5
LOCK_MINUTES = 15
# Fallback for clients that do not keep cookies (scripts): per IP + e-mail, generous enough for real users.
IPMAIL_MAX_FAILURES = 20


def client_id_from(cookie_value: Optional[str]) -> Tuple[str, bool]:
    """Return (client id, is_new). A missing/garbled cookie gets a fresh random id."""
    if cookie_value and 20 <= len(cookie_value) <= 128:
        return cookie_value, False
    return secrets.token_urlsafe(32), True


def _keys(client_id: str, ip: str, email: str) -> Tuple[str, str]:
    return f"client:{hash_token(client_id)}", f"ipmail:{hash_token(f'{ip}|{email.strip().lower()}')}"


def _row(db: Session, key: str) -> Optional[LoginAttemptGuard]:
    return db.query(LoginAttemptGuard).filter(LoginAttemptGuard.guard_key == key).first()


def locked_for(db: Session, client_id: str, ip: str, email: str, now: datetime) -> Optional[int]:
    """Seconds remaining if this browser session (or the IP+e-mail fallback) is locked, else None."""
    remaining = []
    for key in _keys(client_id, ip, email):
        row = _row(db, key)
        if row and row.locked_until and row.locked_until > now:
            remaining.append(int((row.locked_until - now).total_seconds()))
    return max(remaining) if remaining else None


def register_failure(db: Session, client_id: str, ip: str, email: str, now: datetime) -> Tuple[bool, int, int]:
    """Count one failed attempt; returns (locked_now, failed_count, remaining_secs)."""
    locked_now = False
    client_failed_count = 1
    remaining_secs = LOCK_MINUTES * 60

    client_key, ipmail_key = _keys(client_id, ip, email)
    for key, limit in zip((client_key, ipmail_key), (MAX_FAILURES, IPMAIL_MAX_FAILURES)):
        row = _row(db, key)
        if row is None:
            row = LoginAttemptGuard(guard_key=key, failed_count=0, window_started_at=now)
            db.add(row)
        elif (row.locked_until and row.locked_until <= now) or now - row.window_started_at > timedelta(minutes=LOCK_MINUTES):
            # previous lock or counting window is over -> start counting again
            row.failed_count, row.locked_until, row.window_started_at = 0, None, now
        row.failed_count += 1
        if key == client_key:
            client_failed_count = row.failed_count
        elif key == ipmail_key and row.failed_count > client_failed_count:
            # Fallback if cookies are missing/disabled
            client_failed_count = row.failed_count

        if row.failed_count >= limit:
            row.locked_until = now + timedelta(minutes=LOCK_MINUTES)
            locked_now = True
            remaining_secs = max(remaining_secs, int((row.locked_until - now).total_seconds()))

    db.commit()
    capped_count = min(client_failed_count, MAX_FAILURES)
    return locked_now, capped_count, remaining_secs


def register_success(db: Session, client_id: str, ip: str, email: str) -> None:
    """A successful sign-in clears the consecutive-failure counters of this browser session."""
    for key in _keys(client_id, ip, email):
        row = _row(db, key)
        if row is not None:
            db.delete(row)
    db.commit()
