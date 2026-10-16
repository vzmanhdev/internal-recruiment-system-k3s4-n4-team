"""Public candidate self-registration with e-mail OTP verification (purpose ``candidate_registration``).

Flow: start → (OTP e-mailed) → verify → account created as ``candidate`` and active.
No user row exists before the OTP is verified; there is no manual approval step.

Security rules enforced here (never by the frontend):
* the role is always ``PUBLIC_REGISTRATION_ROLE``; any client-supplied role is ignored;
* the OTP is random (``secrets``), stored only as an HMAC digest, never logged or returned;
* every change of the attempt counter / status is ONE conditional UPDATE, so concurrent requests
  cannot exceed ``max_attempts`` and a blocked, consumed or superseded challenge stays dead;
* a new code always means a new challenge row; the database allows one pending challenge per e-mail;
* issuance is limited per e-mail (cooldown, hourly, daily), per IP, and by wrong codes per day.
"""
import logging
import math
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy import case, func, null, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import email_fingerprint, generate_secure_otp, hash_otp, hash_password, mask_email, verify_otp_digest
from app.db.rbac_catalog import PUBLIC_REGISTRATION_ROLE, ROLES_DATA
from app.models.rbac import Role, UserRole
from app.models.registration import RegistrationChallenge as RC
from app.models.user import User

logger = logging.getLogger("registration_service")

PURPOSE = "candidate_registration"

BLOCKED_MESSAGE = ("Bạn đã nhập sai mã xác thực {n} lần. Mã OTP hiện tại đã bị vô hiệu hóa. "
                   "Vui lòng yêu cầu mã mới.")
EMAIL_TAKEN_MESSAGE = "Email này đã được đăng ký trên hệ thống. Vui lòng đăng nhập hoặc dùng chức năng Quên mật khẩu."


def _fail(http_status: int, code: str, message: str, headers: Optional[Dict[str, str]] = None, **extra: Any):
    raise HTTPException(status_code=http_status, detail={"code": code, "message": message, **extra}, headers=headers)


def _audit(db: Session, action: str, email: str, ip: Optional[str], note: str, user_id: Optional[int] = None) -> None:
    """Audit row without secrets (no OTP, no password, masked e-mail before the account exists)."""
    try:
        from app.models.audit import AuditLog
        db.add(AuditLog(actor_id=user_id, actor_email=email if user_id else mask_email(email), action=action,
                        target_entity="REGISTRATION", target_id=str(user_id) if user_id else None,
                        ip_address=ip, payload_json=note))
        db.commit()
    except Exception:
        db.rollback()


def _email_taken(db: Session, email: str) -> bool:
    return db.query(User.id).filter(func.lower(User.email) == email).first() is not None


def _check_domain(email: str) -> None:
    allowed = [d.strip().lower().lstrip("@") for d in settings.REGISTRATION_ALLOWED_EMAIL_DOMAINS.split(",") if d.strip()]
    if allowed and email.rsplit("@", 1)[-1] not in allowed:
        _fail(422, "EMAIL_DOMAIN_NOT_ALLOWED",
              "Chỉ chấp nhận đăng ký bằng email thuộc tên miền: " + ", ".join("@" + d for d in allowed) + ".")


def _remaining(ch: RC) -> int:
    return max(0, ch.max_attempts - ch.failed_attempts) if ch.status == "pending" else 0


def _raise_for_state(ch: RC) -> None:
    """Reject any request against a challenge that is no longer pending (even with a correct code)."""
    if ch.status == "blocked":
        _fail(status.HTTP_423_LOCKED, "OTP_CHALLENGE_BLOCKED", BLOCKED_MESSAGE.format(n=ch.max_attempts),
              remaining_attempts=0, challenge_status="blocked")
    if ch.status == "consumed":
        _fail(status.HTTP_409_CONFLICT, "OTP_ALREADY_USED",
              "Mã xác thực này đã được sử dụng và tài khoản đã được tạo. Vui lòng đăng nhập.",
              remaining_attempts=0, challenge_status="consumed")
    if ch.status == "superseded":
        _fail(status.HTTP_409_CONFLICT, "OTP_SUPERSEDED",
              "Mã xác thực này đã được thay thế bằng mã mới. Vui lòng dùng mã mới nhất trong email.",
              remaining_attempts=0, challenge_status="superseded")
    if ch.status == "expired":
        _fail(status.HTTP_410_GONE, "OTP_EXPIRED", "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.",
              remaining_attempts=0, challenge_status="expired")
    if ch.status != "pending":
        _fail(status.HTTP_410_GONE, "OTP_CHALLENGE_CANCELLED",
              "Yêu cầu xác thực không còn hiệu lực. Vui lòng yêu cầu mã mới.",
              remaining_attempts=0, challenge_status=ch.status)


