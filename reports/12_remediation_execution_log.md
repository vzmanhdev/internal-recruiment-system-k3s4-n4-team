# 12 — Remediation Execution Log

Written for: the engineering team (code reviewers). Order of work followed P0 → P1 → P2. Each step: reproduce → regression test → fix → full suite. Nothing was committed; all changes are in the working tree of `feature/develop` for review.

| # | Step | Findings | Files | Verification |
|---|---|---|---|---|
| 1 | Replace exposed secrets in tracked example env (and align key names with real settings: `SMTP_APP_PASSWORD`, `SMTP_STARTTLS`) | F-001 | `backend/.env.example` | manual review; history exposure confirmed in `c96882d`, `2580c43` |
| 2 | Test isolation: shared `conftest.py`, temp DBs, SMTP disabled | F-032 | `tests/conftest.py`, 2 test files | full suite 38F → 41P/7F |
| 3 | Restore deleted password-reset routes from `4f30af6^` | F-010 | `api/v1/auth.py` | OTP tests 9/9 |
| 4 | Single session validator; legacy helpers delegate; `sid` mandatory; admin full-allow independent of seed | F-002, F-003 | `api/deps.py`, `api/v1/auth.py` | 9 failing repro tests → pass |
| 5 | Object-scope service | F-005 | `services/access_scope.py` (new) | — |
| 6 | Requisitions: permissions, scope, draft/submit/edit, request-changes, mandatory comments, CAS transitions, validated recruiter assignment, close/pause/cancel | F-019, F-020 | `api/v1/requisitions.py` | object-authorization tests |
| 7 | Applications: scope, publish/deadline check, duplicates, atomic counter, transitions, rejection reason, withdraw | F-005, F-022 | `api/v1/applications.py` | tests |
| 8 | Interviews: auth, scope, strict dates, no past, interviewer validation, conflict detection, one commit, assigned-only feedback | F-004, F-023 | `api/v1/interviews.py` | tests |
| 9 | Offers: approval workflow by salary band, send, candidate response, revision history, onboarding owners/due dates/progress | F-006 | `models/offer_onboarding.py`, `api/v1/offer_onboarding.py` | tests + E2E |
| 10 | Evaluations & referrals: assigned interviewer only, one per evaluator, required conclusion, hidden peers; referral validation | F-018 | `api/v1/referral_eval.py` | tests |
| 11 | Jobs: approved requisition required, HR review/publish, published_by/at, drafts hidden publicly, atomic view counter | F-021 | `models/job.py`, `api/v1/jobs.py` | tests |
| 12 | Analytics: auth + real aggregation only | F-009, F-024 | `api/v1/analytics.py` | test (zeros on empty DB) |
| 13 | Lifecycle test aligned with ACs | — | `tests/test_full_recruitment_lifecycle.py` | 2/2 |
| 14 | Regression suites | — | `tests/test_object_authorization.py`, `tests/test_session_enforcement.py` | 35/36 fail on HEAD |
| 15 | Admin: lock/reset revoke sessions, atomic validated role replacement | F-011, F-012 | `api/v1/admin.py` | tests |
| 16 | Platform: CORS allowlist, request-id middleware, uniform error envelope, no exception leak, IntegrityError → 409, readiness probe; gated dev bootstrap | F-013, F-014, F-030 | `main.py`, `core/config.py`, `db/bootstrap.py` (new) | tests |
| 17 | DB session: no silent fallback in production, masked URL, SQLite FK enforcement | F-029, F-033 | `db/session.py` | suite |
| 18 | Alembic: env uses configured URL, idempotent `8f12`, baseline `b7e4c1d9a0f2` | F-031 | `alembic/` | migration verification |
| 19 | Email: no secret logging, real status lifecycle, sensitive bodies not stored, authenticated router, no fake logs, bounded real retry, real-data preview | F-007, F-008, F-025 | `services/email_service.py`, `api/v1/email_automation.py`, `models/email_automation.py` | tests |
| 20 | Notifications: models, service, API, triggers in requisition/interview/offer/withdraw flows | F-026 | `models/notification.py`, `services/notification_service.py`, `api/v1/notifications.py` (new) | tests + E2E |
| 21 | Refresh: in-place CAS rotation, fixed absolute expiry, replay detection, secure path-scoped cookie | F-015 | `api/v1/auth.py`, `models/auth_session.py` | tests |
| 22 | Frontend API client: credentials, 401/403 policy, refresh retry, envelope parsing; logout revokes server session | F-016, F-017 | `lib/api-client.ts`, `features/auth/services/auth.service.ts` | tsc |
| 23 | Rewire 12 pages to real APIs (+ services) | F-024, F-027 | `app/hr/{offers,onboarding,job-postings,approvals,candidates,interviews,dashboard}`, `app/employee/{notifications,notification-settings,referrals,referrals/new}`, `services/*` | tsc 0 errors |
| 24 | Multi-actor E2E test | — | `tests/test_e2e_multi_actor_workflow.py` | pass |
| 25 | Enumeration fixes (login + reset), dummy bcrypt; tests aligned with ACs | F-035 | `api/v1/auth.py`, `services/password_reset_service.py`, 2 tests | tests |
| 26 | Profile protected fields | F-051 | `api/v1/auth.py` | test |

