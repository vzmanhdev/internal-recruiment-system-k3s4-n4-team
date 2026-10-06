import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("uvicorn")

Base = declarative_base()

def get_engine_and_session():
    db_url = settings.DATABASE_URL
    try:
        # Try connecting to PostgreSQL
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            echo=False
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info(f"Successfully connected to PostgreSQL database at {db_url}")
        return engine, sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        logger.warning(f"Failed to connect to PostgreSQL ({e}). Falling back to SQLite for local development...")
        import os
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        fallback_db_path = os.path.join(backend_dir, "recruitment_fallback.db")
        fallback_url = f"sqlite:///{fallback_db_path}"
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
