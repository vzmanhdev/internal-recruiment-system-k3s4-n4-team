from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add current directory to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

# Import Base and ALL models so autogenerate/baseline see the complete metadata
from app.core.config import settings
from app.db.session import Base
import app.models  # noqa: F401
import app.models.rbac, app.models.auth_session, app.models.password_reset  # noqa: F401,E401

config = context.config
# The migration target is the application's configured DATABASE_URL (override with "-x url=...").
_x_url = context.get_x_argument(as_dictionary=True).get("url")
_target_url = _x_url or settings.DATABASE_URL
if _target_url.startswith("postgres://"):
    _target_url = _target_url.replace("postgres://", "postgresql://", 1)
config.set_main_option("sqlalchemy.url", _target_url.replace("%", "%%"))

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
