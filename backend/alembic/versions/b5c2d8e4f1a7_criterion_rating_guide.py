"""competency criterion rating guide (category, benchmark_low/mid/high)

Revision ID: b5c2d8e4f1a7
Revises: a3d8e5f2c1b9
Create Date: 2026-10-14 11:00:00

Additive: four nullable columns; existing criteria keep working unchanged.
"""
import sqlalchemy as sa
from alembic import op

revision = "b5c2d8e4f1a7"
down_revision = "a3d8e5f2c1b9"
branch_labels = None
depends_on = None

COLUMNS = (("category", sa.String(length=60)), ("benchmark_low", sa.Text()), ("benchmark_mid", sa.Text()), ("benchmark_high", sa.Text()))


def upgrade() -> None:
    existing = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("competency_criteria")}
    for name, type_ in COLUMNS:
        if name not in existing:
            op.add_column("competency_criteria", sa.Column(name, type_, nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("competency_criteria") as batch:
        for name, _ in reversed(COLUMNS):
            batch.drop_column(name)
