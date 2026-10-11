# 08 — Frontend / Backend Integration Audit

Written for: the frontend and backend developers. Frontend: Next.js 16 / React 19, 52 `page.tsx` routes under `frontend/src/app`. Verification in this session: `tsc --noEmit` (0 errors) and ESLint; **no browser/E2E UI run** (no running stack) → UI behaviour is CANNOT_VERIFY beyond static checks.

## Executive summary

The shared API client could never refresh a session (no cookies sent cross-origin) and logout did not revoke the server session. 25 of 52 pages had no API integration; 12 of them were rewired in this session to real endpoints, with loading/empty/error states and server-confirmed updates. 13 business pages remain mocked, and menus are still driven by hardcoded role lists.

## Page inventory (data source)

| Group | Pages | API-backed before | After this session |
|---|---|---|---|
| Admin | dashboard, users, users/import, roles, permissions, master-data, audit-logs, profile | 8/8 (notification-settings: none) | unchanged |
| HR | requisitions | API | unchanged |
| HR | offers, onboarding, job-postings, approvals, candidates, interviews | **mock** | **API** |
| HR | dashboard | unauthenticated fetch + fake fallback | **API**, no fake fallback (trend chart still static) |
| HR | master-data/{departments, positions, competencies, headcount, lookups, approval-flows}, talent-pool, reports, automation/templates | mock | **mock (OPEN)** |
| HR | automation/email-templates, automation/email-logs | API | unchanged (now authenticated server-side) |
| Employee | notifications, notification-settings, referrals, referrals/new | mock / fake save | **API** |
| Employee | dashboard, jobs | mock | **mock (OPEN)** |
| Role workspaces | manager (6,129 lines), approver, interviewer, recruiter | mock (manager: 2 calls + `INITIAL_REQUISITIONS`) | **mock (OPEN)** |
| Public | landing, jobs, jobs/[id], process, faq, login, register, forgot-password | jobs/[id], register, forgot-password via API; landing/process are marketing content | unchanged |

## Contract fixes made

| Frontend | Backend | Issue | Fix |
|---|---|---|---|
| `api-client.ts` refresh | `POST /auth/refresh` (cookie) | no `credentials: "include"` → cookie never sent | added for all requests |
| `authService.logout()` | `POST /auth/logout` | never called | best-effort call with `keepalive` |
| error parsing | new envelope | read `error.code/message` too | done, `detail` still honoured |
| `offer.service.ts` | new offer workflow | only `PUT /status` existed | submit/decision/send/respond/onboarding |
| `requisition.service.ts` | new workflow | approve only | update/submit/close/assign, `changes_requested` |
| `job.service.ts` | `/jobs/admin-list`, publish, close | missing | added |
| `notification.service.ts` | `/notifications…` | did not exist | added |
| `UserItem.roles` type | `/auth/me` returns `[{code,name}]` | typed `string[]` | pages handle both shapes; type correction OPEN |
| public jobs list | `GET /jobs?status_filter=` | FE could request drafts publicly | backend now ignores status for the public list |

## Auth state & navigation

- `AuthProvider` calls `/auth/me` once per app load (shared promise), not per route change — PASS.
- Menus (`lib/menu-aggregator.ts`, `navigation/menu-config.ts`) are filtered by hardcoded role codes; multi-role union works, but permission-matrix changes are not reflected (F-037, OPEN). The backend enforces access regardless.
- Access token in `localStorage` (XSS-readable); refresh token only in an HttpOnly cookie — acceptable with the current CSP-less setup but recommend a CSP header.

## Remaining integration work

See report 09, work packages 1, 2 and 6 (manager page split + rewire, remaining mock pages, permission-driven menus) and add API contract tests generated from `/openapi.json`.
