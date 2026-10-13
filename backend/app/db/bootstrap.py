"""Additive, idempotent schema bootstrap shared by development startup and the Alembic baseline.

Replaces the raw ``ALTER TABLE`` block that previously ran unconditionally at import time in
``app/main.py``. It only ever ADDS missing tables/columns (never drops or rewrites data) and uses
dialect-appropriate column types so the same statements work on SQLite and PostgreSQL.

Production deployments must run ``alembic upgrade head`` instead of relying on startup DDL
(``AUTO_CREATE_SCHEMA`` is ignored when ``APP_ENV=production``).
"""
import logging
from datetime import datetime
from typing import Dict, List, Tuple

from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection, Engine

logger = logging.getLogger("uvicorn")

# (table, column, generic type, nullable-default clause). "DATETIME" is mapped per dialect.
COMPAT_COLUMNS: List[Tuple[str, str, str, str]] = [
    ("users", "account_status", "VARCHAR(20)", "NOT NULL DEFAULT 'active'"),
    ("users", "lock_reason", "VARCHAR(500)", ""),
    ("users", "avatar_url", "TEXT", ""),
    ("users", "employee_code", "VARCHAR(50)", ""),
    ("users", "date_of_birth", "VARCHAR(50)", ""),
    ("users", "gender", "VARCHAR(20)", ""),
    ("users", "job_title", "VARCHAR(255)", ""),
    ("users", "department", "VARCHAR(255)", "DEFAULT 'Nhân sự'"),
    ("users", "bio", "VARCHAR(1000)", ""),
    ("users", "created_at", "DATETIME", ""),
    ("users", "updated_at", "DATETIME", ""),
    ("users", "failed_login_attempts", "INTEGER", "NOT NULL DEFAULT 0"),
    ("users", "locked_until", "DATETIME", ""),
    ("users", "security_version", "INTEGER", "NOT NULL DEFAULT 1"),
    ("users", "last_login_at", "DATETIME", ""),
    ("users", "version", "INTEGER", "NOT NULL DEFAULT 1"),
    ("competencies", "weight", "FLOAT", "NOT NULL DEFAULT 0"),
    ("job_postings", "slug", "VARCHAR(255)", "DEFAULT ''"),
    ("job_postings", "views_count", "INTEGER", "NOT NULL DEFAULT 0"),
    ("job_postings", "applications_count", "INTEGER", "NOT NULL DEFAULT 0"),
    ("job_postings", "published_by_id", "INTEGER", ""),
    ("job_postings", "published_at", "DATETIME", ""),
    ("audit_logs", "actor_id", "INTEGER", ""),
    ("audit_logs", "actor_email", "VARCHAR(255)", "DEFAULT ''"),
    ("audit_logs", "action", "VARCHAR(100)", "DEFAULT ''"),
    ("audit_logs", "target_entity", "VARCHAR(100)", ""),
    ("audit_logs", "target_id", "VARCHAR(100)", ""),
    ("audit_logs", "ip_address", "VARCHAR(50)", ""),
    ("audit_logs", "payload_json", "TEXT", ""),
    ("audit_logs", "created_at", "DATETIME", ""),
    # Offer approval workflow (S7-04 / S7-05 / S7-06 / S7-07)
    ("job_offers", "salary_justification", "TEXT", ""),
    ("job_offers", "requires_escalation", "BOOLEAN", "NOT NULL DEFAULT FALSE"),
    ("job_offers", "approval_level", "VARCHAR(30)", ""),
    ("job_offers", "response_deadline", "VARCHAR(50)", ""),
    ("job_offers", "revision", "INTEGER", "NOT NULL DEFAULT 1"),
    ("job_offers", "sent_at", "DATETIME", ""),
    ("job_offers", "responded_at", "DATETIME", ""),
    ("email_logs", "attempts", "INTEGER", "NOT NULL DEFAULT 1"),
    ("auth_sessions", "previous_refresh_token_hash", "VARCHAR(255)", ""),
    ("departments", "head_user_id", "INTEGER", ""),
    ("approval_flows", "steps_json", "TEXT", ""),
    ("job_requisitions", "approval_chain_json", "TEXT", ""),
    ("job_requisitions", "approval_step_index", "INTEGER", "NOT NULL DEFAULT 0"),
    ("job_requisitions", "headcount_overridden", "BOOLEAN", "NOT NULL DEFAULT FALSE"),
    ("job_requisitions", "salary_justification", "TEXT", ""),
    ("job_postings", "min_years_experience", "INTEGER", ""),
    ("job_postings", "required_skills_json", "TEXT", ""),
    ("job_applications", "tracking_code", "VARCHAR(20)", ""),
    ("job_applications", "source", "VARCHAR(100)", ""),
    ("job_applications", "client_ip", "VARCHAR(64)", ""),
    ("job_applications", "rating", "INTEGER", ""),
    ("job_applications", "tags_json", "TEXT", ""),
    ("job_applications", "person_key", "VARCHAR(255)", ""),
    ("job_applications", "merged_from_key", "VARCHAR(255)", ""),
    ("job_applications", "merged_at", "DATETIME", ""),
    ("job_applications", "match_score", "INTEGER", ""),
    ("job_applications", "meets_requirements", "BOOLEAN", ""),
    ("job_applications", "parsed_cv_json", "TEXT", ""),
    ("job_applications", "withdraw_token_hash", "VARCHAR(128)", ""),
    ("job_applications", "is_overdue", "BOOLEAN", "NOT NULL DEFAULT FALSE"),
    ("job_applications", "stage_entered_at", "DATETIME", ""),
    ("interview_schedules", "confirmation_token_hash", "VARCHAR(128)", ""),
    ("interview_schedules", "candidate_response", "VARCHAR(30)", ""),
    ("interview_schedules", "candidate_response_note", "TEXT", ""),
    ("interview_schedules", "candidate_responded_at", "DATETIME", ""),
    ("interview_schedules", "cancel_reason", "TEXT", ""),
    ("interview_schedules", "override_reason", "TEXT", ""),
    ("candidate_evaluations", "interview_id", "INTEGER", ""),
    ("candidate_evaluations", "framework_id", "VARCHAR(100)", ""),
    ("candidate_evaluations", "criteria_json", "TEXT", ""),
    ("candidate_evaluations", "weighted_score", "FLOAT", ""),
    ("candidate_evaluations", "reopened_at", "DATETIME", ""),
    ("job_offers", "allowance", "INTEGER", "NOT NULL DEFAULT 0"),
    ("job_offers", "response_token_hash", "VARCHAR(128)", ""),
    ("email_logs", "related_entity", "VARCHAR(50)", ""),
    ("email_logs", "related_id", "VARCHAR(50)", ""),
    ("notifications", "dedupe_key", "VARCHAR(255)", ""),
    # Onboarding owners and due dates (S7-08)
    ("onboarding_checklists", "responsible_user_id", "INTEGER", ""),
    ("onboarding_checklists", "due_date", "VARCHAR(50)", ""),
]