Change inventory: 47 tracked files modified, 13 new files (backend 11, frontend 1, plus `reports/`). Migrations added: 1 (`b7e4c1d9a0f2`); 1 existing revision made idempotent (`8f12a94519bc`).

Not done (needs approval or out of time): credential revocation, git history purge, untracking DB files, orphan-row cleanup, legacy-table mapping, 13 remaining mocked pages, features listed as MISSING in report 02.

---

## Round 2 — 2026-10-11 (approved plan, no git actions)

Same rules: nothing committed, no history rewrite, no destructive DB operation; every DB check ran on copies or temporary databases.

| # | Step | Findings / stories | Files | Verification |
|---|---|---|---|---|
| 27 | Master data: department head + deactivate, job-title bands (hidden from non-HR), competency frameworks (weights = 100), question bank, categories update/delete/reorder, headcount status, approval flows, onboarding templates, SLA rules, `/hr/people` directory | F-041, S2-04…S2-08, S3-01, S3-04 | `api/v1/hr.py`, `models/hr.py`, `models/master_data.py` (new) | `test_master_data_and_approval.py` (9) |
| 28 | Requisitions: dynamic approval chain snapshot, headcount 409 + override, out-of-band justification, copy, delete own unsubmitted draft, date-range/overdue filters, timeline metrics, recruiters on list rows | F-042, S2-10, S3-01…S3-08 | `api/v1/requisitions.py`, `models/requisition.py` | tests |
| 29 | Files: upload/download with magic-byte checks and scoped access; CV parsing (PDF/DOCX) | F-039, S2-03, S4-03, S4-04 | `api/v1/files.py`, `services/file_storage.py`, `services/cv_parser.py` (new) | `test_feature_completion.py` |
| 30 | Applications rewrite: tracking code, anti-spam, match score, notes/tags/rating, duplicates/merge/unmerge, export, bulk letters, manual add, saved filters, hiring decision, withdraw link | S4-03…S4-09, S5-01…S5-09, S6-01, S7-03, S7-09 | `api/v1/applications.py`, `models/application.py` | tests |
| 31 | Public candidate API + pages: status lookup, withdraw, interview confirm/reschedule, offer response (HMAC-stored single-use tokens) | S4-05, S4-06, S6-05, S7-06 | `api/v1/public.py`; FE `app/candidate/{status,withdraw,interview,offer}`, `components/candidate/CandidateFrame.tsx` | tests; payloads cross-checked against the router |
| 32 | Interviews rewrite: room + interviewer conflicts with override reason, bulk slots, reschedule/cancel (locked after evaluation), scorecard template, question suggestions, asked-question marking | S6-02…S6-07, S7-01, S7-02 | `api/v1/interviews.py` | tests |
| 33 | Evaluations: framework-based ratings, weighted score + snapshot, reopen within 24 h, summary, comparison | S6-07…S6-09, S7-03 | `api/v1/referral_eval.py`, `models/referral_eval.py` | tests |
| 34 | Offers: allowance, job-title band, letter preview, e-mail link response, department onboarding templates | S7-04…S7-08 | `api/v1/offer_onboarding.py`, `models/offer_onboarding.py` | tests |
| 35 | E-mail outbox + worker; default templates; posting expiry + SLA daily jobs; notification dedupe | F-044, S4-08, S5-10, S8-01, S8-02 | `services/email_dispatch.py`, `email_templates.py`, `scheduled_jobs.py` (new), `services/email_service.py`, `main.py` | tests |
| 36 | Reporting: trends, funnel, hiring metrics, sources, costs, HM dashboard, xlsx export | S8-05…S8-09 | `services/reporting.py` (new), `api/v1/analytics.py` | tests |
| 37 | Migration `c5a9e2f1d7b3` (additive) + bootstrap compat columns | — | `alembic/versions/c5a9e2f1d7b3_…py`, `db/bootstrap.py` | report 13 (copies + fresh) |
| 38 | Frontend rewiring of the remaining mocked pages: manager workspace, HR master data ×6, talent pool, reports, approver/interviewer/recruiter workspaces, employee dashboard/jobs, chart, apply modal (real CV upload), referral form (CV upload) | F-028 | `app/**`, `services/*`, `components/hr/MasterDataFrame.tsx`, `components/layout/RoleWorkspaceShell.tsx` | tsc 0 errors |
| 39 | Privacy / conflict-of-interest fixes found while wiring the employee dashboard | **F-052** | `api/v1/interviews.py`, `services/access_scope.py`, `api/v1/referral_eval.py`, `api/v1/applications.py` | 2 new tests (not executed against the pre-fix code; the leaked fields were confirmed by reading the previous implementation) |
| 40 | More mock/broken pages found by a scan for pages without API calls and for raw `localhost:8000` fetches: HR requisitions, email templates/logs, admin users (sample-account fallback), workspace, UnifiedAppShell logout, HRHeader, shell bells, jobs mapper, job benefits block, apply modal defaults, candidate hr_notes block, admin notification settings (fake save) | **F-053, F-054**, F-037 (partial), S1-08 AC4 (20 rows), S4-02 AC3, S4-03 AC1 | listed in report 09 | tsc 0 errors; lint clean on new files; 2 new backend tests |
| 41 | Test safety: `backend/pytest.ini` (`testpaths = tests`) so root-level manual scripts that reseed the configured DB are never collected | **F-055** | `backend/pytest.ini` (new) | collection = 136 tests under `tests/` |

