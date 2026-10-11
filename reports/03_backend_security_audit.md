# 03 — Backend Security Audit

Written for: the engineering team. Scope: `backend/app` (FastAPI). Method: code review of every router and dependency, reproduction with FastAPI `TestClient` against isolated SQLite databases (never the developer DBs; SMTP pointed at a dead port), regression tests kept in `backend/tests/`. Finding IDs → `09_remediation_implementation_plan.md`.

## Executive summary

Before remediation the backend had **9 P0 issues**: a live SMTP credential in git (F-001), session revocation that did not apply to admin/HR endpoints (F-002, F-003), several endpoints with no authentication at all (interviews F-004, email automation F-007, analytics F-009), candidate PII and offer salaries readable by any logged-in user (F-005, F-006), any user able to mark a candidate hired (F-006), and OTPs/passwords printed to logs (F-008). All nine are fixed in code and covered by regression tests; the exposed credential still has to be revoked by its owner.

## 3.1 Authentication

| Check | Before | After | Evidence |
|---|---|---|---|
| Password hashing | bcrypt (direct, 72-byte truncation) | unchanged — OK | `app/core/security.py` |
| Account enumeration (login) | FAIL — distinct field error + remaining-attempt count for existing emails, no bcrypt for unknown emails | PASS — identical response + dummy bcrypt | `test_login_failure_does_not_reveal_whether_email_exists` |
| Account enumeration (reset) | FAIL — HTTP 400 for unknown email | PASS — identical 202 + decoy session, no email | `test_email_existence_check` |
| Brute force | per-account 15-min lock after 5 failures | unchanged — PASS | `test_account_lockout_after_5_failed_attempts` |
| Per-IP login rate limit | none | still none — OPEN (password reset has email/IP limits) | — |
| Account status on every request | checked in `get_current_session_user` only; legacy helpers checked status but not sessions | PASS for all routes (single `authenticate_bearer`) | `test_session_enforcement.py` |
| Password change revokes other sessions | yes | PASS | `test_change_password_increments_security_version` |
| Admin reset / lock revoke sessions | NO (F-011, F-012) | PASS | `test_admin_*` |
| OTP storage | HMAC-SHA256 digest, attempts, cooldown, rate limits | unchanged — PASS; OTP no longer logged | `test_password_reset_otp.py` |
| Reset emails a new plaintext password | yes (design) | unchanged — recommendation: let the user set a new password after OTP instead | — |

## 3.2 JWT

| Check | Result |
|---|---|
| Algorithm pinned (`algorithms=[HS256]`) | PASS (python-jose) |
| Token type (`typ=access`) enforced | PASS — refresh tokens are opaque random values, not JWTs |
| Session id claim | **was optional → now mandatory** (F-003) |
| Security version claim (`ver`) | PASS — kill-switch on lock/reset |
| Secret | default value in `config.py` is a public placeholder; `.env.example` now has a CHANGE_ME value — set a strong `SECRET_KEY` (manual action) |

## 3.3 Server-side sessions

| Check | Result | Test |
|---|---|---|
| Distinct session per login, multi-device | PASS | `test_multi_device_login_creates_separate_sessions` |
| Every protected request validates the session | **FAIL → PASS** (F-002) | `test_logged_out_session_rejected_on_legacy_guarded_endpoints` |
| Revoked / expired / idle sessions rejected | PASS | `test_admin_revoked_session_rejected_*`, existing tests |
| Absolute timeout (12 h) | **FAIL → PASS** (F-015: was 7 days and extended on every refresh) | `test_refresh_rotates_in_place_without_extending_absolute_expiry` |
| Logout current / logout-all / device A vs B | PASS | `test_logout_device_a_keeps_device_b_and_logout_all_revokes_both` |
| Unlock does not revive sessions | **FAIL → PASS** | `test_admin_lock_revokes_sessions_and_unlock_does_not_revive_them` |

## 3.4 Refresh tokens

