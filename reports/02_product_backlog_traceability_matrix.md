# 02 — Product Backlog Traceability Matrix

Written for: the project team and Product Owner. Source of requirements: `HỆ THỐNG TUYỂN DỤNG NỘI BỘ_ TTCS_T926_K3S4.xlsx` (sheet *4. Product Backlog*, 76 stories / 350 points; the `Config/` copy is content-identical) and the atomic AC list in `ATS_Test_Cases_TTCS_T926_K3S4.xlsx` (sheet *08_AC_goc*, **243 ACs**).

## How to read this matrix

| Code | Meaning (per AC) |
|---|---|
| Verified | Proven by an automated test that calls the real API and checks a real (SQLite) database — see `reports/evidence/pytest_full_suite_round2.txt` |
| Impl. unverified | Code exists and was inspected, but no automated test proves it |
| Partial | Some of the AC is implemented |
| Missing | No implementation found (searched routers, services, models and FE pages) |

Story status: **VERIFIED** = every AC verified; **PARTIALLY IMPLEMENTED** = at least one AC partial/missing; **MISSING** = all ACs missing; otherwise **IMPLEMENTED BUT UNVERIFIED**. Assessments reflect the code **after** remediation round 2 (2026-10-11). PostgreSQL-specific behaviour is never counted as verified (no PostgreSQL access — CANNOT_VERIFY).

## Totals

- Stories analysed: **76**; ACs analysed: **243**
- ACs verified by automated tests: **147** (60%) · implemented-unverified: **80** · partial: **12** · missing: **4**

| Story status | Stories | Points |
|---|---|---|
| IMPLEMENTED BUT UNVERIFIED | 41 | 189 |
| MISSING | 1 | 2 |
| PARTIALLY IMPLEMENTED | 12 | 59 |
| VERIFIED | 22 | 100 |

### By epic
| Epic | Points | ACs | Verified | Impl. unverified | Partial | Missing | Verified % |
|---|---|---|---|---|---|---|---|
| EP-01 | 52 | 39 | 19 | 17 | 3 | 0 | 49% |
| EP-02 | 25 | 16 | 8 | 8 | 0 | 0 | 50% |
| EP-03 | 44 | 28 | 20 | 7 | 1 | 0 | 71% |
| EP-04 | 47 | 34 | 18 | 13 | 0 | 3 | 53% |
| EP-05 | 53 | 33 | 18 | 8 | 6 | 1 | 55% |
| EP-06 | 51 | 39 | 32 | 7 | 0 | 0 | 82% |
| EP-07 | 28 | 18 | 13 | 4 | 1 | 0 | 72% |
| EP-08 | 22 | 19 | 12 | 6 | 1 | 0 | 63% |
| EP-09 | 28 | 17 | 7 | 10 | 0 | 0 | 41% |

### By sprint
| Sprint | Points | ACs | Verified | Impl. unverified | Partial | Missing | Verified % |
|---|---|---|---|---|---|---|---|
| 1 | 42 | 31 | 18 | 11 | 2 | 0 | 58% |
| 2 | 45 | 30 | 13 | 14 | 1 | 2 | 43% |
| 3 | 44 | 30 | 19 | 9 | 1 | 1 | 63% |
| 4 | 45 | 29 | 17 | 11 | 1 | 0 | 59% |
| 5 | 45 | 30 | 16 | 8 | 5 | 1 | 53% |
| 6 | 43 | 32 | 27 | 5 | 0 | 0 | 84% |
| 7 | 42 | 31 | 24 | 6 | 1 | 0 | 77% |
| 8 | 44 | 30 | 13 | 16 | 1 | 0 | 43% |

## Master matrix (Story → AC → implementation evidence → findings)

Frontend pages / APIs / models per story are named in the Evidence column; finding IDs refer to `09_remediation_implementation_plan.md` and `12_remediation_execution_log.md`.

