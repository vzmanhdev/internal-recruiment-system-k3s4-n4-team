import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("uvicorn")

Base = declarative_base()

from app.core.search import unaccent_vn

SQLITE_FALLBACK_URL = "sqlite:///./recruitment_fallback.db"


def _configure_sqlite_connection(dbapi_connection, connection_record):
    # SQLite ignores FOREIGN KEY constraints unless enabled per connection; PostgreSQL always enforces them.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
    # Register custom unaccent function for accent/case-insensitive search in SQLite
    if hasattr(dbapi_connection, "create_function"):
        dbapi_connection.create_function("unaccent_vn", 1, unaccent_vn)
        dbapi_connection.create_function("unaccent", 1, unaccent_vn)


def _make_engine(url: str):
    if url.startswith("sqlite"):
        eng = create_engine(url, connect_args={"check_same_thread": False}, echo=False)
        event.listen(eng, "connect", _configure_sqlite_connection)
        return eng
    return create_engine(url, pool_pre_ping=True, echo=False)


def get_engine_and_session():
    db_url = settings.DATABASE_URL
    engine = _make_engine(db_url)
    try:
        with engine.connect():
            pass
        logger.info("Connected to database (%s)", engine.url.render_as_string(hide_password=True))
    except Exception as exc:
        # Production must never silently switch to another database.
        if settings.is_production or not settings.ALLOW_SQLITE_FALLBACK:
            raise RuntimeError(
                f"Không kết nối được cơ sở dữ liệu đã cấu hình ({engine.url.render_as_string(hide_password=True)})."
            ) from exc
        logger.warning(
            "Database unavailable (%s). APP_ENV=%s allows the development SQLite fallback %s.",
            type(exc).__name__, settings.APP_ENV, SQLITE_FALLBACK_URL,
        )
        engine = _make_engine(SQLITE_FALLBACK_URL)
    return engine, sessionmaker(autocommit=False, autoflush=False, bind=engine)


engine, SessionLocal = get_engine_and_session()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