| Check | Result |
|---|---|
| Random (256-bit), HMAC-hashed at rest | PASS |
| Rotation | now **in place** on the same session (session id and absolute expiry preserved) |
| Reuse detection | replay of the previous token → session revoked (`REFRESH_TOKEN_REUSED`) — `test_replayed_refresh_token_revokes_the_session` |
| Concurrent refresh | compare-and-set on the current hash; the loser gets 409 `REFRESH_IN_PROGRESS` (no family revocation). Verified logically and on SQLite; **PostgreSQL behaviour CANNOT_VERIFY** |
| Cookie | HttpOnly, SameSite=Lax, `Secure` in production, `Path=/api/v1/auth` |
| CSRF on cookie refresh | refresh only rotates tokens (no state change beyond the session); SameSite=Lax + explicit CORS allowlist mitigate cross-site use |
| Frontend actually sends the cookie | **FAIL → FIXED** (F-016) |

## 3.5 Multi-role RBAC

| Check | Result | Test |
|---|---|---|
| users → user_roles → roles → role_permissions → permissions | PASS | `test_rbac_integration.py` |
| Effective permissions = deduplicated UNION | PASS | `test_two/three_role_union_permissions`, E2E (HM + interviewer) |
| Changes effective on next request | PASS | `test_role_update_is_validated_and_effective_on_next_request` |
| Default deny for non-admin & new permissions | PASS | `test_new_permission_other_roles_default_deny` |
| Admin full allow, immutable column, cannot remove own admin role | PASS (admin no longer depends on a seeded permissions table) | existing tests |
| Legacy `users.role` used for authorization | PARTIAL — only as a fallback when a user has no `user_roles` rows (F-036); all write paths now populate `user_roles`; role filter in admin user search still uses the legacy string | — |
| Unknown role codes on assignment | silently dropped → now 422 | — |

## 3.6 Object-level authorization (IDOR)

Implemented in `app/services/access_scope.py` following the backlog matrix (*2. User Roles*).

| Scenario | Before | After | Test |
|---|---|---|---|
| Employee reads other candidates' applications | allowed | 403 / filtered | `test_employee_only_sees_own_applications` |
| Recruiter outside assignment reads/moves a candidate | allowed | 403 | `test_recruiter_scope_follows_assignment` |
| Interviewer reads other interviewers' interviews / submits feedback / evaluation | allowed | filtered / 403 | `test_interviewer_scope_feedback_and_evaluation` |
| Unrelated user creates/accepts an offer | allowed (→ hired) | 403 / 409, DB unchanged | `test_offer_cannot_be_created_or_accepted_by_unrelated_users` |
| Approver acts on an offer still at HR level | n/a | 403 | `test_over_band_offer_requires_justification_and_escalates_to_approver` |
| Employee lists / opens requisitions (salary) | allowed | empty / 403 | `test_employee_cannot_create_or_see_requisitions` |
| Notifications of another user | n/a | 404 (no existence disclosure) | `test_interview_invitation_creates_private_persistent_notification` |
| User edits own protected profile fields (department/email/role) | department editable | ignored | `test_profile_update_cannot_change_protected_fields` |
| Revoking another user's session | `DELETE /auth/sessions/{id}` checks ownership (existing code) | unchanged, not re-tested | — |

## 3.7 Common application security

| Area | Result |
|---|---|
| SQL injection | No raw SQL with user input found; ORM filters/`ilike` with bound parameters. Raw DDL only in `bootstrap.py` with constant identifiers. PASS |
| XSS | Email templates are HTML authored by HR (trusted role) — preview renders server-side strings; FE uses React escaping. Template variables from candidate data are not escaped before insertion into HTML emails → recommend `html.escape` on values (OPEN, low) |
| Mass assignment | Pydantic models whitelist fields; workflow fields (`status`, `approval_level`, `published_by_id`, `created_by_id`) are now server-controlled. Requisition/job `**model_dump()` only include declared create fields. PASS |
| File upload | no upload endpoint; data URLs stored unvalidated (F-039) — OPEN |
| CORS | `*` + credentials → explicit allowlist (F-013) — FIXED |
| Error disclosure | `str(exc)` removed from global handler and rewritten routers; admin import still leaks (F-045) |
| Secrets in repo | F-001 (fixed in tree; rotate + history purge manual); `.env` files untracked; DB files with password hashes tracked (F-034) |
| Secret logging | F-008 fixed; DB URL now logged masked |
| Rate limiting | password reset: email/IP windows (existing); login: per-account lock only; public application form: none (S4-03 AC3 OPEN) |
| Dependencies | not scanned in this session (no network audit). Known: frontend `xlsx@0.18.5` advisories (F-050); backend ranges unpinned (F-049) — CANNOT_VERIFY full CVE status |
