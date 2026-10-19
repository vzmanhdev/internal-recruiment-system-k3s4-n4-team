"""retire the "employee" role: every assignment becomes "candidate" (approved by the product owner 2026-10-16)

Revision ID: a9d4e6b2c8f1
Revises: f3c8a1d5e9b7
Create Date: 2026-10-16 15:00:00

* Each user_roles row of "employee" is replaced by "candidate" (no duplicate if the user already has it).
* The legacy users.role string has the token "employee" replaced by "candidate".
* The "employee" role row is DEACTIVATED, not deleted; its role_permissions rows are kept untouched.
* Internal staff keep their other roles; their internal workspaces come from those roles' own grants.
* Every converted user gets one audit_logs row (action ROLE_MIGRATED_EMPLOYEE_TO_CANDIDATE) holding the
  previous state, so the downgrade restores exactly what was there. No user, session or business row is deleted.
"""
import json
from datetime import datetime

import sqlalchemy as sa
from alembic import op

revision = "a9d4e6b2c8f1"
down_revision = "f3c8a1d5e9b7"
branch_labels = None
depends_on = None

ACTION = "ROLE_MIGRATED_EMPLOYEE_TO_CANDIDATE"


def _role_id(bind, code):
    row = bind.execute(sa.text("SELECT id FROM roles WHERE code = :c"), {"c": code}).first()
    return row[0] if row else None


def _swap_token(legacy, old, new):
    codes = [c.strip() for c in (legacy or "").split(",") if c.strip()]
    return ",".join(dict.fromkeys(new if c.lower() == old else c for c in codes))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not {"users", "roles", "user_roles", "audit_logs"} <= set(inspector.get_table_names()):
        return
    employee_id, candidate_id = _role_id(bind, "employee"), _role_id(bind, "candidate")
    if candidate_id is None:
        raise RuntimeError("candidate role missing: run revision f3c8a1d5e9b7 first")
    now = datetime.utcnow()

    with_role = set()
    if employee_id is not None:
        with_role = {r[0] for r in bind.execute(sa.text("SELECT user_id FROM user_roles WHERE role_id = :e"),
                                                {"e": employee_id})}
    with_string = {uid for uid, legacy in bind.execute(sa.text("SELECT id, role FROM users"))
                   if "employee" in [c.strip().lower() for c in (legacy or "").split(",")]}

    for uid in sorted(with_role | with_string):
        legacy = bind.execute(sa.text("SELECT role FROM users WHERE id = :u"), {"u": uid}).scalar()
        had_candidate = bind.execute(sa.text("SELECT 1 FROM user_roles WHERE user_id = :u AND role_id = :c"),
                                     {"u": uid, "c": candidate_id}).first() is not None
        added_candidate = False
        if uid in with_role:
            if not had_candidate:
                bind.execute(sa.text("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:u, :c, :t)"),
                             {"u": uid, "c": candidate_id, "t": now})
                added_candidate = True
            bind.execute(sa.text("DELETE FROM user_roles WHERE user_id = :u AND role_id = :e"),
                         {"u": uid, "e": employee_id})
        new_legacy = _swap_token(legacy, "employee", "candidate")
        if legacy is not None and new_legacy != legacy:
            bind.execute(sa.text("UPDATE users SET role = :r WHERE id = :u"), {"r": new_legacy, "u": uid})
        bind.execute(sa.text(
            "INSERT INTO audit_logs (actor_id, actor_email, action, target_entity, target_id, ip_address, payload_json, created_at) "
            "VALUES (NULL, :a, :act, 'USER', :t, NULL, :p, :ts)"),
            {"a": "system:migration a9d4e6b2c8f1", "act": ACTION, "t": str(uid), "ts": now,
             "p": json.dumps({"had_employee_role": uid in with_role, "added_candidate": added_candidate,
                              "legacy_role": legacy}, ensure_ascii=False)})

    if employee_id is not None:
        bind.execute(sa.text("UPDATE roles SET is_active = :f WHERE id = :e"), {"f": False, "e": employee_id})


def downgrade() -> None:
    bind = op.get_bind()
    employee_id, candidate_id = _role_id(bind, "employee"), _role_id(bind, "candidate")
    if employee_id is not None:
        bind.execute(sa.text("UPDATE roles SET is_active = :t WHERE id = :e"), {"t": True, "e": employee_id})
    rows = bind.execute(sa.text("SELECT id, target_id, payload_json FROM audit_logs WHERE action = :a"),
                        {"a": ACTION}).all()
    for log_id, target, payload in rows:
        uid, data = int(target), json.loads(payload)
        if data.get("had_employee_role") and employee_id is not None:
            if not bind.execute(sa.text("SELECT 1 FROM user_roles WHERE user_id = :u AND role_id = :e"),
                                {"u": uid, "e": employee_id}).first():
                bind.execute(sa.text("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:u, :e, :t)"),
                             {"u": uid, "e": employee_id, "t": datetime.utcnow()})
        if data.get("added_candidate") and candidate_id is not None:
            bind.execute(sa.text("DELETE FROM user_roles WHERE user_id = :u AND role_id = :c"),
                         {"u": uid, "c": candidate_id})
        if data.get("legacy_role") is not None:
            bind.execute(sa.text("UPDATE users SET role = :r WHERE id = :u"), {"r": data["legacy_role"], "u": uid})
        bind.execute(sa.text("DELETE FROM audit_logs WHERE id = :i"), {"i": log_id})
