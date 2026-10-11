# 16 — Final Project Readiness Summary

Written for: the team lead and Product Owner. State after remediation round 2 (2026-10-11). Nothing is committed.

| Item | Result |
|---|---|
| Endpoints reviewed | 173 API operations on 141 paths (99 after round 1, 75 at baseline) |
| Database tables | 42 mapped; migrations verified on fresh DB + copies of both dev DBs |
| Frontend pages | 56 routes; no remaining page with fabricated records or fake saves found by the round-2 scan |
| User stories analysed / fully verified | 76 / **22** (round 1: 8) |
| Acceptance criteria analysed / verified by tests | 243 / **147** (round 1: 64) |
| ACs still missing / partial | **4 / 12** (round 1: 89 / 41) |
| Findings | 55 (9 P0, 26 P1, 14 P2, 3 P3, 3 decision/verification) |
| Fixed | 42 fixed + 4 partial + 1 mitigated |
| Tests passed / failed / skipped | **136 / 0 / 0** (`reports/evidence/pytest_full_suite_round2.txt`) |
| Frontend checks | `tsc` 0 errors; ESLint 87 errors / 177 warnings (round-2 files clean) |
| Tests unable to run | PostgreSQL integration & concurrency, browser UI E2E, coverage, dependency scan |
| Security fixed this round | candidate could read panel feedback/scores on own interviews; staff could inspect/manage their own application; a logout path that did not revoke the server session; admin user list substituted sample accounts |
| Remaining security risks | leaked credential not yet revoked; secret in git history; DB files tracked; access token in localStorage; root-level scripts that reseed the configured DB (excluded from pytest) |
| Files changed | 93 modified, 1 deleted, 39 new source/test files (+ 23 report/evidence files) |
| Migrations added | `b7e4c1d9a0f2`, `c5a9e2f1d7b3` (both additive); `8f12a94519bc` made idempotent |

## Incident to be aware of

An ad-hoc command briefly altered the active dev DB `backend/recruitment.db` by adding tables and columns. No rows changed. It was restored byte-identically from a pristine copy and the checksum now matches. Details are in report 12.

## Required manual actions before deployment

1. Revoke/replace the exposed SMTP app password; keep secrets only in the untracked `.env`.
2. Set `SECRET_KEY`, `APP_ENV=production`, `ALLOW_SQLITE_FALLBACK=false`, `BACKEND_CORS_ORIGINS`, `FRONTEND_URL` (used for e-mail links), `FILE_STORAGE_DIR` (persistent volume) and the real `DATABASE_URL`; serve over HTTPS.
3. Back up the DB, run `alembic upgrade head`, verify `alembic_version = d4f7a2c8e1b6` (report 13).
4. Run one app instance (the background worker is in-process), or move the jobs to a dedicated runner.
5. Review and commit the working-tree changes (suggested grouping: report 12 steps), then add CI (pytest + tsc + lint + PostgreSQL service).
6. Browser smoke test against the running stack, at minimum:
   - Login per role.
   - HR requisitions: assign recruiter, close with active candidates.
   - Manager workspace: create, submit and copy a requisition.
   - Apply with a CV, then check the confirmation e-mail link, `/candidate/status` and `/candidate/withdraw`.
   - Interview invite: confirm via `/candidate/interview`.
   - Scorecard submit.
   - Offer, then `/candidate/offer`, then onboarding.
   - Notification bell in every shell.
   - Admin users: lock with the handover warning.
   - Email logs: retry.
   - Reports: Excel export.

**Verdict: not yet production-ready.** The blockers are operational (credential, PostgreSQL, browser verification) plus 4 missing ACs. See reports 11 and 15.
