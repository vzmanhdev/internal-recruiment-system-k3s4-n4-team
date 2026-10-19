"""candidate self-registration with e-mail OTP

Revision ID: f3c8a1d5e9b7
Revises: a7b8c9d0e1f2
Create Date: 2026-10-16 10:00:00

Additive only:
* new table ``registration_challenges`` (pending registrations + OTP challenges, purpose candidate_registration);
* new nullable column ``users.email_verified_at`` (existing accounts stay NULL = not verified, nothing is claimed);
* candidate role description updated to the approved text ONLY where it still equals the previous default
  (an admin-edited description is kept). The role and its grants are ensured additively.

No user is re-assigned, activated, unlocked or deleted. Existing employee / pending accounts are untouched.
"""
from datetime import datetime

import sqlalchemy as sa
from alembic import op

revision = "f3c8a1d5e9b7"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from app.db.rbac_catalog import (CANDIDATE_ROLE_DESCRIPTION, CANDIDATE_ROLE_DESCRIPTION_OLD, DEFAULT_GRANTED_MATRIX,
                                     ROLES_DATA, ensure_permission_catalog)
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "email_verified_at" not in {c["name"] for c in inspector.get_columns("users")}:
        op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))

    if not inspector.has_table("registration_challenges"):
        op.create_table(
            "registration_challenges",
            sa.Column("id", sa.String(64), primary_key=True),
            sa.Column("purpose", sa.String(40), nullable=False, server_default="candidate_registration"),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("email_fingerprint", sa.String(64), nullable=False),
            sa.Column("full_name", sa.String(255), nullable=False),
            sa.Column("phone", sa.String(50), nullable=True),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("otp_digest", sa.String(255), nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("failed_attempts", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="5"),
            sa.Column("client_ip", sa.String(50), nullable=True),
            sa.Column("previous_challenge_id", sa.String(64), nullable=True),
            sa.Column("resend_available_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("blocked_at", sa.DateTime(), nullable=True),
            sa.Column("consumed_at", sa.DateTime(), nullable=True),
            sa.Column("invalidated_at", sa.DateTime(), nullable=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        )
        op.create_index("ix_registration_challenges_email_fingerprint", "registration_challenges", ["email_fingerprint"])
        op.create_index("idx_reg_challenge_ip_created", "registration_challenges", ["client_ip", "created_at"])
        op.create_index("idx_reg_challenge_fp_created", "registration_challenges", ["email_fingerprint", "created_at"])
        op.create_index("uix_reg_challenge_one_pending", "registration_challenges", ["email_fingerprint"], unique=True,
                        sqlite_where=sa.text("status = 'pending'"), postgresql_where=sa.text("status = 'pending'"))

    if inspector.has_table("roles"):
        data = next(r for r in ROLES_DATA if r["code"] == "candidate")
        exists = bind.execute(sa.text("SELECT id FROM roles WHERE code = 'candidate'")).first()
        if not exists:
            bind.execute(sa.text("INSERT INTO roles (code, name, description, is_active, created_at) "
                                 "VALUES (:c, :n, :d, :a, :t)"),
                         {"c": data["code"], "n": data["name"], "d": CANDIDATE_ROLE_DESCRIPTION, "a": True,
                          "t": datetime.utcnow()})
        else:
            bind.execute(sa.text("UPDATE roles SET description = :new WHERE code = 'candidate' "
                                 "AND (description IS NULL OR description = :old)"),
                         {"new": CANDIDATE_ROLE_DESCRIPTION, "old": CANDIDATE_ROLE_DESCRIPTION_OLD})
        ensure_permission_catalog(bind)
        # Default candidate grants for permission codes that exist but have no candidate row yet (insert-only:
        # an admin's existing allow/deny decision for the candidate role is never changed).
        if inspector.has_table("role_permissions") and inspector.has_table("permissions"):
            granted = set(DEFAULT_GRANTED_MATRIX.get("candidate", []))
            have = {r[0] for r in bind.execute(sa.text(
                "SELECT permission_code FROM role_permissions WHERE role_code = 'candidate'"))}
            for (code,) in bind.execute(sa.text("SELECT code FROM permissions")).all():
                if code not in have:
                    bind.execute(sa.text("INSERT INTO role_permissions (role_code, permission_code, is_granted) "
                                         "VALUES ('candidate', :c, :g)"), {"c": code, "g": code in granted})


def downgrade() -> None:
    from app.db.rbac_catalog import CANDIDATE_ROLE_DESCRIPTION, CANDIDATE_ROLE_DESCRIPTION_OLD
    op.execute(sa.text("UPDATE roles SET description = :old WHERE code = 'candidate' AND description = :new")
               .bindparams(old=CANDIDATE_ROLE_DESCRIPTION_OLD, new=CANDIDATE_ROLE_DESCRIPTION))
    op.drop_index("uix_reg_challenge_one_pending", table_name="registration_challenges")
    op.drop_index("idx_reg_challenge_fp_created", table_name="registration_challenges")
    op.drop_index("idx_reg_challenge_ip_created", table_name="registration_challenges")
    op.drop_index("ix_registration_challenges_email_fingerprint", table_name="registration_challenges")
    op.drop_table("registration_challenges")
    # Note: this discards the verification timestamps of accounts registered after the upgrade
    # (the accounts themselves are kept). Pending, unverified registrations are discarded with the table.
    with op.batch_alter_table("users") as batch:
        batch.drop_column("email_verified_at")
