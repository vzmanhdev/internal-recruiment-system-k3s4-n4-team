from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add current directory to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

# Import Base and models
from app.db.session import Base
from app.models.user import User
from app.models.hr import Department
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.job import JobPosting
from app.models.application import JobApplication, ApplicationLog
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.referral_eval import InternalReferral, CandidateEvaluation
from app.models.password_reset import PasswordResetSession

config = context.config

if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
