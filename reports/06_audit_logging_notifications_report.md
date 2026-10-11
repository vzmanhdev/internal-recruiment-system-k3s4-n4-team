# 06 — Audit Logging, Notifications & Email Processing

Written for: the engineering team.

## Executive summary

Audit rows existed for login and some admin actions; most recruitment decisions were not audited. OTPs and passwords were written to stdout/INFO logs in every environment. Notifications did not exist. Email delivery always "succeeded". After remediation: recruitment decisions are audited inside their business transaction, secrets are never logged outside a local dev machine without SMTP, notifications are persisted with recipient privacy and preferences, and email status reflects the real outcome.

## 7.1 Audit log coverage

| Action | Audit row | Where | Verified |
|---|---|---|---|
| Login success | `LOGIN_SUCCESS` | auth.py | ✔ E2E |
| Login failure / lockout | lockout email + counter; no audit row for each failure | auth.py | — (OPEN P3) |
| User create / roles / lock / unlock / admin reset | `CREATE_USER`, `UPDATE_ROLES`, `LOCK_ACCOUNT`, `UNLOCK_ACCOUNT`, `ADMIN_RESET_PASSWORD` | admin.py (separate commit helper) | ✔ CREATE_USER in E2E |
| Permission matrix | `UPDATE_RBAC_MATRIX` / `BATCH_UPDATE_RBAC_MATRIX` | admin.py | existing tests |
| Profile update | `UPDATE_PROFILE` | auth.py | — |
| Requisition create / update / submit / decision / assign / override / close | `REQUISITION_*` (same transaction) | requisitions.py | ✔ E2E |
| Offer submit / decision / send / response / revise | `OFFER_*` (same transaction) | offer_onboarding.py | ✔ E2E |
| Email template create / update / delete, email retry | `EMAIL_TEMPLATE_*`, `EMAIL_RETRY` | email_automation.py | — |
| Candidate stage change | `application_logs` (stage history, actor, time) — not `audit_logs` | applications.py | ✔ |
| Job publish | `published_by_id` / `published_at` on the posting — no audit row | jobs.py | ✔ fields |

Audit payloads contain status transitions and ids only — no passwords, hashes, tokens or OTPs. `request_id` and `session_id` are **not yet stored** in audit rows (request id is in the access log line and error bodies) → OPEN P2. Audit logs are readable by Admin only (`/admin/audit-logs`).

## 7.2 Operational logging

- New middleware logs `request_id`, method, path, status, duration for every request and returns `X-Request-ID`.
- Unhandled exceptions are logged with stack trace server-side and returned as a generic Vietnamese 500 with `request_id`.
- `print()` usage: removed from email helpers except the dev-only echo (`APP_ENV=development` **and** SMTP unconfigured).
- DB URL is logged with the password masked.

## 7.3 Notifications (new)

Business event → `notify()` adds rows in the **same transaction** → `GET /notifications` (recipient only) → `POST /{id}/read`, `/read-all` → persisted.

| Trigger | Recipients |
|---|---|
| Requisition waiting at step 1 / step 2 | users with role `approver` / `hr_manager` (excluding the actor) |
| Requisition decision | requisition creator |
| Recruiter assigned | that recruiter |
| Interview scheduled | every assigned interviewer |
| Offer waiting for approval (HR level / Approver level) | `hr_manager` / `approver` |
| Candidate responded to offer | offer creator |
| Candidate withdrew | recruiters assigned to the requisition |

Preferences: per type, in-app and email flags; mandatory types (`approval_pending`, `recruiter_assigned`, `interview_invited`) cannot be disabled (422). Other users' notifications return 404. Tests: `test_email_notifications.py`, E2E (recipient set asserted, no leakage to the candidate).

Gaps: FE header bell does not show the unread count yet; email channel preference has no effect because no event emails are sent (F-044).

## 7.4 Email automation

```
send_smtp_email(...)  → email_logs row status=queued (commit)
                      → background thread: processing → sent | failed (error class only) | skipped (SMTP not configured)
retry (HR/Recruiter)  → only failed/skipped, never OTP/password emails, max 3 attempts, returns the REAL status
```

- Sensitive emails (OTP, new password, initial password) store a placeholder body, never the secret.
- Tested with SMTP pointed at `127.0.0.1:1`: delivery recorded as `failed`, retry returns `failed` with `attempts=2`, third retry blocked (409).
- No real email was sent during this session.
- **Not implemented**: event-driven business emails from templates (application confirmation, interview invitation, offer letter) — `is_auto_send` is stored but unused (F-044); bulk rejection emails (S7-09).

## 7.5 Transactional outbox — recommendation

Notifications already have outbox-like guarantees (written atomically with the business change). Email delivery runs on an in-process daemon thread after the queued row is committed: if the process dies between commit and send, the row stays `queued` and nothing retries it. Given the project's scale (single FastAPI process, internal users), a full message broker is not justified; recommended is a small **DB-backed outbox**: keep `email_logs` as the outbox, add a periodic worker (APScheduler/cron) that picks `queued`/`failed` rows with `attempts < 3` and `FOR UPDATE SKIP LOCKED` on PostgreSQL. Priority P2.