def _sql_type(dialect: str, generic: str) -> str:
    if generic == "DATETIME":
        return "TIMESTAMP" if dialect == "postgresql" else "DATETIME"
    if generic == "FLOAT":
        return "DOUBLE PRECISION" if dialect == "postgresql" else "FLOAT"
    return generic


def _default_clause(dialect: str, clause: str) -> str:
    if dialect == "sqlite":
        return clause.replace("DEFAULT FALSE", "DEFAULT 0").replace("DEFAULT TRUE", "DEFAULT 1")
    return clause


def add_missing_columns(connection: Connection) -> List[str]:
    dialect = connection.dialect.name
    inspector = inspect(connection)
    existing: Dict[str, set] = {}
    added = []
    for table, column, generic, clause in COMPAT_COLUMNS:
        if not inspector.has_table(table):
            continue
        if table not in existing:
            existing[table] = {c["name"] for c in inspector.get_columns(table)}
        if column in existing[table]:
            continue
        ddl = f'ALTER TABLE {table} ADD COLUMN {column} {_sql_type(dialect, generic)} {_default_clause(dialect, clause)}'.strip()
        connection.execute(text(ddl))
        existing[table].add(column)
        added.append(f"{table}.{column}")
        if (table, column) == ("users", "account_status"):
            connection.execute(text("UPDATE users SET account_status = 'pending' WHERE is_active = :f"), {"f": False})
    return added


def sync_legacy_user_roles(connection: Connection) -> int:
    """Copy legacy comma-separated users.role values into user_roles for users that have no rows yet.

    Insert-only: never removes an assignment. Afterwards authorization reads user_roles only.
    """
    inspector = inspect(connection)
    if not (inspector.has_table("users") and inspector.has_table("user_roles") and inspector.has_table("roles")):
        return 0
    roles = {code: rid for rid, code in connection.execute(text("SELECT id, code FROM roles")).all()}
    linked = {uid for (uid,) in connection.execute(text("SELECT DISTINCT user_id FROM user_roles")).all()}
    inserted = 0
    for uid, legacy in connection.execute(text("SELECT id, role FROM users")).all():
        if uid in linked or not legacy:
            continue
        for code in dict.fromkeys(c.strip().lower() for c in legacy.split(",") if c.strip()):
            if code in roles:
                connection.execute(
                    text("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:u, :r, :t)"),
                    {"u": uid, "r": roles[code], "t": datetime.utcnow()},
                )
                inserted += 1
    return inserted


def ensure_schema(engine: Engine, metadata) -> None:
    """Development bootstrap: create missing tables, then add missing columns. Never destructive."""
    metadata.create_all(bind=engine, checkfirst=True)
    with engine.begin() as connection:
        added = add_missing_columns(connection)
        synced = sync_legacy_user_roles(connection)
        from app.db.rbac_catalog import ensure_permission_catalog
        granted = ensure_permission_catalog(connection)
    if granted:
        logger.info("Schema bootstrap added %d default grants for new permission codes", granted)
    if added:
        logger.info("Schema bootstrap added columns: %s", ", ".join(added))
    if synced:
        logger.info("Schema bootstrap linked %d legacy role assignments into user_roles", synced)
