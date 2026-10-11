# 13 — Database Migration Verification

Written for: whoever deploys the backend.

## What changed

- `alembic/env.py` now targets the application's configured `DATABASE_URL` (override: `alembic -x url=… upgrade head`) and loads every model.
- `8f12a94519bc_password_reset_sessions` is idempotent (skips if the table exists, or if `users` does not exist yet on an empty DB).
- Revision **`b7e4c1d9a0f2`** (round 1): creates any missing tables from the models (`checkfirst`), adds missing columns with dialect-aware types, and links legacy `users.role` strings into `user_roles` for users without assignment rows. Additive only — no drops, no data rewrites. `downgrade()` is a deliberate no-op; rollback = restore the backup.
- New columns: `job_offers` (salary_justification, requires_escalation, approval_level, response_deadline, revision, sent_at, responded_at), `onboarding_checklists` (responsible_user_id, due_date), `job_postings` (published_by_id, published_at), `email_logs.attempts`, `auth_sessions.previous_refresh_token_hash`. New tables: `notifications`, `notification_preferences`, `offer_approval_logs`.
- New revision **`c5a9e2f1d7b3`** (round 2, **head**): same additive approach (`create_all(checkfirst)` + missing columns). Adds tables `stored_files`, `application_notes`, `talent_pool_entries`, `saved_filters`, `sla_rules`, `recruitment_costs`, `asked_questions`, `onboarding_templates` (and the master-data tables `competency_frameworks`, `competency_criteria`, `interview_questions` where absent — existing legacy rows are kept and are now mapped with their string ids); columns on `departments` (head_user_id), `approval_flows` (steps_json), `job_requisitions` (approval_chain_json, approval_step_index, headcount_overridden, salary_justification), `job_postings` (min_years_experience, required_skills_json), `job_applications` (tracking_code, source, client_ip, rating, tags_json, person_key, merged_*, match_score, meets_requirements, parsed_cv_json, withdraw_token_hash, is_overdue, stage_entered_at), `interview_schedules` (confirmation_token_hash, candidate_response*, cancel_reason, override_reason), `candidate_evaluations` (interview_id, framework_id, criteria_json, weighted_score, reopened_at), `job_offers` (allowance, response_token_hash), `email_logs` (related_entity, related_id). `downgrade()` is a no-op (restore the backup).
- Development startup still self-heals the schema via `app/db/bootstrap.py` when `AUTO_CREATE_SCHEMA=true` and `APP_ENV` is not production; production never runs DDL at startup.

## Verification performed (copies only)

Round 1 output: `reports/evidence/migration_verification.txt`. Round 2 (head `c5a9e2f1d7b3`): `reports/evidence/migration_verification_c5a9e2f1d7b3.txt`.

| Database | Result | Rows before → after |
|---|---|---|
| empty SQLite | 3 revisions applied, 0 missing tables/columns vs models | — |
| copy of `backend/recruitment.db` (active dev DB) | applied, 0 missing tables/columns | users 17→17, user_roles 23→23, requisitions 2→2, postings 2→2, applications 2→2, audit_logs 117→117, sessions 17→17 |
| copy of `recruitment_fallback.db` | applied, 0 missing | unchanged (contains 12 orphan `user_roles`) |
| second `upgrade head` on each | no-op | — |
| originals | SHA-256 unchanged | — |

Round 2 — `alembic upgrade head` to **`c5a9e2f1d7b3`** (fresh copies taken 2026-10-11):

| Database | Result | Rows before → after |
|---|---|---|
| empty SQLite | 4 revisions applied, `alembic_version = c5a9e2f1d7b3`, 0 missing tables/columns vs the 42 mapped tables | — |
| copy of `backend/recruitment.db` | 4 revisions applied, 0 missing tables/columns | users 17→17, user_roles 23→23, requisitions 2→2, postings 2→2, applications 2→2, offers 0→0, audit_logs 117→117, sessions 17→17 |
| copy of `recruitment_fallback.db` | 4 revisions applied, 0 missing | unchanged (user_roles 12 orphans) |
| second `upgrade head` on each copy | no-op | — |
| originals | SHA-256 unchanged after verification | — |

Note: the active dev DB itself was briefly altered by an unrelated ad-hoc command and restored byte-identically (report 12, "Incident").

PostgreSQL: **CANNOT_VERIFY** (no access). The DDL uses portable types (`TIMESTAMP`, `DOUBLE PRECISION`, `BOOLEAN DEFAULT FALSE`) but has not been executed on PostgreSQL.

## Deployment procedure

1. Back up the database (`pg_dump -Fc recruitment_db > backup_$(date +%F).dump`, or copy the SQLite file) and verify the backup restores into a scratch database.
2. `cd backend && venv/Scripts/python.exe -m alembic upgrade head` (with `DATABASE_URL` set).
3. Check: `SELECT version_num FROM alembic_version;` → `d4f7a2c8e1b6`.
4. Check every active user has a role row: `SELECT id, email FROM users u WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id);` → should be empty before the legacy fallback is removed (F-036).
5. Start the app with `APP_ENV=production` (startup DDL disabled, no SQLite fallback).

Rollback: stop the app, restore the backup from step 1.

## Data not migrated (needs a decision)

- Round 2 mapped the legacy master-data tables `competency_frameworks` (2 rows), `competency_criteria` (11) and `interview_questions` (6) as-is (string ids) — no data rewritten. Still unmapped: `salary_bands` (7 rows; bands now live on `job_titles.min_salary/max_salary`) and the other legacy tables listed in report 04 — copying `salary_bands` into job titles is a data change that needs a decision.
- 12 orphan `user_roles` rows in `recruitment_fallback.db`.
