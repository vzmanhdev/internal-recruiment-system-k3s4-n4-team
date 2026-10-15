"""login attempt guards: throttle failed sign-ins per browser session instead of per account

Revision ID: d4f7a2c8e1b6
Revises: c5a9e2f1d7b3
Create Date: 2026-10-11 20:00:00

Additive only: creates login_attempt_guards. users.failed_login_attempts / users.locked_until are kept
(no longer used for throttling) so no data is dropped.
"""
from alembic import op

import app.models  # noqa: F401
from app.models.login_guard import LoginAttemptGuard

revision = "d4f7a2c8e1b6"
down_revision = "c5a9e2f1d7b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    LoginAttemptGuard.__table__.create(bind=op.get_bind(), checkfirst=True)


def downgrade() -> None:
    LoginAttemptGuard.__table__.drop(bind=op.get_bind(), checkfirst=True)
