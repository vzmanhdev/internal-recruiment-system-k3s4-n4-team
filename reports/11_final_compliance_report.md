# 11 — Final Compliance Report

Written for: the Product Owner, team lead and reviewers. Snapshot of the working tree after remediation round 2 (2026-10-11; uncommitted, branch `feature/develop`, base `4f30af6`). Round-1 values are shown for comparison.

## Headline numbers

| Metric | Round 1 | Round 2 | Source |
|---|---|---|---|
| API operations (OpenAPI) | 99 (75 at HEAD) | **173** on 141 paths | app OpenAPI |
| Mapped database tables | 31 (+11 unmapped legacy) | **42** (legacy master-data tables now mapped; `salary_bands` and other legacy tables still unmapped) | models / report 13 |
| Frontend `page.tsx` routes | 52 (13 still mocked) | **56** (4 new public candidate pages); no page found with fabricated records or fake saves (scan in report 12, step 40) | report 08 / 12 |
| Stories / ACs analysed | 76 / 243 | 76 / 243 | report 02 |
| ACs verified by automated tests | 64 (26 %) | **147 (60 %)** | report 02 |
| ACs implemented-unverified / partial / missing | 49 / 41 / 89 | **80 / 12 / 4** | report 02 |
| Stories VERIFIED / IMPL-UNVERIFIED / PARTIAL / MISSING | 8 / 9 / 41 / 18 | **22 / 41 / 12 / 1** | report 02 |
| Findings | 51 | **55** (4 new: F-052 privacy, F-053 more mock UI, F-054 logout, F-055 test safety) | report 09 |
| Fixed | 31 (+3 partial) | **42** (+4 partial, 1 mitigated) | report 09 |
| Backend tests | 101 passed | **136 passed, 0 failed, 0 skipped** | report 10 |
| Frontend | tsc 0 errors; ESLint 91 errors | tsc 0 errors; ESLint **87** errors / 177 warnings | report 10 |
| Tests unable to run | PostgreSQL, browser E2E, coverage, dependency scan | unchanged — CANNOT_VERIFY | report 10 |

"Verified" means an automated test calls the real API and asserts persisted rows in a SQLite database. "Implemented-unverified" ACs have code that was inspected but no test — most of them are frontend behaviour that needs a browser run.

## Compliance by epic (share of ACs verified by tests)

| Epic | ACs | Verified | Impl. unverified | Partial | Missing | Verified % |
|---|---|---|---|---|---|---|
| EP-01 Accounts, RBAC | 39 | 19 | 17 | 3 | 0 | 49 % |
| EP-02 Master data | 16 | 8 | 8 | 0 | 0 | 50 % |
| EP-03 Requisitions & approval | 28 | 20 | 7 | 1 | 0 | 71 % |
| EP-04 Postings & portal | 34 | 18 | 13 | 0 | 3 | 53 % |
| EP-05 Candidate pipeline | 33 | 18 | 8 | 6 | 1 | 55 % |
| EP-06 Interviews & evaluation | 39 | 32 | 7 | 0 | 0 | 82 % |
| EP-07 Offer & onboarding | 18 | 13 | 4 | 1 | 0 | 72 % |
| EP-08 E-mail & notifications | 19 | 12 | 6 | 1 | 0 | 63 % |
| EP-09 Reporting | 17 | 7 | 10 | 0 | 0 | 41 % |

The 4 missing ACs: S2-09 company profile (×2), S3-10 public-style preview before publishing, S5-02 drag-and-drop kanban.

## Status by quality dimension

| Dimension | Status |
|---|---|
| Security vulnerabilities | all P0 fixed in code; round 2 fixed a candidate-privacy leak and a conflict-of-interest gap (F-052); **credential revocation + history purge still pending (manual)** |
| Authentication / sessions | compliant on SQLite tests; every shell's logout now revokes the server session |
| Authorization | DB-driven RBAC + object scope on all routers; nobody manages their own application; menus permission-driven only in `UnifiedAppShell` |
| Database consistency | migrations `b7e4c1d9a0f2` + `c5a9e2f1d7b3` verified on fresh + dev copies (row counts unchanged); PostgreSQL CANNOT_VERIFY |
| Real CRUD persistence | backend writes verified for all workflows A–G; frontend pages read and write real APIs (not browser-tested) |
| E-mail & notifications | transactional outbox + worker, truthful statuses, automatic business e-mails, real unread counts in every shell |
| Files | validated upload/download with scoped access |
| HTTP errors | uniform Vietnamese envelope with codes and request ids |
| End-to-end workflows | A–G pass at API level; UI E2E CANNOT_VERIFY |

## Production readiness verdict

**Not production-ready yet**, for reasons that are now mostly outside the code:

1. The leaked SMTP credential must be revoked, and the git history needs a decision.
2. PostgreSQL behaviour (migrations, concurrency) has not been executed.
3. No page has been exercised in a browser against the running stack.
4. 4 ACs are missing and 12 are partial (report 15).

63 of 76 stories have every AC implemented (22 of them fully verified by tests); the backend changes are covered by the 136-test suite.
