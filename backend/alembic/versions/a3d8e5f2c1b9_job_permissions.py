"""job posting permissions (job:manage, job:publish) + default grants

Revision ID: a3d8e5f2c1b9
Revises: f7a1b2c3d4e5
Create Date: 2026-10-14 09:00:00

Additive data migration, same mechanism as e6c3b9a1f4d2: only missing permission codes and missing
role_permissions rows are inserted; grants edited by an admin are never touched.
"""
import sqlalchemy as sa
from alembic import op

from app.db.rbac_catalog import ensure_permission_catalog

revision = "a3d8e5f2c1b9"
down_revision = "f7a1b2c3d4e5"
branch_labels = None
depends_on = None

CODES = ("job:manage", "job:publish")


def upgrade() -> None:
    ensure_permission_catalog(op.get_bind())


def downgrade() -> None:
    bind = op.get_bind()
    for code in CODES:
        bind.execute(sa.text("DELETE FROM role_permissions WHERE permission_code = :c"), {"c": code})
        bind.execute(sa.text("DELETE FROM permissions WHERE code = :c"), {"c": code})
