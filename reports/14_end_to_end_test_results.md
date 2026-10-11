# 14 — End-to-End Test Results

Written for: QA and the Product Owner. All workflows run through the real FastAPI application (TestClient) against an isolated SQLite database seeded with the production RBAC matrix (`app/db/seed_rbac.py`). Each step asserts the HTTP response **and** the persisted rows. UI-level (browser) E2E: **CANNOT_VERIFY** (no running stack). PostgreSQL: **CANNOT_VERIFY**.

| Workflow | Test | Result |
|---|---|---|
| A — Authentication & authorization | `test_e2e_multi_actor_workflow` (part A), `test_role_update_is_validated_and_effective_on_next_request` | **PASS** |
| B — Recruitment (requisition → publication) | `test_e2e_multi_actor_workflow` (part B) | **PASS** |
| C — Candidate recruitment (apply → onboarding) | `test_e2e_multi_actor_workflow` (part C), `test_full_recruitment_lifecycle` | **PASS** |
| D — Notification & email | `test_e2e_multi_actor_workflow` (part D), `test_email_notifications.py` | **PASS** (notifications); email delivery verified as `failed`/`skipped` with SMTP disabled — no real send |
| E — Session security (device A/B, revoke all) | `test_logout_device_a_keeps_device_b_and_logout_all_revokes_both`, refresh tests | **PASS** |
| F — Candidate self-service via e-mail links (round 2) | `test_application_requires_uploaded_cv_and_gets_tracking_code_and_email`, `test_public_status_lookup_reveals_only_general_status`, `test_withdraw_through_email_link_requires_confirmation_and_is_single_use`, `test_invitation_link_confirmation_room_conflict_and_reschedule`, `test_offer_letter_link_acceptance_and_department_onboarding_template` | **PASS** (API level; the 4 `/candidate/*` pages are not browser-tested) |
| G — Competency-based evaluation (round 2) | `test_competency_scorecard_weighted_score_snapshot_reopen_and_compare`, `test_hiring_decision_logged` | **PASS** |

## Workflow A
Admin creates 6 users with different roles (one with two roles) → normalized `user_roles` rows exist → each user logs in → `/auth/me` returns the UNION of permissions (`requisition:create` + `interview:evaluate` for HM+Interviewer) → admin API refused for the HM (403) → admin removes the HM's `hiring_manager` role → the HM's **existing** token is refused on `POST /requisitions` (403) on the very next request. (Menu rendering in the browser was not tested.)

## Workflow B
HM saves a draft requisition → submits (`pending_manager`) → Approver approves (`pending_hr`) → HR Manager approves (`approved`) → HR assigns the recruiter (row persisted) → recruiter creates a posting with `status=published` but it is stored as `pending_review` and is **not** on the public portal → HR Manager publishes → posting appears on `GET /jobs`, `published_by_id` = HR Manager.

## Workflow C
Candidate applies (application linked to the candidate account) → recruiter moves to screening → recruiter schedules an interview with 2 interviewers (application → `interviewing`) → interviewer sees no peer evaluations before submitting, submits one → HM sees it → recruiter creates an in-band offer (`pending_approval`) → HR approves → recruiter sends → candidate accepts (application → `hired`, 5 onboarding items) → HR completes all items → progress 100 %, application → `onboarded`.

Persisted history asserted: requisition log `submitted, approved, approved, recruiter_assigned`; stage log `screening, interviewing, offered, hired, onboarded`; offer log `submitted, approved, sent, accepted`.

## Workflow D
Notifications asserted in the DB: approver and HR Manager received `approval_pending`; requisition creator `requisition_decision`; recruiter `recruiter_assigned`; both interviewers `interview_invited`; offer creator `offer_response`; the candidate received no approval notifications. Audit rows include `LOGIN_SUCCESS, CREATE_USER, REQUISITION_SUBMIT, REQUISITION_DECISION, REQUISITION_ASSIGN_RECRUITER, OFFER_DECISION, OFFER_ACCEPTED`. Email: delivery to a closed SMTP port recorded as `failed`; retry returns the real `failed` status and stops after 3 attempts.

## Workflow E
Login on device A and B → two independent sessions → refresh keeps the same session id and absolute expiry, A's old access token still valid → logout A → A rejected (401), B still valid → logout-all from B → B rejected (401). Replaying a rotated refresh token revokes the session.

## Workflow F (round 2)
Candidate uploads a PDF CV (`POST /files`, type sniffed, parsed name/email returned for confirmation) → applies with the stored file reference (an external CV URL is rejected, 422) → gets tracking code `APP-…`; a `CONFIRM_APPLICATION` e-mail row is queued **in the same transaction** and the outbox worker records it as `skipped` (SMTP disabled — never reported as sent) → public status lookup with code + e-mail returns only `{tracking_code, job_title, status, applied_date}` with the general status "Đã nhận"; wrong e-mail → 404 → the withdraw link from the e-mail first asks for confirmation (status unchanged), then withdraws (status `withdrawn`), and a second use returns 404; the assigned recruiter gets an `application_withdrawn` notification. Interview: invitation e-mail carries a single-interview token; the candidate confirms through `/public/interviews/respond` and `candidate_response = confirmed` is stored. Offer: approved offer is sent with a token link; the public offer view shows salary and allowance; acceptance sets the application to `hired`, a second use returns 404, and the onboarding checklist comes from the department template.

## Workflow G (round 2)
HR Manager creates a framework (weights 60/40, must total 100) and a linked question → scheduled interviewer gets the scorecard template (another interviewer: 403) and question suggestions; marking a question as asked flags it for later rounds → an incomplete scorecard is rejected (422); the full one stores weighted score 84.0 and a criteria snapshot that survives a later framework edit → the interview can no longer be cancelled (409) → the evaluation is locked until the recruiter reopens it (within 24 h), then one edit is allowed → HM sees per-criterion averages and the comparison table; the interviewer's list flags the session as evaluated → the hiring decision requires a reason for rejection and is written to the stage log with the decider.
