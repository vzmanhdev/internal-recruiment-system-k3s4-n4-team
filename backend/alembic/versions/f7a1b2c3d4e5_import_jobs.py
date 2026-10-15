"""create import_jobs table for scalable excel bulk import

Revision ID: f7a1b2c3d4e5
Revises: e6c3b9a1f4d2
Create Date: 2026-10-13 14:00:00

Additive migration: creates import_jobs table for staged preview, validation, and batch processing.
Compatible with SQLite and PostgreSQL.
"""
from datetime import datetime
import sqlalchemy as sa
from alembic import op

revision = "f7a1b2c3d4e5"
down_revision = "e6c3b9a1f4d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("import_jobs"):
        op.create_table(
            "import_jobs",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("job_id", sa.String(length=36), nullable=False, index=True, unique=True),
            sa.Column("filename", sa.String(length=255), nullable=False),
            sa.Column("file_type", sa.String(length=20), nullable=False, server_default="xlsx"),
            sa.Column("total_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("valid_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("error_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("imported_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="preview"),
            sa.Column("stage_data_json", sa.Text(), nullable=True),
            sa.Column("summary_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
            sa.Column("updated_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
            sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("import_jobs"):
        op.drop_table("import_jobs")