def _load(db: Session, challenge_id: str, lock: bool = False) -> RC:
    query = db.query(RC).filter(RC.id == challenge_id, RC.purpose == PURPOSE)
    if lock and db.bind.dialect.name != "sqlite":
        query = query.with_for_update()  # PostgreSQL row lock; SQLite relies on the conditional UPDATEs below
    ch = query.first()
    if not ch:
        _fail(status.HTTP_404_NOT_FOUND, "OTP_CHALLENGE_NOT_FOUND",
              "Không tìm thấy yêu cầu xác thực. Vui lòng đăng ký lại.", challenge_status="not_found")
    return ch


def _expire_if_due(db: Session, ch: RC, now: datetime) -> RC:
    if ch.status == "pending" and ch.expires_at <= now:
        db.execute(update(RC).where(RC.id == ch.id, RC.status == "pending")
                   .values(status="expired", otp_digest=None, invalidated_at=now)
                   .execution_options(synchronize_session=False))
        db.commit()
        db.refresh(ch)
    return ch


def _public_state(ch: RC, now: datetime) -> Dict[str, Any]:
    return {
        "challenge_id": ch.id,
        "challenge_status": ch.status,
        "masked_email": mask_email(ch.email),
        "max_attempts": ch.max_attempts,
        "remaining_attempts": _remaining(ch),
        "expires_in_seconds": max(0, int((ch.expires_at - now).total_seconds())) if ch.status == "pending" else 0,
        # rounded UP so a client countdown never reaches 0 before the server accepts a resend
        "resend_available_in_seconds": max(0, math.ceil((ch.resend_available_at - now).total_seconds())),
        "can_resend": ch.status in ("pending", "blocked", "expired", "cancelled"),
    }


