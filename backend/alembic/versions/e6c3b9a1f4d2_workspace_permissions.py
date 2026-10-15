"""workspace access permissions (workspace:*:access) + default grants

Revision ID: e6c3b9a1f4d2
Revises: d4f7a2c8e1b6
Create Date: 2026-10-13 10:00:00

Additive data migration: inserts the new permission codes and, for roles that exist, a role_permissions
row with the default grant. Existing rows are never modified, so matrix edits made by an admin are kept.
"""
import sqlalchemy as sa
from alembic import op

from app.db.rbac_catalog import PERMISSIONS_DATA, ensure_permission_catalog

revision = "e6c3b9a1f4d2"
down_revision = "d4f7a2c8e1b6"
branch_labels = None
depends_on = None

WORKSPACE_CODES = [p for p in PERMISSIONS_DATA if p["code"].startswith("workspace:")]


def upgrade() -> None:
    ensure_permission_catalog(op.get_bind())


def downgrade() -> None:
    bind = op.get_bind()
    for p in WORKSPACE_CODES:
        bind.execute(sa.text("DELETE FROM role_permissions WHERE permission_code = :c"), {"c": p["code"]})
        bind.execute(sa.text("DELETE FROM permissions WHERE code = :c"), {"c": p["code"]})