| Story | Epic | Sprint | Primary actor | Priority | Pts | Status | ACs | Verified | Impl. unverified | Partial | Missing | Evidence | Findings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1-01 | EP-01 | 1 | nhân sự nội bộ | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | generic login error + 15-min lockout (tests); FE role redirect untested | F-035 |
| S1-02 | EP-01 | 1 | nhân sự nội bộ | Must | 3 | **PARTIALLY IMPLEMENTED** | 3 | 2 | 0 | 1 | 0 | in-place refresh + server logout revocation (tests); FE expired-session message not explicit | F-015,F-016,F-017 |
| S1-03 | EP-01 | 1 | nhân sự nội bộ | Must | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | CR: OTP (10 min) replaces 30-min link; single-use + identical response for unknown email (tests) | F-010,F-035 |
| S1-04 | EP-01 | 1 | nhân sự nội bộ | Must | 2 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | current password required + other sessions revoked (tests); complexity validator untested | — |
| S1-05 | EP-01 | 1 | Quản trị hệ thống | Must | 8 | **VERIFIED** | 4 | 4 | 0 | 0 | 0 | DB permission matrix, default deny, Vietnamese 403, tests for ≥3 roles | — |
| S1-06 | EP-01 | 1 | nhân sự nội bộ | Must | 5 | **PARTIALLY IMPLEMENTED** | 3 | 0 | 2 | 1 | 0 | UnifiedAppShell/workspace menus filtered by /auth/me permissions; legacy Employee/HR/Admin shells still role-based; real name+role in headers (RoleWorkspaceShell, HRHeader); 360px untested | F-037 |
| S1-07 | EP-01 | 1 | nhân sự nội bộ | Should | 1 | **IMPLEMENTED BUT UNVERIFIED** | 2 | 0 | 2 | 0 | 0 | app/error.tsx, app/not-found.tsx; untested | — |
| S1-08 | EP-01 | 1 | Quản trị hệ thống | Must | 8 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 0 | 4 | 0 | 0 | create + welcome email via outbox, duplicate email 409 message, search incl. department, role filter on user_roles (role filter asserted in test_lock_handover…), FE page size 20 | F-036 |
| S1-09 | EP-01 | 1 | Quản trị hệ thống | Must | 3 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | multi-role, immediate effect, self-admin-removal guard (tests) | — |
| S1-10 | EP-01 | 1 | Quản trị hệ thống | Must | 2 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | lock revokes sessions (test); handover-check lists owned/recruiting positions (test) and is shown in the lock dialog; reason required (untested) | F-011 |
| S2-01 | EP-01 | 2 | Quản trị hệ thống | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 0 | 3 | 0 | 0 | template download, per-row preview/errors, partial import; untested | — |
| S2-02 | EP-01 | 2 | nhân sự nội bộ | Must | 3 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | email/department/role not self-editable (test); name/phone/VN-phone validator untested | F-051 |
| S2-03 | EP-01 | 2 | nhân sự nội bộ | Could | 2 | **PARTIALLY IMPLEMENTED** | 2 | 0 | 1 | 1 | 0 | avatar: magic-byte PNG/JPEG check, SVG rejected (test), 2 MB limit; square crop in FE only, no server thumbnail | F-039 |
| S2-04 | EP-02 | 2 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | tree via parent_id, head_user_id; delete blocked → deactivate (test) | — |
| S2-05 | EP-02 | 2 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | code/name/level/band; band drives offer approval level (_salary_band); band hidden from non-HR (test) | F-041 |
| S2-06 | EP-02 | 2 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | framework CRUD with weights = 100 (test), scorecard generated from framework (test); reuse across job titles via applied_job_titles (untested) | F-041 |
| S2-07 | EP-02 | 2 | Trưởng phòng Nhân sự | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | questions require a criterion, difficulty + suggested answer, filter by job title/difficulty (tests); criterion filter untested | F-043 |
| S2-08 | EP-02 | 2 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | categories incl. source/rejection_reason/location/work type; referenced value cannot be deleted (test); reorder endpoint untested | — |
| S2-09 | EP-04 | 2 | Trưởng phòng Nhân sự | Could | 2 | **MISSING** | 2 | 0 | 0 | 0 | 2 | company profile/branding not implemented | F-043 |
| S2-10 | EP-03 | 2 | Trưởng bộ phận | Must | 8 | **VERIFIED** | 4 | 4 | 0 | 0 | 0 | fields + draft, past date blocked, out-of-band salary needs justification vs job-title band (tests) | F-020,F-041 |
| S3-01 | EP-03 | 3 | Trưởng phòng Nhân sự | Must | 8 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | approval flows by department + salary threshold; executive step added over threshold, empty chain rejected, chain snapshot survives config change (tests); department match untested | F-042 |
| S3-02 | EP-03 | 3 | Người duyệt | Must | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | approve/reject/request-changes with mandatory comment, next level, history (tests) | F-020 |
| S3-03 | EP-03 | 3 | Trưởng bộ phận | Must | 3 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | approval_chain + step index exposed; logs with actor/time/comment (tests); no edit/delete endpoints | — |
| S3-04 | EP-03 | 3 | Trưởng phòng Nhân sự | Must | 5 | **PARTIALLY IMPLEMENTED** | 3 | 2 | 0 | 1 | 0 | headcount per department/year, remaining shown, blocking 409 + HR override with reason (tests); salary budget not modelled | F-042 |
| S3-05 | EP-03 | 3 | Trưởng bộ phận | Should | 2 | **VERIFIED** | 2 | 2 | 0 | 0 | 0 | copy → clean draft without approval history (test) | — |
| S3-06 | EP-03 | 3 | Trưởng phòng Nhân sự | Must | 3 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | primary/secondary assignment, recruiter scope, transfer history (tests); HR requisitions page now real (assign dialog uses /hr/people) | F-019 |
| S3-07 | EP-03 | 3 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | filled/paused/cancelled with reason, postings unpublished (test); active-candidate 409 + second confirmation in HR page (untested) | F-020 |
| S3-08 | EP-03 | 3 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 0 | 3 | 0 | 0 | filters status/department/recruiter/date range/overdue; days_open/days_remaining/is_overdue per row; HR requisitions page highlights overdue — untested | — |
| S3-09 | EP-04 | 3 | Nhân viên tuyển dụng | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | only approved requisitions (test); JD prefill, location/type/deadline/salary visibility fields | F-021 |
| S3-10 | EP-04 | 3 | Trưởng phòng Nhân sự | Must | 3 | **PARTIALLY IMPLEMENTED** | 3 | 2 | 0 | 0 | 1 | HR review before public + published_by/at (tests); public-style preview before publishing MISSING | F-021 |
| S4-01 | EP-04 | 4 | Ứng viên | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | no login, title+description search, published & unexpired only (tests); department/location/type filters untested | F-043 |
| S4-02 | EP-04 | 4 | Ứng viên | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 0 | 3 | 0 | 0 | detail shows description, requirements, benefits, deadline, real openings; expired posting shows a notice instead of the apply button (FE, untested) | F-043 |
| S4-03 | EP-04 | 4 | Ứng viên | Must | 8 | **IMPLEMENTED BUT UNVERIFIED** | 5 | 4 | 1 | 0 | 0 | PDF/DOCX ≤10 MB by magic bytes, honeypot + 5/hour/IP, duplicate rejected, tracking code + confirmation email queued (tests); form incl. source (from catalogue) + CV upload untested in a browser | F-022,F-039,F-044 |
| S4-04 | EP-04 | 4 | Nhân viên tuyển dụng | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | PDF/DOCX text extraction of name/email/phone (test); shown for confirmation in ApplyJobModal, never overwrites; failure-tolerant (untested) | F-043 |
| S4-05 | EP-04 | 4 | Ứng viên | Must | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | public lookup by code + email, general status only, no internal fields (test); /candidate/status page | F-043 |
| S4-06 | EP-04 | 4 | Ứng viên | Should | 2 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | withdraw via e-mailed token with confirmation, single use, recruiter notified (test); /candidate/withdraw page | F-043 |
| S4-07 | EP-04 | 4 | nhân sự nội bộ | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 0 | 3 | 0 | 0 | referral creates a pipeline application (source 'Giới thiệu nội bộ', referrer), referrer sees general status; untested | F-043 |
| S4-08 | EP-04 | 4 | Nhân viên tuyển dụng | Must | 2 | **IMPLEMENTED BUT UNVERIFIED** | 2 | 1 | 1 | 0 | 0 | daily expire_postings job closes overdue postings (test); manual close endpoint untested | F-043 |
| S4-09 | EP-05 | 4 | Nhân viên tuyển dụng | Must | 8 | **PARTIALLY IMPLEMENTED** | 3 | 2 | 0 | 1 | 0 | profile with notes/tags/timeline + previous applications, scoped access (tests); inline CV preview opens the protected file, no embedded viewer | F-043 |
| S5-01 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 5 | **PARTIALLY IMPLEMENTED** | 4 | 3 | 0 | 1 | 0 | duplicate detection by email/phone, merge keeps history, unmerge within 24h (test); side-by-side comparison UI missing | F-043 |
| S5-02 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 8 | **PARTIALLY IMPLEMENTED** | 4 | 0 | 1 | 2 | 1 | stages + /pipeline-summary counts; HR candidates page is a table — no kanban/drag-drop | F-043 |
| S5-03 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | rejection reason from catalogue, stage log, skip-interview guard (tests) | F-043 |
| S5-04 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 5 | **PARTIALLY IMPLEMENTED** | 3 | 2 | 0 | 1 | 0 | rating 1–5 + internal notes with author, hidden from candidate (tests); tags are free-form, not catalogue-bound | F-043 |
| S5-05 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | saved filters (test); filters job/stage/source/tag/date/rating + search incl. cover letter (untested) | F-043 |
| S5-06 | EP-05 | 5 | Trưởng phòng Nhân sự | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | rejected → talent pool with reason, suggestions for a new requisition (test); search by title/skills untested | F-043 |
| S5-07 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 2 | **IMPLEMENTED BUT UNVERIFIED** | 2 | 0 | 2 | 0 | 0 | timeline (applied, stage moves, emails, interviews, evaluations) newest first; only 'applied' asserted | F-043 |
| S5-08 | EP-05 | 5 | Nhân viên tuyển dụng | Must | 2 | **IMPLEMENTED BUT UNVERIFIED** | 2 | 1 | 1 | 0 | 0 | manual add by scoped recruiter (test); duplicate detection path untested | F-043 |
| S5-09 | EP-05 | 5 | Nhân viên tuyển dụng | Should | 5 | **PARTIALLY IMPLEMENTED** | 3 | 1 | 1 | 1 | 0 | match score + meets_requirements flag (test); criteria = years + skills (no degree); never auto-rejects | F-043 |
| S5-10 | EP-08 | 5 | Nhân viên tuyển dụng | Should | 3 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | SLA rule per stage, overdue flag + reminder, once per day (test); daily background job | F-043 |
| S6-01 | EP-05 | 6 | Nhân viên tuyển dụng | Should | 3 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | xlsx export by filter, no internal notes, file name has job code + date, formula-injection guard (test) | F-043 |
| S6-02 | EP-06 | 6 | Nhân viên tuyển dụng | Must | 8 | **VERIFIED** | 4 | 4 | 0 | 0 | 0 | round/time/duration/location, multiple interviewers, no past time, visible to interviewers (tests) | F-023 |
| S6-03 | EP-06 | 6 | Nhân viên tuyển dụng | Should | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | bulk slots preview → confirm, one invitation per candidate (test) | F-043 |
| S6-04 | EP-06 | 6 | Nhân viên tuyển dụng | Must | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | interviewer + room conflicts, conflicting session shown, override only with reason (tests) | F-023 |
| S6-05 | EP-06 | 6 | Ứng viên | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 2 | 2 | 0 | 0 | tokenised confirm/reschedule link bound to one interview (test); e-mail content and recruiter-side status display untested | F-044 |
| S6-06 | EP-06 | 6 | Nhân viên tuyển dụng | Must | 3 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | reschedule incl. interviewers, cancel needs reason, locked after an evaluation (tests); change notifications untested | F-043 |
| S6-07 | EP-06 | 6 | Trưởng phòng Nhân sự | Must | 8 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | scorecard from framework, weighted score, snapshot unaffected by framework edits (test); per-criterion comment untested | F-041 |
| S6-08 | EP-06 | 6 | Người phỏng vấn | Must | 3 | **VERIFIED** | 4 | 4 | 0 | 0 | 0 | invited-only, conclusion required, reopen within 24h, hidden peers (tests) | F-018 |
| S6-09 | EP-06 | 6 | Trưởng bộ phận | Should | 3 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | comparison with per-criterion scores, only candidates with ≥1 evaluation (test); sorting asserted with one row only | F-043 |
| S7-01 | EP-06 | 7 | Người phỏng vấn | Must | 3 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | only own interviews + 'evaluation pending' flag (tests); CV link via protected download | F-028 |
| S7-02 | EP-06 | 7 | Người phỏng vấn | Should | 3 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | suggestions by criteria/job title, asked-question marking (test); suggested answer returned (untested) | F-043 |
| S7-03 | EP-06 | 7 | Trưởng bộ phận | Must | 5 | **VERIFIED** | 4 | 4 | 0 | 0 | 0 | evaluation summary, per-criterion averages, offer/reject decision with reason, logged with actor (tests) | F-043 |
| S7-04 | EP-07 | 7 | Nhân viên tuyển dụng | Must | 8 | **VERIFIED** | 4 | 4 | 0 | 0 | 0 | salary/allowance/start/deadline, out-of-band justification, letter preview, one active offer (tests) | F-006 |
| S7-05 | EP-07 | 7 | Người duyệt | Must | 5 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | HR approval in band, escalation over band, 3 actions, append-only history (tests) | F-006 |
| S7-06 | EP-07 | 7 | Ứng viên | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | offer e-mail with single-use token link, accept/decline with comment, pipeline updated (tests); expiry is lazy on read | F-006,F-044 |
| S7-07 | EP-07 | 7 | Nhân viên tuyển dụng | Must | 5 | **PARTIALLY IMPLEMENTED** | 3 | 0 | 2 | 1 | 0 | decline reason categories; respond returns suggest_talent_pool; revision is in-place versioning (no 'Đã thay thế' row) | F-040 |
| S7-08 | EP-07 | 7 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 3 | 1 | 0 | 0 | department onboarding template (test), progress % + onboarded on completion (e2e); owner/due date per item untested | F-006 |
| S7-09 | EP-08 | 7 | Nhân viên tuyển dụng | Should | 3 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | bulk rejection letters: preview with real data, duplicate guard (test) | F-044 |
| S8-01 | EP-08 | 8 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 0 | 4 | 0 | 0 | default templates (confirm, invite, thank-you, reject, offer, cancel), variables, real-data preview, is_auto_send honoured by queue_template_email — untested | F-044 |
| S8-02 | EP-08 | 8 | Nhân viên tuyển dụng | Must | 3 | **VERIFIED** | 3 | 3 | 0 | 0 | 0 | log with time/template/status, retry reports real outcome, transactional outbox + worker (tests) | F-025 |
| S8-03 | EP-08 | 8 | nhân sự nội bộ | Must | 5 | **PARTIALLY IMPLEMENTED** | 4 | 1 | 2 | 1 | 0 | interview invitation notification (test); bells show real unread count + latest items; notifications still written synchronously in the business transaction | F-026 |
| S8-04 | EP-08 | 8 | nhân sự nội bộ | Could | 3 | **VERIFIED** | 2 | 2 | 0 | 0 | 0 | per-channel preferences, mandatory types locked (tests) | F-026 |
| S8-05 | EP-09 | 8 | Trưởng phòng Nhân sự | Must | 8 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 2 | 2 | 0 | 0 | real KPIs (test), weekly applications trend from data (test); overdue list ordering and <2 s not measured | F-024 |
| S8-06 | EP-09 | 8 | Trưởng bộ phận | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 1 | 2 | 0 | 0 | hiring-manager per-stage counts (test); upcoming interviews / awaiting feedback / days remaining untested | F-043 |
| S8-07 | EP-09 | 8 | Trưởng phòng Nhân sự | Must | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | funnel counts + biggest drop (test); department/date filters untested | F-043 |
| S8-08 | EP-09 | 8 | Trưởng phòng Nhân sự | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 4 | 0 | 4 | 0 | 0 | time-to-hire, cost-per-hire from manual costs, by department/title, xlsx export — only the zero-hire case asserted | F-043 |
| S8-09 | EP-09 | 8 | Trưởng phòng Nhân sự | Should | 5 | **IMPLEMENTED BUT UNVERIFIED** | 3 | 2 | 1 | 0 | 0 | per-source applications + xlsx export (test); quality ranking untested | F-043 |

