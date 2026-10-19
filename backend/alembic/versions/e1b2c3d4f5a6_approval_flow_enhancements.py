"""approval flow enhancements (versioning, audit relations, types)

Revision ID: e1b2c3d4f5a6
Revises: d2a6c4e8f0b3
Create Date: 2026-10-15 18:25:00

Additive and controlled schema migration for dynamic approval flows.
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e1b2c3d4f5a6"
down_revision = "d2a6c4e8f0b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {c["name"] for c in inspector.get_columns("approval_flows")}

    # 1. Additive columns on approval_flows
    if "approval_type" not in existing_cols:
        op.add_column("approval_flows", sa.Column("approval_type", sa.String(length=50), nullable=False, server_default="job_requisition"))
    if "version" not in existing_cols:
        op.add_column("approval_flows", sa.Column("version", sa.String(length=20), nullable=False, server_default="v1.0"))
    if "updated_at" not in existing_cols:
        op.add_column("approval_flows", sa.Column("updated_at", sa.DateTime(), nullable=True))
    if "updated_by_id" not in existing_cols:
        op.add_column("approval_flows", sa.Column("updated_by_id", sa.Integer(), nullable=True))
        try:
            with op.batch_alter_table("approval_flows") as batch_op:
                batch_op.create_foreign_key("fk_approval_flows_updated_by", "users", ["updated_by_id"], ["id"])
        except Exception:
            pass  # SQLite foreign key constraint fallback
    if "description" not in existing_cols:
        op.add_column("approval_flows", sa.Column("description", sa.Text(), nullable=True))
    if "is_active" not in existing_cols:
        op.add_column("approval_flows", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.sql.expression.true()))

    # 2. Create approval_flow_versions table for complete history snapshotting
    if not inspector.has_table("approval_flow_versions"):
        op.create_table(
            "approval_flow_versions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("flow_id", sa.Integer(), nullable=False),
            sa.Column("version", sa.String(length=20), nullable=False),
            sa.Column("snapshot_json", sa.Text(), nullable=False),
            sa.Column("created_by_id", sa.Integer(), nullable=True),
            sa.Column("change_reason", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.ForeignKeyConstraint(["flow_id"], ["approval_flows.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        )
        try:
            op.create_index("ix_approval_flow_versions_flow_id", "approval_flow_versions", ["flow_id"])
        except Exception:
            pass

    # 3. Composite index for conflict checking & filtering
    try:
        op.create_index("ix_approval_flows_dept_type_status", "approval_flows", ["department_id", "approval_type", "status"])
    except Exception:
        pass


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("approval_flow_versions"):
        op.drop_table("approval_flow_versions")

    try:
        op.drop_index("ix_approval_flows_dept_type_status", table_name="approval_flows")
    except Exception:
        pass

    # Remove added columns if dialect supports drop column
    with op.batch_alter_table("approval_flows") as batch_op:
        for col in ["description", "updated_by_id", "updated_at", "version", "approval_type", "is_active"]:
            try:
                batch_op.drop_column(col)
            except Exception:
                pass
