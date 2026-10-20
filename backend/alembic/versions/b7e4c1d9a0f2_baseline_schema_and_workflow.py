"""baseline full schema + offer/onboarding/publishing workflow columns

Revision ID: b7e4c1d9a0f2
Revises: 8f12a94519bc
Create Date: 2026-10-11 12:00:00

Non-destructive baseline:
- creates every table defined in the SQLAlchemy models that does not exist yet (checkfirst),
- adds missing columns (legacy compatibility columns + new workflow columns) with dialect-aware types,
- links legacy ``users.role`` strings into ``user_roles`` for users with no assignment rows.

It never drops or rewrites existing data, so it is safe on the existing development databases
(which were created by the old startup ``create_all``) and on an empty PostgreSQL database.
"""
from alembic import op

from app.db.session import Base
from app.db.bootstrap import add_missing_columns, sync_legacy_user_roles
import app.models  # noqa: F401
import app.models.rbac, app.models.auth_session, app.models.password_reset  # noqa: F401,E401

revision = "b7e4c1d9a0f2"
down_revision = "8f12a94519bc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)
    add_missing_columns(bind)
    sync_legacy_user_roles(bind)


def downgrade() -> None:
    # Intentionally a no-op: this baseline only adds structures that the application requires.
    # Rolling back is done by restoring the pre-migration database backup (see reports/13).
    pass
