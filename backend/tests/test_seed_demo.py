"""The demo seed is explicit, dev-only and idempotent; it runs against a throw-away SQLite file (never the dev DB)."""
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]


def _run(code_or_module, db_path, extra_env=None, module=False, args=()):
    env = dict(os.environ, DATABASE_URL=f"sqlite:///{db_path.as_posix()}", AUTO_CREATE_SCHEMA="false", APP_ENV="development",
               BACKGROUND_WORKER_ENABLED="false", PYTHONIOENCODING="utf-8")
    env.update(extra_env or {})
    cmd = [sys.executable, "-m", code_or_module, *args] if module else [sys.executable, "-c", code_or_module]
    return subprocess.run(cmd, cwd=BACKEND, env=env, capture_output=True, text=True, encoding="utf-8", timeout=180)


def _count(db_path, sql):
    with sqlite3.connect(db_path) as c:
        return c.execute(sql).fetchone()[0]


def test_seed_is_dev_only_idempotent_and_never_prints_the_password(tmp_path):
    db = tmp_path / "seed.db"
    made = _run("from app.db.session import Base, engine; import app.models; Base.metadata.create_all(bind=engine)", db)
    assert made.returncode == 0, made.stderr

    assert _run("app.db.seed_demo", db, module=True).returncode == 2                         # password required
    assert _run("app.db.seed_demo", db, {"APP_ENV": "production", "DEMO_SEED_PASSWORD": "x" * 12}, module=True).returncode == 2

    dry = _run("app.db.seed_demo", db, module=True, args=("--dry-run",))
    assert dry.returncode == 0, dry.stdout + dry.stderr
    assert _count(db, "select count(*) from users") == 0                                    # dry-run writes nothing
    first = _run("app.db.seed_demo", db, {"DEMO_SEED_PASSWORD": "Secret-demo-123"}, module=True)
    assert first.returncode == 0, first.stdout + first.stderr
    assert "Secret-demo-123" not in first.stdout + first.stderr
    counts = {t: _count(db, f"select count(*) from {t}") for t in ("users", "user_roles", "job_requisitions", "job_postings",
                                                                     "job_applications", "interview_schedules", "job_offers")}
    assert counts["users"] == 8 and counts["job_applications"] == 6 and counts["job_offers"] == 1
    assert _count(db, "select count(*) from users where email not like '%@demo.example.com'") == 0
    assert _count(db, "select count(*) from email_logs") == 0                                # nothing queued for sending

    second = _run("app.db.seed_demo", db, {"DEMO_SEED_PASSWORD": "Another-pass-456"}, module=True)
    assert second.returncode == 0 and "Đã tạo 0 bản ghi" in second.stdout
    assert {t: _count(db, f"select count(*) from {t}") for t in counts} == counts
    # existing accounts are not touched (password not reset by the second run)
    with sqlite3.connect(db) as c:
        hashes = {row[0] for row in c.execute("select hashed_password from users")}
    assert len(hashes) == 8
