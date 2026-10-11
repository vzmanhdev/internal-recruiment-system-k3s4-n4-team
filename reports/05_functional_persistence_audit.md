# 05 — Functional CRUD & Save Persistence Audit

Written for: the engineering team. A Save is counted as working only when an automated test calls the real API and then reads the database with an **independent session** (and/or re-reads through the API). Toasts and HTTP 200 alone are not evidence. Test files: `backend/tests/` (101 passing). FE pages were typechecked (0 TS errors) but **not exercised in a browser** in this session → FE columns marked accordingly.

## Executive summary

Before remediation many write paths "worked" only in the UI: 12 pages showed hardcoded records or fake saves (`setTimeout(() => success)`), analytics returned fabricated numbers, email retry reported `sent` without sending, and several backend writes accepted invalid state (applications to unpublished jobs, interviews at "now" when the date was invalid, offers accepted by anyone). All of the backend writes below are now verified against a real database; 13 FE pages remain mocked (F-028).

## 5.1 Verification matrix (backend persistence)

| Feature | UI action (page) | API | Permission | DB operation | Commit | Re-read verified | Result |
|---|---|---|---|---|---|---|---|
| Create user + roles | admin/users | `POST /admin/users` | Admin | insert users + user_roles | 1 | ✔ (`user_roles` count, E2E) | VERIFIED |
| Update roles | admin/users | `PUT /admin/users/{id}/roles` | Admin | replace user_roles | 1 | ✔ next-request access change | VERIFIED |
| Lock / unlock | admin/users | `POST /admin/users/{id}/lock|unlock` | Admin | users + auth_sessions | 1 | ✔ sessions revoked, stay revoked | VERIFIED |
| Admin reset password | admin/users | `POST /admin/users/{id}/reset-password` | Admin | users + auth_sessions | 1 | ✔ old token 401 | VERIFIED |
| Profile update | employee/admin profile | `PUT /auth/me` | self | users | 1 | ✔ protected fields unchanged | VERIFIED |
| Permission matrix | admin/permissions | `PUT /admin/permissions/matrix` | Admin | role_permissions | 1 (+audit) | ✔ existing tests | VERIFIED |
| Department create/update | admin/master-data (API) · hr/master-data/departments (**mock**) | `/hr/departments` | HR Manager | departments | 1 | existing E2E only | IMPLEMENTED—UNVERIFIED |
| Requisition draft / edit / submit | manager (**mock**), hr/requisitions | `POST /requisitions`, `PUT`, `POST …/submit` | requisition:create/edit | requisitions + logs + audit + notifications | 1 | ✔ | VERIFIED |
| Approve / reject / request changes | hr/approvals (**rewired**) | `POST /requisitions/{id}/approve` | step-based | CAS status + log + audit + notif. | 1 | ✔ history order | VERIFIED |
| Assign recruiter | — (no UI) | `POST …/assign-recruiters` | HR Manager | recruiter_assignments + log | 1 | ✔ | VERIFIED |
| Close / pause / cancel | — (no UI) | `POST …/close` | HR Manager | requisition + postings closed | 1 | ✔ postings closed | VERIFIED |
| Job posting create | hr/job-postings (**rewired**) | `POST /jobs` | Recruiter/HR | job_postings | 1 | ✔ pending_review | VERIFIED |
| Publish / close posting | hr/job-postings | `POST /jobs/{id}/publish|close` | HR Manager / staff | status + published_by/at | 1 | ✔ public list | VERIFIED |
| Apply | jobs/[id], ApplyJobModal | `POST /applications` | public | applications + atomic counter | 1 | ✔ duplicates blocked | VERIFIED |
| Stage move / reject | hr/candidates (**rewired**) | `PUT /applications/{id}/status` | candidate:evaluate + scope | CAS status + log | 1 | ✔ logs | VERIFIED |
| Withdraw | — (no UI) | `POST /applications/{id}/withdraw` | owner | status + log + notification | 1 | — | IMPLEMENTED—UNVERIFIED |
| Schedule interview | — (no create UI; hr/interviews list rewired) | `POST /interviews` | interview:schedule + scope | interview + interviewers + log + notif. | 1 | ✔ | VERIFIED |
| Interview feedback | interviewer (**mock**) | `PUT /interviews/{id}/feedback` | assigned interviewer | interview | 1 | ✔ 403 for others | VERIFIED |
| Evaluation | interviewer (**mock**) | `POST /referrals/evaluations` | interview:evaluate + assigned | candidate_evaluations | 1 | ✔ count = 1 | VERIFIED |
| Offer create / decide / send / respond | hr/offers (**rewired**) | `/offers…` | offer:create, HR/Approver, candidate | offers + approval logs + audit + notif. | 1 each | ✔ status & history | VERIFIED |
| Onboarding item | hr/onboarding (**rewired**) | `PUT /offers/{id}/onboarding/{item}` | HR / owner | checklist + app status | 1 | ✔ 100% → onboarded | VERIFIED |
| Referral create / list | employee/referrals (**rewired**, was fake save) | `/referrals` | authenticated | internal_referrals | 1 | duplicate check implemented, not tested | IMPLEMENTED—UNVERIFIED |
| Email template CRUD / preview | hr/automation/email-templates (API) | `/email-automation/templates…` | HR/Recruiter | templates + audit | 1 | auth tested; CRUD not | IMPLEMENTED—UNVERIFIED |
| Email retry | hr/automation/email-logs (API) | `POST /email-automation/logs/{id}/retry` | HR/Recruiter | log status, attempts | 1 | ✔ real `failed`, bounded | VERIFIED |
| Notifications read / read-all | employee/notifications (**rewired**) | `/notifications…` | recipient | notifications | 1 | ✔ | VERIFIED |
| Notification preferences | employee/notification-settings (**rewired**, was fake save) | `PUT /notifications/preferences` | self | notification_preferences | 1 | ✔ | VERIFIED |
| Analytics | hr/dashboard (**rewired**, was fake fallback) | `GET /analytics/overview` | HR/Approver | read | — | ✔ zero data = zeros | VERIFIED |
| User Excel import | admin/users/import | `POST /admin/users/import` | Admin | per-row insert (partial import by design) | per row | not tested | IMPLEMENTED—UNVERIFIED |

