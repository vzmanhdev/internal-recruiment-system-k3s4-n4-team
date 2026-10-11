# 15 — Remaining Risks & Blockers

Written for: the team lead and Product Owner. Updated after remediation round 2 (2026-10-11). Nothing has been committed; all changes are in the working tree of `feature/develop`.

## Blockers needing an owner action or approval

| # | Item | Why blocked | Owner |
|---|---|---|---|
| B1 | Revoke the Gmail app password that was committed (F-001) | external account action — **not done**, cannot be done from the repository | owner of that Gmail account |
| B2 | Purge the secret from git history (`c96882d`, `2580c43`) + force-push | history rewrite needs explicit approval; affects every clone | team lead |
| B3 | Untrack the `*.db` files (contain password hashes and sessions) | changes the next commit; git actions are on hold | team lead |
| B4 | PostgreSQL verification (migrations `b7e4c1d9a0f2` + `c5a9e2f1d7b3`, concurrency, row locks) | no authorised PostgreSQL access — provide a disposable DSN or a CI service | DevOps |
| B5 | Product decisions: OTP CR (S1-03), self-approval (S3-02), offer revision model (S7-07), staff recording candidate responses, rate-limit thresholds (PO-14), salary visibility for HM/Approver, conflict-of-interest rule (nobody — HR included — manages their own application, F-052) | business rules | Product Owner |
| B6 | Legacy data: copy `salary_bands` (7 rows) into `job_titles` bands; clean 12 orphan `user_roles` rows in `recruitment_fallback.db` | data change | team lead + PO |
| B7 | Remove or relocate `backend/test_admin_features.py` and `backend/test_auth_flow.py` (they reseed / delete users on the configured DB; F-055 — mitigated by `pytest.ini`) | file deletion needs approval | team lead |
| B8 | Free disk space on drive C: (0.21 GB free during this session) | tests/temp files fail with "disk full"; outside the project | machine owner |

## Missing or partial functionality (from report 02)

| Story | Gap |
|---|---|
| S2-09 | Company profile / branding page — not implemented (2 ACs) |
| S3-10 AC2 | Public-style preview before publishing a posting |
| S5-02 | Kanban board with drag-and-drop and per-column counts (API `/applications/pipeline-summary` exists; HR candidates page is a table) |
| S5-01 AC2 | Side-by-side comparison UI before merging duplicates (API exists) |
| S3-04 AC1 | Salary budget per department (only headcount is modelled) |
| S5-04 AC1 | Tags are free-form, not bound to the tag catalogue |
| S5-09 AC1 | Degree is not a mandatory-criterion type (years + skills only) |
| S2-03 AC2 | Server-side square thumbnail (crop happens in the browser) |
| S4-09 AC1 | Embedded CV viewer (CV opens through the protected download) |
| S7-07 AC2 | Revised offer is versioned in place (no separate "Đã thay thế" row) — PO decision |
| S8-03 AC4 | Notifications are written synchronously inside the business transaction |
| S1-06 AC1 | Legacy Employee/HR/Admin shells still filter menus by role; only `UnifiedAppShell` uses permissions |
| S1-02 AC3 | Expired-session redirect shows no explicit message |

## Remaining risks (technical)

| Risk | Impact | Mitigation |
|---|---|---|
| No browser run of any page (UI E2E CANNOT_VERIFY) | integration regressions in the ~30 rewired pages, the 4 new candidate pages and the shells are possible | manual smoke test with the running stack before merge (list in report 16) |
| `manager/page.tsx` is still one ~5,200-line component | hard to review/maintain | split per tab |
| In-process background worker (outbox, posting expiry, SLA) | runs once per app process; several instances would duplicate jobs | single instance, or move to a job runner with a DB lock |
| Legacy `users.role` fallback (F-036) | authorization could derive from the legacy string for users without role rows | run report 13 step 4, then remove the fallback |
| Unbounded list endpoints (most lists; admin users and email logs are bounded) | performance as data grows | add pagination |
| Access token in localStorage | XSS would expose it | CSP; consider an in-memory token |
| No CI (`.github/workflows` empty) | regressions undetected | pytest + tsc + lint + PostgreSQL service job |
| Frontend lint debt: 87 errors / 177 warnings (F-046) | maintainability | fix incrementally; new round-2 files are clean |
| `xlsx@0.18.5` advisories; `>=` Python ranges; unused `passlib` (F-049/F-050) | supply chain | pin, replace, run `npm audit` / `pip-audit` |
| SMTP never exercised against a real server in tests | real deliverability unknown | send to a test inbox after B1 |