## Original requirements vs change requests vs code behaviour

- **S1-03** — CR-01 OTP (6 digits, 10 min, max 5 attempts) instead of a 30-minute reset link — stated as the approved change in the audit brief, not documented in the project files → PO to confirm in writing.
- **S7-07** — Deviation: revised offer is a new revision of the same offer row (history snapshot kept) because job_offers.application_id is UNIQUE; AC says old offer becomes 'Đã thay thế'.
- **S3-02** — Business rule to confirm: a Hiring Manager may approve step 1 of their own requisition (encoded in team test test_object_scope_enforced).
- **S1-01 / S1-03 (fixed in this session)**: the code revealed whether an email exists (login field error "Tài khoản Email không tồn tại trong hệ thống.", remaining-attempt counts, and HTTP 400 "Tài khoản Email không chính xác." on password reset). Both ACs explicitly forbid this and no CR overrides them, so the code — and the two team tests that encoded the leak — were changed to match the ACs.
- **S7-04 / S7-05**: the original code created offers directly as `sent` and allowed any user to mark them `accepted`; now offers go through submit → HR (→ Approver when out of band) → send → candidate response.

## Assumptions requiring Product Owner confirmation

- CR-01 (OTP instead of reset link) must be recorded as an approved change.
- Self-approval of step 1 by the requisition's own Hiring Manager (S3-02).
- Offer revision modelling (S7-07) — in-place versioning vs separate rows.
- Whether staff may record a candidate's offer response on their behalf (implemented: candidate account **or** recruiter/HR in scope).