### Incident during round 2 (recorded for transparency)

- **What:** at 16:11 an ad-hoc command that counted API endpoints imported `app.main` without overriding `DATABASE_URL`. Import runs the development schema bootstrap (`AUTO_CREATE_SCHEMA`, default on outside production), which **altered the active dev DB `backend/recruitment.db`**: 21 new empty tables and new nullable columns on 11 tables.
- **Impact:** additive only — a row-by-row comparison against a pristine copy showed **0 changed rows** in every pre-existing table. It is the same change the dev server makes on its first start with this code.
- **Detection:** the SHA-256 check that wraps every test run reported `recruitment.db: FAILED`.
- **Recovery:** no process held the file (no Python/uvicorn running, no WAL/journal, last write = incident time). The modified file was kept as evidence in the session scratchpad and the pristine copy (taken earlier in this session, SHA-256 `9ffbf293…ac838`) was restored; `sha256sum -c` → `OK`.
- **Prevention:** every later import of `app.*` set `DATABASE_URL` to a scratch file and `AUTO_CREATE_SCHEMA=false`; all test runs are wrapped in before/after checksums.

### Environment note

Drive C: had **0.21 GB free**. One test run failed with `sqlite3.OperationalError: database or disk is full` in the temp directory. Final runs set `TEMP`/`TMP` to `backend/.pytest_cache/tmp` (git-ignored, removed after each run). Nothing outside the session's own files was deleted.

Change inventory after round 2: **93** tracked files modified, **1** deleted (`services/email.py`), **39** new source/test files (+ `reports/`). Migrations added: `b7e4c1d9a0f2`, `c5a9e2f1d7b3`; `8f12a94519bc` made idempotent.

---

## Round 3 — login throttling per browser session (2026-10-11, user request)

| # | Step | Files | Verification |
|---|---|---|---|
| 42 | S1-01 AC3 re-specified by the user: 5 consecutive wrong passwords lock **the browser session** (HttpOnly cookie `ats_login_client`) for 15 minutes — **the account is never locked**, so a new/incognito browser can still sign in. Failures on unknown e-mails count too (no enumeration). Fallback ceiling of 20 failures / 15 min per IP + e-mail for clients that drop cookies. Locked responses are HTTP 429 with `Retry-After`. Audit action `LOGIN_SESSION_THROTTLED`. `users.failed_login_attempts/locked_until` kept but no longer used. | `models/login_guard.py`, `services/login_guard.py` (new), `api/v1/auth.py`, `alembic/versions/d4f7a2c8e1b6_login_attempt_guards.py` (new, additive) | 3 new tests + 2 updated (400 → 429); full suite **139 passed** (`evidence/pytest_full_suite_round3_login_guard.txt`); live check against the running dev server: browser A → 400 ×4, 429 on the 5th; a fresh client → normal 400 (not locked) |
| 43 | Test temp files moved from the C: system temp dir to `backend/.pytest_cache/ats_tmp` (drive D:, git-ignored; old run dirs cleaned on start); `pytest.ini` pins `cache_dir` and `--basetemp` inside the project. 44 MB of old `ats_tests_*` dirs from earlier runs removed from C:. | `tests/conftest.py`, `backend/pytest.ini` | suite run without any TEMP override |
| 44 | Migration `d4f7a2c8e1b6` verified on a fresh DB and a copy of the dev DB (head reached, table present, users 17 → 17). | — | — |

Note: during this round the developer's own dev servers were running (`uvicorn --reload`, `next dev`), so `backend/recruitment.db` changes legitimately; the dev-DB checksum wrap was therefore not used for this run (tests use their own DB via `conftest.py`).