## 5.2 Functional defects found (fake Save / fake data)

| Location | Defect | Status |
|---|---|---|
| `employee/referrals/new` | `setTimeout(() => setSuccessMsg(true))` — no API call; hardcoded job options | FIXED (F-027) |
| `employee/notification-settings` | Save showed a toast only | FIXED |
| `employee/notifications`, `employee/referrals` | static arrays | FIXED |
| `hr/offers`, `hr/onboarding`, `hr/job-postings`, `hr/approvals`, `hr/candidates`, `hr/interviews` | static arrays; actions changed local state only | FIXED |
| `hr/dashboard` | unauthenticated `fetch`, hardcoded `fallbackData`, funnel `|| 24` fallbacks | FIXED (trend chart still static) |
| Backend analytics | `or 8` fabricated KPIs, hardcoded lists | FIXED (F-024) |
| Backend email retry | `status = "sent"` without sending | FIXED (F-025) |
| Backend email seed | fake "sent" log rows inserted on first read | FIXED |
| `manager/page.tsx`, `hr/master-data/*` (6), `hr/talent-pool`, `hr/reports`, `hr/automation/templates`, `approver`, `interviewer`, `recruiter`, `employee/dashboard`, `employee/jobs` | still hardcoded / no API | **OPEN (F-028)** |

## 5.3 Delete / deactivate

No hard deletes exist for business entities except email templates (HR Manager only, audited). Department deactivation (S2-04) and soft-delete strategies are not implemented (OPEN).
