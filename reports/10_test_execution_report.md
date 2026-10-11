# 10 — Test Execution Report

Written for: the engineering team / QA.

## Environment

- Python 3.14.3 in `backend/venv` (FastAPI 0.142.2, SQLAlchemy 2.1.1, pytest 9.1.1); Node 24.14 for the frontend.
- Every test uses its own SQLite database (in-memory or a temp file). `tests/conftest.py` points the app at a temporary DB **before** import and blanks SMTP settings, so tests never touch `backend/recruitment.db` or send email. Verified: dev DB modification times identical before/after the final run.
- PostgreSQL: **not available to this session → all PostgreSQL integration/concurrency tests CANNOT_VERIFY.**
- Browser / UI E2E: no running stack → **CANNOT_VERIFY**.

## Baseline (before remediation, commit 4f30af6)

| Run | Result |
|---|---|
| Full suite `pytest tests` | **10 passed, 38 failed** |
| Each file in isolation | 41 passed, 7 failed (all in `test_password_reset_otp.py`) |

Root causes: (1) every test module set `app.dependency_overrides[get_db]` at import — the last imported module's DB won for all tests; (2) the password-reset routes had been deleted from `auth.py` (HTTP 404), see F-010.

## Round 2 run (2026-10-11, current working tree)

`cd backend && venv/Scripts/python.exe -m pytest -v -p no:warnings` (collection limited to `tests/` by the new `backend/pytest.ini`) → **136 passed, 0 failed, 0 skipped, 0 errors** (252 s). Full output, wrapped in before/after SHA-256 checks of the three dev DB files (all `OK`): `reports/evidence/pytest_full_suite_round2.txt`.

Environment note: drive C: had 0.21 GB free; one intermediate run hit `database or disk is full` in the temp dir, so the final runs used `TEMP=backend/.pytest_cache/tmp` (git-ignored, deleted afterwards).

| File | Tests | Covers |
|---|---|---|
| test_health.py | 1 | liveness |
| test_security_layer.py | 13 | sessions, refresh rotation/replay, absolute expiry, lockout, enumeration, device A/B, protected profile fields |
| test_session_enforcement.py | 17 | session revocation on legacy-guarded routes, sid mandatory, 401 vs 403, admin lock/reset, role changes, CORS, no exception leak, error envelope, lock handover warning + role filter on `user_roles` |
| test_object_authorization.py | 24 | object scope, workflow guards, validations, publication rules, analytics without fake data; round 2: candidate never sees panel feedback/evaluations, no one manages their own application, recruiters on requisition rows, real openings on postings |
| test_master_data_and_approval.py (round 2) | 9 | salary band visibility, framework weights = 100 + question bank, department/category delete protection, out-of-band justification, headcount block + override, dynamic approval chain + snapshot, copy, draft deletion |
| test_feature_completion.py (round 2) | 21 | uploads + CV access, avatar validation, tracking code + outbox e-mail, public status/withdraw links, anti-spam, expired postings, notes/tags/profile, duplicates merge/undo, stage rules + talent pool, export, bulk letters, manual add + saved filters, invitation link + room conflict + reschedule, bulk scheduling, scorecards/reopen/compare, hiring decision, offer link + onboarding template, SLA reminders, reports |
| test_email_notifications.py | 11 | e-mail auth, real delivery status, bounded retry, no secret logging, notification privacy/persistence, mandatory preferences |
| test_e2e_multi_actor_workflow.py | 1 | Workflows A–D across 7 real accounts with DB assertions |
| test_full_recruitment_lifecycle.py | 2 | single-admin lifecycle (uploads a real PDF CV; AC-compliant offer flow) |
| test_password_reset_otp.py | 9 | OTP reset |
| test_multi_role_rbac.py / test_rbac_permissions.py / integration/test_rbac_integration.py | 4 / 3 / 21 | RBAC union, matrix, admin immutability, lockout |

Round 1 for comparison: 101 passed (`reports/evidence/pytest_final_full_suite.txt`).

## Proof that the new tests detect the original defects

Round 1: the new regression tests were executed against the untouched HEAD code (`git archive HEAD`): `test_object_authorization.py` + `test_session_enforcement.py` → **35 failed, 1 passed**; `test_email_notifications.py` and `test_e2e_multi_actor_workflow.py` cannot even be imported (`No module named 'app.models.notification'`). Evidence: `reports/evidence/regression_tests_against_original_HEAD.txt`. Round 2's new tests (master data, feature completion, privacy) were **not** re-run against HEAD — most of them call endpoints that do not exist there, so they would fail at the routing level rather than prove a specific defect.

## Changes to existing tests (and why)

| Test | Change | Reason |
|---|---|---|
| all modules | DB isolation via `conftest.py`; file DBs moved to a temp dir | harness defect (tests clobbered each other and wrote tracked repo files) |
| RBAC tests minting tokens | `create_access_token(...)` → `session_token(db, user)` (real `AuthSession`) | session-less tokens are now rejected (F-003); assertions unchanged |
| test_full_recruitment_lifecycle | interview date computed in the future; offer accepted only after approval + send; extra asserts (early accept → 409, onboarding items, hired) | old test encoded defects contradicting S6-02 and S7-04/05 |
| test_password_reset_otp::test_email_existence_check | unknown email must return the same 202 response | AC S1-03 #3 forbids revealing account existence |
| integration lockout test | asserts the generic message instead of "Còn N lần thử" | AC S1-01 #2 |

No assertion was weakened to hide a defect; in each case the expectation was aligned with an explicit acceptance criterion.

## Other checks

| Check | Result |
|---|---|
| `alembic upgrade head` (→ `c5a9e2f1d7b3`) on a fresh DB + copies of both dev DBs | PASS, idempotent, row counts preserved, originals unchanged (`evidence/migration_verification_c5a9e2f1d7b3.txt`) |
| Frontend `tsc --noEmit` | 0 errors |
| Frontend ESLint (`src`) | **87 errors / 177 warnings** (round 1: 91 / 306); files created in round 2 are lint-clean (`evidence/frontend_checks_round2.txt`) |
| Browser / UI E2E | CANNOT_VERIFY (no running stack in this session) |
| PostgreSQL | CANNOT_VERIFY (no authorised access) |
| Coverage measurement | not installed (`pytest-cov` absent; nothing installed into the project venv) → CANNOT_VERIFY |
| Dependency vulnerability scan | not run → CANNOT_VERIFY |
