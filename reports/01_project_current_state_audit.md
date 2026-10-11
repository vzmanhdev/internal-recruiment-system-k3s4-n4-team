# 01 — Project Current-State Audit

Written for: the project team and Product Owner. Repository `D:/TTCS_CODE_GYM/internal-recruiment-system-k3s4-n4-team`, branch `feature/develop`, baseline commit `4f30af6`. Uncommitted developer changes present at the start (4 tracked `*.db` files) were preserved untouched.

## Recovery of the earlier audit workflow

The background audit workflow `wf_8738b21c-506` **FAILED**: all 73 agents stopped on the account session limit and returned no results (journal: 0 result records); only a few probe scripts were left in the temporary scratchpad. Nothing was recoverable as findings, so this audit was performed directly, and its deliverables are in `reports/` (not in temporary folders).

## Actual architecture (as found)

| Aspect | Claimed | Actual |
|---|---|---|
| Backend | FastAPI + SQLAlchemy | FastAPI 0.142, SQLAlchemy 2.1, 11 routers, **75 endpoints** at HEAD (99 after remediation) |
| Database | PostgreSQL in production, SQLite locally | `backend/.env` uses SQLite `./recruitment.db`; any PostgreSQL connection failure silently fell back to SQLite in **all** environments |
| Schema management | Alembic | import-time `create_all` + raw `ALTER TABLE`; Alembic revisions empty/broken; no DB versioned |
| AuthN | JWT + refresh + server sessions | present, but admin/HR routers bypassed session checks; refresh created a new session per call |
| AuthZ | multi-role RBAC + permission matrix | present (`users → user_roles → roles → role_permissions`); most recruitment routers had **no object-level scope** and several had **no auth** |
| Frontend | Next.js + real APIs | Next.js 16 / React 19; 25 of 52 pages had no API calls (hardcoded data) |
| Email | SMTP automation | SMTP helpers on threads that always reported success; logs seeded with fake rows |
| Notifications | in-app | did not exist |
| Tests | pytest | 48 tests; full run 10 passed / 38 failed (isolation bug); per-file 41/7 |

## Module inventory (after remediation)

| Router | Prefix | Endpoints | Responsibility |
|---|---|---|---|
| auth.py | /api/v1/auth | 20 | register, login, refresh, logout(-all/-others), sessions, change password, OTP reset (restored), me, legacy user admin |
| admin.py | /api/v1/admin | 13 | users CRUD/roles/lock/reset, Excel import/template, stats, audit logs, permission matrix |
| hr.py | /api/v1/hr | 12 | departments, job titles, competencies, shared categories, headcount (read), approval flows (read) |
| requisitions.py | /api/v1/requisitions | 9 | draft/submit/approve/request-changes/assign/override/close |
| jobs.py | /api/v1/jobs | 7 | public portal, staff list, create/update, publish, close |
| applications.py | /api/v1/applications | 5 | apply, scoped list/detail, stage move, withdraw |
| interviews.py | /api/v1/interviews | 3 | scoped list, schedule (conflicts), feedback |
| offer_onboarding.py | /api/v1/offers | 10 | offer workflow + onboarding checklist |
| referral_eval.py | /api/v1/referrals | 4 | referrals, evaluations |
| analytics.py | /api/v1/analytics | 1 | HR dashboard aggregation |
| email_automation.py | /api/v1/email-automation | 7 | templates, preview, logs, retry |
| notifications.py (new) | /api/v1/notifications | 6 | list, unread count, read, read-all, preferences |
| main.py | /health, /health/ready | 2 | liveness, readiness |

Entities: **31 mapped tables**; the dev DB additionally holds 11 unmapped legacy tables, some containing master data (report 04).

## Capability classification (Product Backlog, 76 stories / 243 ACs — details in report 02)

| Story status | Stories |
|---|---|
| VERIFIED | 8 |
| IMPLEMENTED BUT UNVERIFIED | 9 |
| PARTIALLY IMPLEMENTED | 41 |
| MISSING | 18 |

AC level: 64 verified by automated tests · 49 implemented-unverified · 41 partial · 89 missing.

## Notable code-level observations

- Duplicated authorization logic: three styles coexisted (legacy `require_roles` helpers, `require_permission` dependency, inline role checks). Session validation is now centralised (`authenticate_bearer`) and object scope in `services/access_scope.py`; permission-code vs role checks are still mixed.
- Legacy paths: `users.role` comma string (fallback), `services/email.py` (dead, broken), legacy `/auth/users*` admin endpoints duplicating `/admin/users*`.
- Hardcoded production data: analytics fallbacks, email log seed, 25 mocked pages (13 still open — F-028).
- Root-level `backend/test_admin_features.py` and `backend/test_auth_flow.py` are manual scripts outside the pytest suite (not run).
- `.github/workflows/` is empty — no CI.
