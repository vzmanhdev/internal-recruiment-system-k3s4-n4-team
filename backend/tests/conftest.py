"""Shared test isolation.

- Points the application at a throwaway SQLite file BEFORE app.main is imported, so
  importing the app never touches the developer database configured in backend/.env.
- Keeps every temporary test file under backend/.pytest_cache (drive D:), not the system temp dir.
- Disables outbound SMTP for every test run.
- Re-applies each test module's own ``override_get_db`` before every test and restores
  the previous overrides afterwards, so modules no longer clobber each other's database
  when the whole suite runs together.
"""
import atexit
import glob
import os
import shutil
import tempfile

import pytest

# All throwaway test files (SQLite DBs, uploaded files, tempfile.*) live inside the project
# (backend/.pytest_cache/ats_tmp, git-ignored) instead of the system temp dir on drive C:.
# Override with ATS_TEST_TMP_ROOT if needed.
_TMP_ROOT = os.environ.get("ATS_TEST_TMP_ROOT") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".pytest_cache", "ats_tmp")
os.makedirs(_TMP_ROOT, exist_ok=True)
for _old in glob.glob(os.path.join(_TMP_ROOT, "ats_tests_*")):  # leftovers of earlier runs (ours only)
    shutil.rmtree(_old, ignore_errors=True)
tempfile.tempdir = _TMP_ROOT
_TEST_DIR = tempfile.mkdtemp(prefix="ats_tests_", dir=_TMP_ROOT)
atexit.register(shutil.rmtree, _TEST_DIR, True)
os.environ["TEST_TMP_DIR"] = _TEST_DIR
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(_TEST_DIR, "app_import.db").replace("\\", "/")
os.environ["APP_ENV"] = "test"
os.environ["SMTP_HOST"] = "127.0.0.1"
os.environ["SMTP_PORT"] = "1"
os.environ["SMTP_USERNAME"] = ""
os.environ["SMTP_APP_PASSWORD"] = ""
os.environ["FILE_STORAGE_DIR"] = os.path.join(_TEST_DIR, "storage")
os.environ["BACKGROUND_WORKER_ENABLED"] = "false"


def test_db_path(name: str) -> str:
    return os.path.join(_TEST_DIR, name)


@pytest.fixture(autouse=True)
def _isolate_module_database(request):
    from app.main import app
    from app.db.session import get_db

    saved = dict(app.dependency_overrides)
    override = getattr(request.module, "override_get_db", None)
    if override is not None:
        app.dependency_overrides[get_db] = override
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


def session_token(db, user) -> str:
    """Create a real server-side AuthSession for ``user`` and return an access token bound to it.

    Access tokens must carry a session id; tests that previously minted session-less tokens
    use this helper so they keep exercising the full authentication chain.
    """
    from datetime import datetime, timedelta
    from app.models.auth_session import AuthSession
    from app.core.security import create_access_token, generate_refresh_token, hash_token

    now = datetime.utcnow()
    sess = AuthSession(
        user_id=user.id,
        refresh_token_hash=hash_token(generate_refresh_token()),
        created_at=now,
        last_active_at=now,
        expires_at=now + timedelta(hours=12),
    )
    db.add(sess)
    db.commit()
    return create_access_token(subject=user.id, session_id=sess.id, security_version=user.security_version)
