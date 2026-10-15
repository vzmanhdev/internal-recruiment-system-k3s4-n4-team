"""public career page settings (single row)

Revision ID: d2a6c4e8f0b3
Revises: c7e1f3a9b2d4
Create Date: 2026-10-14 14:00:00

Additive: new table only.
"""
import sqlalchemy as sa
from alembic import op

revision = "d2a6c4e8f0b3"
down_revision = "c7e1f3a9b2d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not sa.inspect(op.get_bind()).has_table("career_page_settings"):
        op.create_table(
            "career_page_settings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("data_json", sa.Text(), nullable=False),
            sa.Column("updated_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("career_page_settings")
