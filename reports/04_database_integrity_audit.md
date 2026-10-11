# 04 — Database Integrity Audit

Written for: the engineering team. Databases inspected (copies only): `backend/recruitment.db` (the DB configured in `backend/.env`, i.e. the active development DB) and `recruitment_fallback.db`. Production target: PostgreSQL 16 (`compose.yaml`) — **no PostgreSQL access was authorised, so all PostgreSQL runtime checks are CANNOT_VERIFY**.

## Executive summary

The schema was created by `Base.metadata.create_all()` at import time plus raw `ALTER TABLE` patches; Alembic existed but was unusable and no database was versioned. Foreign keys were never enforced on SQLite. Critical multi-step operations committed several times per request. This session added a non-destructive Alembic baseline (`b7e4c1d9a0f2`), dialect-aware dev bootstrap, FK enforcement on SQLite, single-transaction workflows with compare-and-set status transitions, and verified the migration on a fresh DB and on copies of both dev DBs without any row loss.

## 4.1 Schema inventory

- SQLAlchemy models: **31 tables** after remediation (29 before + `notifications`, `notification_preferences`, `offer_approval_logs` − none removed).
- Dev DB `backend/recruitment.db`: 39 tables, of which **11 legacy tables are not mapped by any current model** (row counts in the copy): `competency_criteria` (11), `salary_bands` (7), `interview_questions` (6), `competency_frameworks` (2), `requisitions` (2), `password_reset_otps` (1), and empty `applications`, `candidates`, `offers`, `onboarding_tasks`, `evaluation_scorecards`. They come from an earlier model generation. **Important:** salary bands, competency frameworks/criteria and interview questions — master data required by S2-05/S2-06/S2-07 — exist as data only in these unmapped tables, so the current code cannot use them. They are **not dropped or migrated** (data change needs approval); recommended: map them in a new Alembic revision (work package 3 in report 09).
- Model ↔ migration ↔ actual DB: before — migrations described only `password_reset_sessions`; after — `alembic upgrade head` on a fresh DB produces **0 missing tables / 0 missing columns** vs. the models (`reports/evidence/migration_verification.txt`).

## 4.2 Integrity checklist

| Check | Finding | Status |
|---|---|---|
| Primary keys | present on all mapped tables | PASS |
| Foreign keys declared | yes on most relations | PASS |
| Foreign keys enforced (SQLite) | **never** (`PRAGMA foreign_keys` off) → 12 orphan `user_roles` rows in `recruitment_fallback.db` | FIXED going forward (pragma on every connection); orphan cleanup OPEN (needs approval) |
| Unique constraints | `users.email`, `job_requisitions.code`, `job_postings.slug`, `job_offers.application_id`, `notification_preferences(user_id,type)` | PASS; duplicate applications / evaluations / referrals prevented in application logic (no DB unique constraint yet — recommended partial unique index on PostgreSQL) |
| Check constraints | none (salary min ≤ max, quantity ≥ 1, weights = 100%) | validation moved to API (min≤max, quantity≥1); DB checks OPEN |
| Indexes | FK/filter indexes on most hot columns; added `notifications(recipient_id,is_read)`, `auth_sessions.previous_refresh_token_hash` | PASS |
| Cascades | `user_roles`, `auth_sessions`, notifications cascade on user delete; applications cascade logs/interviews/offer | PASS (no user delete endpoint exists) |
| Enum consistency | statuses are free strings; new canonical sets documented in routers (`draft/pending_manager/pending_hr/approved/changes_requested/rejected/filled/paused/cancelled`, `draft/pending_review/published/closed`, offer `draft/pending_approval/approved/rejected/sent/accepted/declined/expired`, email `queued/processing/sent/failed/skipped`) | PARTIAL — DB check constraints recommended |
| Timestamps | naive UTC via `datetime.utcnow()` (deprecated in Python 3.12+) | OPEN (P3) |
| Soft delete | not used; departments cannot be deactivated (S2-04) | OPEN |

## 4.3 Relationships

| Relationship | Cardinality | Status |
|---|---|---|
| users ↔ roles | M:N via `user_roles` | PASS |
| roles ↔ permissions | M:N via `role_permissions` (by code) | PASS |
| departments → job_titles | 1:N | PASS |
| requisitions → approval logs | 1:N append-only | PASS |
| requisitions → recruiter assignments | 1:N (primary + secondary) | PASS |
| requisitions → job postings | 1:N (required since S3-09 fix) | PASS |
| job postings → applications | 1:N | PASS |
| applications → stage history (`application_logs`) | 1:N | PASS — every transition now logged |
| interviews → interviewers | M:N | PASS |
| applications → evaluations | 1:N, one per evaluator (app-level) | PASS |
| offers → approval history | 1:N (`offer_approval_logs`, new) | PASS |
| offers → onboarding checklist | 1:N | PASS |
| email templates → delivery logs | by `template_code` (no FK) | PARTIAL |
| notifications → recipient | N:1 | PASS (new) |
| candidates (person) → applications | **no candidate entity** (applications keyed by email) | MISSING — blocks duplicate merge / talent pool (S5-01, S5-06) |

## 4.4 Transactions (atomicity)

| Operation | Before | After |
|---|---|---|
| Create user + roles | user commit, roles only via sync-on-read, audit in separate commit | user + `user_roles` in one commit (audit still separate helper — low risk) |
| Update roles | delete roles → **commit** → insert roles → commit (window with zero roles) | single commit |
| Lock account + revoke sessions | admin path did not revoke | single commit incl. `security_version` bump |
| Submit requisition + log + notification + audit | n/a | single commit |
| Approve requisition + history | single commit but no state guard | compare-and-set + log + audit + notifications in one commit; concurrent second decision → 409 |
| Move candidate stage + history | single commit, no guard | compare-and-set + log |
| Schedule interview | 2 commits | 1 commit |
| Create offer + checklist | 2 commits | offer + approval log + audit + notification in 1 commit; checklist created on acceptance |
| Refresh rotation | create new session + revoke old (no guard) | compare-and-set update in place |
| Excel import | per-row commit (intended: partial import AC S2-01) | unchanged — documented as intended |
| Permission matrix update + audit | matrix commit then audit commit | unchanged (P3) |

## 4.5 Concurrency & performance

- Compare-and-set (`UPDATE … WHERE id=? AND status=?` + rowcount check) prevents double approvals, double stage moves and double refreshes. Verified functionally on SQLite; **PostgreSQL row-level behaviour: CANNOT_VERIFY**.
- Unbounded queries: most list endpoints return all rows (requisitions, applications, offers, jobs). Email logs now capped at 500. Pagination exists only on admin user list → OPEN (P2).
- `access_scope.visible_applications` performs a few small queries per request; acceptable at current scale; consider caching assignment ids per request.
- Session validation writes `last_active_at` at most every 2 minutes (existing throttle) — PASS.

## 4.6 Migration safety

- `alembic upgrade head` verified on: empty SQLite DB, copy of `backend/recruitment.db` (17 users, 23 user_roles, 117 audit rows — all counts unchanged), copy of `recruitment_fallback.db`. Second run is a no-op. Originals byte-identical afterwards (SHA-256). See report 13.
- PostgreSQL compatibility: DDL types mapped per dialect (`TIMESTAMP`, `DOUBLE PRECISION`, `BOOLEAN DEFAULT FALSE`); `create_all(checkfirst=True)` is portable. Not executed on PostgreSQL → **CANNOT_VERIFY**.
- Downgrade of the baseline is intentionally a no-op; rollback = restore the pre-migration backup.