def _issue(db: Session, *, email: str, full_name: str, phone: Optional[str], password_hash: str,
           client_ip: str, previous_id: Optional[str] = None) -> Dict[str, Any]:
    """Create a fresh challenge (new id, new OTP, attempt counter 0) and deliver its code."""
    now = datetime.utcnow()
    fp = email_fingerprint(email)
    day_ago = now - timedelta(hours=24)

    failed_today = db.query(func.coalesce(func.sum(RC.failed_attempts), 0)).filter(
        RC.email_fingerprint == fp, RC.created_at >= day_ago).scalar() or 0
    if failed_today >= settings.REGISTRATION_EMAIL_DAILY_FAILED_LIMIT:
        _fail(status.HTTP_429_TOO_MANY_REQUESTS, "REGISTRATION_TEMPORARILY_BLOCKED",
              "Email này đã nhập sai mã xác thực quá nhiều lần trong 24 giờ qua. Vui lòng thử lại sau.")

    latest = db.query(RC).filter(RC.email_fingerprint == fp).order_by(RC.created_at.desc()).first()
    if latest and latest.resend_available_at > now:
        wait = max(1, math.ceil((latest.resend_available_at - now).total_seconds()))
        _fail(status.HTTP_429_TOO_MANY_REQUESTS, "OTP_RESEND_COOLDOWN",
              f"Vui lòng chờ {wait} giây trước khi yêu cầu mã mới.", headers={"Retry-After": str(wait)},
              retry_after_seconds=wait)

    def count_since(*conds) -> int:
        return db.query(func.count(RC.id)).filter(*conds).scalar() or 0

    if count_since(RC.email_fingerprint == fp,
                   RC.created_at >= now - timedelta(seconds=settings.REGISTRATION_EMAIL_WINDOW_SECONDS)) \
            >= settings.REGISTRATION_EMAIL_WINDOW_LIMIT \
            or count_since(RC.email_fingerprint == fp, RC.created_at >= day_ago) >= settings.REGISTRATION_EMAIL_DAILY_LIMIT:
        _fail(status.HTTP_429_TOO_MANY_REQUESTS, "REGISTRATION_RATE_LIMITED",
              "Bạn đã yêu cầu quá nhiều mã xác thực cho email này. Vui lòng thử lại sau.")
    if count_since(RC.client_ip == client_ip,
                   RC.created_at >= now - timedelta(seconds=settings.REGISTRATION_IP_WINDOW_SECONDS)) \
            >= settings.REGISTRATION_IP_WINDOW_LIMIT:
        _fail(status.HTTP_429_TOO_MANY_REQUESTS, "REGISTRATION_RATE_LIMITED",
              "Địa chỉ IP của bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.")

    # Invalidate the live challenge of this e-mail — only once its cooldown has passed. If a concurrent
    # request already created a newer one, nothing is superseded and the unique index rejects the insert.
    db.execute(update(RC).where(RC.email_fingerprint == fp, RC.status == "pending", RC.resend_available_at <= now)
               .values(status="superseded", otp_digest=None, invalidated_at=now)
               .execution_options(synchronize_session=False))
    otp = generate_secure_otp()
    challenge = RC(
        id=secrets.token_urlsafe(32), purpose=PURPOSE, email=email, email_fingerprint=fp, full_name=full_name,
        phone=phone, password_hash=password_hash, otp_digest=hash_otp(otp), status="pending", failed_attempts=0,
        max_attempts=settings.REGISTRATION_OTP_MAX_ATTEMPTS, client_ip=client_ip, previous_challenge_id=previous_id,
        resend_available_at=now + timedelta(seconds=settings.REGISTRATION_RESEND_COOLDOWN_SECONDS),
        created_at=now, expires_at=now + timedelta(seconds=settings.REGISTRATION_OTP_TTL_SECONDS),
    )
    db.add(challenge)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        _fail(status.HTTP_429_TOO_MANY_REQUESTS, "OTP_RESEND_COOLDOWN",
              "Một mã xác thực vừa được gửi cho email này. Vui lòng chờ ít phút rồi thử lại.",
              headers={"Retry-After": str(settings.REGISTRATION_RESEND_COOLDOWN_SECONDS)},
              retry_after_seconds=settings.REGISTRATION_RESEND_COOLDOWN_SECONDS)

    from app.services.email_service import send_registration_otp_email
    outcome = send_registration_otp_email(email, full_name, otp, settings.REGISTRATION_OTP_TTL_SECONDS // 60)
    del otp
    if outcome != "sent":
        # The code never reached the mailbox: the challenge is useless, so cancel it (and let the user retry).
        db.execute(update(RC).where(RC.id == challenge.id, RC.status == "pending")
                   .values(status="cancelled", otp_digest=None, invalidated_at=now, resend_available_at=now)
                   .execution_options(synchronize_session=False))
        db.commit()
        _audit(db, "REGISTRATION_OTP_DELIVERY_FAILED", email, client_ip, f"Không gửi được mã xác thực đăng ký ({outcome}).")
        if outcome == "skipped":
            _fail(status.HTTP_503_SERVICE_UNAVAILABLE, "EMAIL_DELIVERY_UNAVAILABLE",
                  "Hệ thống gửi email chưa sẵn sàng nên chưa thể gửi mã xác thực. Vui lòng thử lại sau.")
        _fail(status.HTTP_502_BAD_GATEWAY, "EMAIL_DELIVERY_FAILED",
              "Không gửi được email chứa mã xác thực. Vui lòng kiểm tra địa chỉ email hoặc thử lại sau.")

    _audit(db, "REGISTRATION_OTP_ISSUED", email, client_ip,
           "Gửi mã xác thực đăng ký ứng viên" + (" (gửi lại, mã cũ đã bị vô hiệu hóa)" if previous_id else ""))
    db.refresh(challenge)
    state = _public_state(challenge, datetime.utcnow())
    state["message"] = f"Mã xác thực đã được gửi đến {state['masked_email']}. Mã có hiệu lực trong {settings.REGISTRATION_OTP_TTL_SECONDS // 60} phút."
    return state


def start_registration(db: Session, *, full_name: str, email: str, password: str, phone: Optional[str],
                       client_ip: str) -> Dict[str, Any]:
    email = email.strip().lower()
    _check_domain(email)
    if _email_taken(db, email):
        _fail(status.HTTP_409_CONFLICT, "EMAIL_ALREADY_REGISTERED", EMAIL_TAKEN_MESSAGE)
    return _issue(db, email=email, full_name=full_name.strip(), phone=(phone or "").replace(" ", "") or None,
                  password_hash=hash_password(password), client_ip=client_ip)


def resend_otp(db: Session, challenge_id: str, client_ip: str) -> Dict[str, Any]:
    ch = _load(db, challenge_id)
    if ch.status in ("consumed", "superseded"):
        _raise_for_state(ch)
    if _email_taken(db, ch.email):
        _fail(status.HTTP_409_CONFLICT, "EMAIL_ALREADY_REGISTERED", EMAIL_TAKEN_MESSAGE)
    return _issue(db, email=ch.email, full_name=ch.full_name, phone=ch.phone, password_hash=ch.password_hash,
                  client_ip=client_ip, previous_id=ch.id)


def challenge_status(db: Session, challenge_id: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    ch = _expire_if_due(db, _load(db, challenge_id), now)
    return _public_state(ch, now)


def _candidate_role(db: Session) -> Role:
    role = db.query(Role).filter(Role.code == PUBLIC_REGISTRATION_ROLE).first()
    if not role:
        data = next(r for r in ROLES_DATA if r["code"] == PUBLIC_REGISTRATION_ROLE)
        role = Role(code=data["code"], name=data["name"], description=data["description"], is_active=True)
        db.add(role)
        db.flush()
    return role


def verify_otp(db: Session, challenge_id: str, otp: str, client_ip: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    ch = _expire_if_due(db, _load(db, challenge_id, lock=True), now)
    _raise_for_state(ch)

    if not verify_otp_digest(otp, ch.otp_digest):
        will_block = RC.failed_attempts + 1 >= RC.max_attempts
        result = db.execute(
            update(RC)
            .where(RC.id == ch.id, RC.status == "pending", RC.failed_attempts < RC.max_attempts)
            .values(failed_attempts=RC.failed_attempts + 1,
                    status=case((will_block, "blocked"), else_=RC.status),
                    blocked_at=case((will_block, now), else_=RC.blocked_at),
                    otp_digest=case((will_block, null()), else_=RC.otp_digest))
            .returning(RC.failed_attempts, RC.status, RC.max_attempts)  # values written by THIS request
            .execution_options(synchronize_session=False))
        row = result.first()
        db.commit()
        if row is None:  # not counted: the challenge was already blocked / consumed / superseded
            db.refresh(ch)
            _raise_for_state(ch)
            _fail(status.HTTP_423_LOCKED, "OTP_CHALLENGE_BLOCKED", BLOCKED_MESSAGE.format(n=ch.max_attempts),
                  remaining_attempts=0, challenge_status="blocked")
        if row.status == "blocked":  # this request made the final wrong attempt
            _audit(db, "REGISTRATION_OTP_BLOCKED", ch.email, client_ip,
                   f"Mã xác thực đăng ký bị vô hiệu hóa sau {row.max_attempts} lần nhập sai.")
            _fail(status.HTTP_423_LOCKED, "OTP_CHALLENGE_BLOCKED", BLOCKED_MESSAGE.format(n=row.max_attempts),
                  remaining_attempts=0, challenge_status="blocked")
        remaining = max(0, row.max_attempts - row.failed_attempts)
        _fail(status.HTTP_400_BAD_REQUEST, "OTP_INVALID",
              f"Mã xác thực không chính xác. Bạn còn {remaining} lần thử.",
              remaining_attempts=remaining, challenge_status="pending")

    # Correct code: consume the challenge and create the account in ONE transaction.
    consumed = db.execute(
        update(RC)
        .where(RC.id == ch.id, RC.status == "pending", RC.otp_digest == ch.otp_digest,
               RC.failed_attempts < RC.max_attempts, RC.expires_at > now)
        .values(status="consumed", consumed_at=now, otp_digest=None)
        .execution_options(synchronize_session=False))
    if consumed.rowcount != 1:  # lost a race against another verify / a block / a resend
        db.rollback()
        db.refresh(ch)
        _raise_for_state(ch)
        _fail(status.HTTP_409_CONFLICT, "OTP_ALREADY_USED", "Mã xác thực này đã được sử dụng.",
              challenge_status=ch.status, remaining_attempts=0)

    try:
        if _email_taken(db, ch.email):
            raise IntegrityError("users.email", None, Exception("duplicate e-mail"))
        user = User(email=ch.email, hashed_password=ch.password_hash, full_name=ch.full_name, phone=ch.phone,
                    role=PUBLIC_REGISTRATION_ROLE, is_active=True, account_status="active",
                    email_verified_at=now, department=None, employee_code=None)
        db.add(user)
        db.flush()
        db.add(UserRole(user_id=user.id, role_id=_candidate_role(db).id, assigned_at=now))
        db.execute(update(RC).where(RC.id == ch.id).values(user_id=user.id).execution_options(synchronize_session=False))
        db.commit()
    except IntegrityError:
        db.rollback()
        db.execute(update(RC).where(RC.id == ch.id, RC.status == "pending")
                   .values(status="cancelled", otp_digest=None, invalidated_at=now)
                   .execution_options(synchronize_session=False))
        db.commit()
        _fail(status.HTTP_409_CONFLICT, "EMAIL_ALREADY_REGISTERED", EMAIL_TAKEN_MESSAGE)

    db.refresh(user)
    _audit(db, "REGISTRATION_COMPLETED", user.email, client_ip,
           "Tài khoản ứng viên được tạo sau khi xác thực email (vai trò: candidate).", user_id=user.id)
    return {
        "message": "Xác thực email thành công. Tài khoản ứng viên của bạn đã được kích hoạt, vui lòng đăng nhập.",
        "challenge_status": "consumed",
        "redirect_url": "/login",
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name,
                 "roles": [PUBLIC_REGISTRATION_ROLE], "account_status": user.account_status,
                 "email_verified": True, "email_verified_at": now.isoformat()},
    }
