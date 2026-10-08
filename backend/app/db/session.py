import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("uvicorn")

Base = declarative_base()

def get_engine_and_session():
    db_url = settings.DATABASE_URL
    try:
        connect_args = {}
        if db_url.startswith("postgresql"):
            connect_args = {"connect_timeout": 3}
        # Try connecting to PostgreSQL
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args=connect_args,
            echo=False
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to configured database")
        return engine, sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        if settings.APP_ENV.lower() in {"production", "prod"}:
            raise RuntimeError("Configured database is unavailable") from e
        logger.warning("Configured database unavailable; using the local SQLite development database")
        import os
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        fallback_path = os.path.join(backend_dir, "recruitment_fallback.db")
        fallback_url = f"sqlite:///{fallback_path.replace(os.sep, '/')}"
        fallback_engine = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
        return fallback_engine, sessionmaker(autocommit=False, autoflush=False, bind=fallback_engine)

engine, SessionLocal = get_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
