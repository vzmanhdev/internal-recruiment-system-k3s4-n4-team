"""recruitment feature completion: master data mapping, files, pipeline, scorecards, reporting

Revision ID: c5a9e2f1d7b3
Revises: b7e4c1d9a0f2
Create Date: 2026-10-11 18:00:00

Additive only. Maps the legacy master-data tables (competency_frameworks, competency_criteria,
interview_questions) with their existing schema, creates new tables (stored_files, application_notes,
talent_pool_entries, saved_filters, sla_rules, recruitment_costs, asked_questions, onboarding_templates)
and adds the new columns listed in app.db.bootstrap.COMPAT_COLUMNS.
"""
from alembic import op

from app.db.session import Base
from app.db.bootstrap import add_missing_columns
import app.models  # noqa: F401
import app.models.rbac, app.models.auth_session, app.models.password_reset  # noqa: F401,E401

revision = "c5a9e2f1d7b3"
down_revision = "b7e4c1d9a0f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)
    add_missing_columns(bind)


def downgrade() -> None:
    # Additive revision; roll back by restoring the pre-migration backup (reports/13).
    pass