Open questions already listed in the test workbook (sheet *07_Can_xac_nhan_PO*):

- PO-01 — Stack công nghệ — Product Overview ghi React + Spring Boot hoặc NestJS; kế hoạch triển khai nhóm có FastAPI + Next.js + PostgreSQL + Docker. — Xác nhận stack cuối cùng; các case API/DevOps bám bản deploy thực tế. — NFR-26; toàn bộ API test — Chưa xác nhận
- PO-02 — CV parsing — Product Overview liệt kê AI bóc tách CV ngoài phạm vi, nhưng S4-04 Should yêu cầu parser PDF. — Triển khai PDF text parsing ở mức gợi ý hay bỏ/hoãn S4-04? Không mặc định AI. — S4-04 — Chưa xác nhận
- PO-03 — Quyền Admin — Ma trận quyền liệt kê Candidate → HR Manager nhưng không có cột Admin mặc dù có vai trò Admin. — Admin đọc được CV nội dung hay chỉ quản trị tài khoản/audit? — S1-05, S4-09, NFR-15 — Chưa xác nhận
- PO-04 — Quyền dữ liệu Recruiter/Approver — Ma trận ghi Recruiter F ở hồ sơ ứng viên, Approver R; NFR giới hạn recruiter phụ trách và HM sở hữu. — Khoanh quyền đọc/lọc/xuất của recruiter hỗ trợ, approver, HR và Admin đến mức nào? — S3-06,S4-09,S5-02,S6-01 — Chưa xác nhận
- PO-05 — Luồng duyệt — Tối đa ba cấp đang là giả định, yêu cầu S3-01 cho cấu hình động. — Cho phép duyệt song song, ủy quyền, hủy bước đang chờ hay chỉ tuần tự <= 3 cấp? — S3-01,S3-02 — Chưa xác nhận
- PO-06 — Định nghĩa lương / hạn mức — S7-05 dùng dải lương chức danh; ngân sách headcount theo năm ở S3-04. — Offer trong dải lương nhưng vượt ngân sách phòng ban xử lý thế nào? — S3-04,S7-05 — Chưa xác nhận
- PO-07 — Ngày hết hạn & múi giờ — Ngày tin, offer và đường dẫn chưa định nghĩa tính hết hạn đầu/cuối ngày. — Hết hạn 23:59:59 Asia/Ho_Chi_Minh? Cho phép gia hạn và ghi audit? — S4-02,S4-03,S7-06 — Chưa xác nhận
- PO-08 — Dữ liệu cá nhân — Có yêu cầu xóa hồ sơ; đồng thời cần lịch sử tuyển và audit bất biến. — Retention, ẩn danh, sao lưu, export và danh sách talent pool sau xóa xử lý theo chính sách nào? — NFR-14,S5-06,S8-09 — Chưa xác nhận
- PO-09 — Số liệu báo cáo — Time-to-hire ghi từ duyệt REQ đến ứng viên nhận việc, nhưng 'nhận việc' có thể là chấp nhận offer hoặc ngày đi làm. — Chốt ngày bắt đầu/kết thúc; ứng viên áp nhiều vị trí, gộp trùng có đếm bao nhiêu hồ sơ? — S8-05,S8-07,S8-08 — Chưa xác nhận
- PO-10 — Chỉ số chất lượng ứng viên — S8-09 yêu cầu nguồn có ứng viên chất lượng nhất nhưng chưa có công thức. — Chất lượng theo đạt sàng lọc, score interview hay tỷ lệ nhận việc? — S8-09 — Chưa xác nhận
- PO-11 — Hiệu năng và môi trường — Danh sách <1,5 giây, dashboard <2 giây nhưng chưa rõ percentile và hạ tầng chuẩn. — Chốt p95/p99, điều kiện tải, network và bộ seed để kết quả nghiệm thu lặp lại được. — NFR-01,NFR-02,NFR-03 — Chưa xác nhận
- PO-12 — Phương thức xác thực web — JWT access/refresh có trong overview; chưa xác nhận refresh cookie hay local storage. — Chốt mô hình cookie + CSRF/CORS và quy tắc refresh token rotation. — S1-02,NFR-18,NFR-22 — Chưa xác nhận
- PO-13 — Kho tiềm năng — S5-06 gợi ý ứng viên phù hợp, overview loại AI matching khỏi phạm vi. — Gợi ý theo bộ lọc kỹ năng/chức danh đơn giản hay cần ML? — S5-06 — Chưa xác nhận
- PO-14 — Bộ ngưỡng rate limit — S4-03 chống spam và hạn chế số lần/IP/giờ nhưng không ghi con số. — Chốt ngưỡng, trả 429, thời gian reset và ngoại lệ mạng NAT. — S4-03,NFR-12 — Chưa xác nhận
