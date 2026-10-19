"""job posting review note (change request from the HR Manager)

Revision ID: c7e1f3a9b2d4
Revises: b5c2d8e4f1a7
Create Date: 2026-10-14 13:00:00

Additive: one nullable column.
"""
import sqlalchemy as sa
from alembic import op

revision = "c7e1f3a9b2d4"
down_revision = "b5c2d8e4f1a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if "review_note" not in {c["name"] for c in sa.inspect(op.get_bind()).get_columns("job_postings")}:
        op.add_column("job_postings", sa.Column("review_note", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("job_postings") as batch:
        batch.drop_column("review_note")
