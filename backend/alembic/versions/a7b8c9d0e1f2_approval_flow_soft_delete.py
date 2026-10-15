"""approval flow soft delete and archival support

Revision ID: a7b8c9d0e1f2
Revises: e1b2c3d4f5a6
Create Date: 2026-10-15 19:30:00

Additive and controlled schema migration for approval flow soft deletion and archival.
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a7b8c9d0e1f2"
down_revision = "e1b2c3d4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {c["name"] for c in inspector.get_columns("approval_flows")}

    if "is_deleted" not in existing_cols:
        op.add_column("approval_flows", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()))
    if "deleted_at" not in existing_cols:
        op.add_column("approval_flows", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    if "deleted_by_id" not in existing_cols:
        op.add_column("approval_flows", sa.Column("deleted_by_id", sa.Integer(), nullable=True))
        try:
            with op.batch_alter_table("approval_flows") as batch_op:
                batch_op.create_foreign_key("fk_approval_flows_deleted_by", "users", ["deleted_by_id"], ["id"])
        except Exception:
            pass

    try:
        op.create_index("ix_approval_flows_is_deleted", "approval_flows", ["is_deleted"])
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_index("ix_approval_flows_is_deleted", table_name="approval_flows")
    except Exception:
        pass

    with op.batch_alter_table("approval_flows") as batch_op:
        for col in ["deleted_by_id", "deleted_at", "is_deleted"]:
            try:
                batch_op.drop_column(col)
            except Exception:
                pass
