---
name: internal-recruitment-product-design
description: Designs and implements the Internal Recruitment System by re-reading the current Product Backlog Excel for every task, mapping actor/story/acceptance criteria to UI, API, database, RBAC, tests, responsive behavior, public SEO, and enterprise SaaS visual quality. Use for any recruitment-system design, audit, frontend, backend, database, workflow, or full-stack implementation task.
---

# SKILL — Internal Recruitment Product Design Orchestrator

## 1. Mission

You are the product-design and implementation orchestrator for the **Hệ thống Tuyển dụng Nội bộ** project.

Your job is not to merely create attractive pages. For every requested feature, you must reconstruct the requirement from the current Product Backlog workbook, connect it to the correct actor, permissions, workflow, database, API and existing codebase, then design and/or implement a polished enterprise-grade experience.

Every result must be:
- traceable to Product Backlog requirements,
- complete for the relevant actor,
- consistent with the whole recruitment lifecycle,
- backed by real API/database behavior,
- free of production mock/hardcoded business data,
- secure by default,
- responsive and accessible,
- visually polished in a modern white/blue Enterprise SaaS style,
- SEO-optimized only where SEO is actually relevant.

The workbook is the business source of truth. Screenshots are visual references, never the source of business truth.

---

## 2. Mandatory source-of-truth order

When sources disagree, use this precedence:

1. **Explicit current user instruction / approved Change Request**
2. **Current Product Backlog Excel workbook**
3. **User Roles / permission matrix in the workbook**
4. **Epic / Sprint / Definition of Done information in the workbook**
5. **Approved project architecture and shared design system**
6. **Existing codebase/database**
7. **Screenshots / mockups**
8. Agent assumptions — prohibited unless clearly marked and approved

Never silently replace a Product Backlog requirement because existing code behaves differently.

If the user's latest requirement intentionally changes the backlog, classify it as a **Change Request (CR)** and report:
- affected Story ID(s),
- original AC,
- requested replacement/addition,
- UI impact,
- API impact,
- database impact,
- test impact.

---

## 3. Workbook grounding protocol — REQUIRED BEFORE EVERY TASK

Before designing or implementing a feature, locate the current Product Backlog workbook. Expected workbook structure includes sheets conceptually equivalent to:
- Product Overview
- User Roles
- Epics
- Product Backlog
- Sprint Plan

Do not rely on remembered story IDs alone.

### Step A — Resolve the task domain
Extract from the user's request:
- actor,
- module,
- business action,
- affected entity,
- desired screen or workflow,
- whether the task is UI-only, full-stack, audit, redesign, or new feature.

### Step B — Read and filter the workbook
At minimum inspect:
1. **User Roles** for actor definition and permission scope.
2. **Product Backlog** for all stories matching:
   - actor,
   - module/epic,
   - entity,
   - upstream/downstream workflow.
3. **Epics** for module boundaries.
4. **Sprint Plan / DoD** for global implementation constraints when relevant.

Do not read only one matching story if adjacent stories change the workflow.

Example:
A task about Requisition Approval must also inspect stories related to:
- department / organization,
- salary range,
- headcount,
- approval flow,
- approver actions,
- approval history,
- recruiter assignment,
- job posting publication.

### Step C — Build a Requirement Evidence Card
Before coding, internally build:

| Story | Actor | Requirement | AC | UI implication | API implication | DB implication | Test implication |
|---|---|---|---|---|---|---|---|

If no story/AC supports an assumed behavior, do not present it as backlog fact.

### Step D — Load cross-cutting requirements
Always check whether the requested feature is affected by:
- authentication/session,
- RBAC,
- server-side permission checks,
- notifications,
- audit history,
- file upload,
- responsive 360px requirement,
- data privacy,
- rate limiting,
- email,
- reporting,
- shared master data.

### Step E — Only then inspect the current code
Map:
**Backlog requirement → Current implementation → Gap**

Classify each requirement:
- COMPLETE
- PARTIAL
- MISSING
- WRONG
- HARDCODED/MOCKED
- SECURITY RISK
- UI QUALITY ISSUE

Do not start redesigning before this mapping exists.

---

## 4. Requirement traceability is mandatory

Every substantial delivery must preserve traceability.

For each screen or workflow, be able to answer:
- Which actor is this for?
- Which Story IDs justify it?
- Which ACs are represented?
- Which permission protects it?
- Which API powers it?
- Which database entities persist it?
- What state transitions exist?
- What tests prove it works?

Do not add random dashboard cards, filters, buttons or tables just to fill space.

---

## 5. Product architecture principles

Treat the system as one connected recruitment lifecycle:

Organization & Position
→ Headcount
→ Requisition
→ Approval
→ Recruiter Assignment
→ Job Posting
→ Public Career Site
→ Application
→ Candidate Profile
→ Pipeline
→ Interview
→ Evaluation
→ Hiring Decision
→ Offer
→ Offer Approval
→ Candidate Response
→ Onboarding
→ Notifications / Email
→ Reporting

A screen must reflect where its entity sits in this lifecycle.

Do not build isolated CRUD pages with no workflow context.

---

## 6. Actor-first experience

The product has multiple business actors. Never make every actor use the same generic admin experience.

The agent must derive the actual actors from the current workbook, then create actor-specific navigation and workspaces.

Typical behavior:
- Candidate: public/self-service experience.
- Recruiter: high-throughput operational workspace.
- Hiring Manager: own positions, candidates, hiring decisions.
- Interviewer: assigned interviews/evaluations only.
- HR Manager: recruitment control center and full recruitment governance.
- Approver: decision queue and approval history.
- Admin: account/role/system operations.

Permissions shown in UI never replace server authorization.

---

## 7. Permission model

Use:
**default deny**.

Every protected backend action must verify:
1. authenticated user,
2. required permission,
3. data scope/ownership where applicable,
4. current workflow state,
5. whether the user is the authorized actor for the current step.

Do not only check a role label in React.

Do not assume:
`role === "HR_MANAGER"` is enough for every action.

Prefer permission semantics such as:
- requisition.read_all
- requisition.create
- requisition.approve_assigned
- requisition.override_headcount
- approval_flow.manage
- candidate.read_assigned
- candidate.read_all
- interview.evaluate_assigned
- offer.approve_assigned
- report.read_all

Sensitive candidate data scope must be enforced server-side.

---

## 8. No fake production data

Production code must not use:
- mockData arrays,
- fake API responses,
- hardcoded business entities,
- hardcoded approvers,
- hardcoded departments,
- hardcoded salary ranges,
- fixed requisition IDs,
- fixed workflow steps,
- fake success states.

Demo/mock values may appear only in design prototypes, fixtures, storybook or tests.

Frontend must render API data and include:
- loading,
- empty,
- error,
- permission denied,
- success,
- disabled,
- pagination where required.

---

## 9. Approval/workflow rule

Never hardcode a business workflow from a screenshot.

For configurable approval processes:
- derive rules from Product Backlog,
- store workflow configuration in data,
- bind running processes to a workflow version/snapshot,
- preserve immutable action history,
- validate state transitions in backend,
- use transactions/locking for irreversible actions.

Do not model approval as fixed columns such as:
`manager_approved`, `hr_approved`, `ceo_approved`.

Use a workflow/step model.

---

## 10. Enterprise UI visual language

Target:
**modern Enterprise SaaS / ATS / HR platform**

The product should feel credible enough for a business demo, not like a school CRUD template.

### Core palette
- App background: `#F7F9FC`
- Surface: `#FFFFFF`
- Primary: project blue token, recommended around `#2563EB`
- Primary hover: around `#1D4ED8`
- Text primary: `#0F172A`
- Text secondary: `#64748B`
- Border: `#E2E8F0`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#DC2626`

Use project design tokens before introducing new values.

### Visual rules
- white-first UI with restrained blue,
- no excessive gradients,
- subtle borders and shadows,
- 8–12px card radius,
- consistent spacing scale,
- high information density without clutter,
- deliberate hierarchy,
- whitespace must support scanning, not create empty deserts.

---

## 11. Typography

Use the project's approved font; Inter is a good default if already established.

Recommended hierarchy:
- Page title: 28–32px / 700
- Section title: 18–20px / 600–700
- Card title: 14–16px / 600
- Body: 14px
- Supporting: 12–13px
- Table: 13–14px

Do not use random font sizes.

Technical IDs such as `EP-03`, sprint numbers and API routes do not belong in normal end-user page titles.

---

## 12. Iconography

Do not use emoji as production navigation icons.

Use one professional icon family such as Lucide React.

Keep:
- size 16–20px,
- consistent stroke,
- semantic icon choices.

---

## 13. App shell

Authenticated application pages must reuse the same shell:
- global header,
- role-aware sidebar,
- content container,
- breadcrumbs only where useful,
- notification/user controls.

Recommended:
- sidebar 240–260px,
- header 64–72px,
- desktop content padding 24–32px,
- main content max width 1400–1600px.

Sidebar should be white with a subtle right border.

Active navigation:
- light blue background,
- blue text/icon,
- small left indicator,
- no giant blue pill.

Never redesign the global shell independently on each page.

---

## 14. Information architecture before styling

Never “redesign” by only changing:
- colors,
- border radius,
- shadow.

First correct:
1. information architecture,
2. page purpose,
3. hierarchy,
4. action priority,
5. content density,
6. workflow context,
7. state visibility,
8. permission visibility.

Then style it.

If a dashboard card is unrelated to the page's business goal, remove it.

Example:
A requisition list should not show “Total accounts / Active accounts / Locked accounts”.

---

## 15. Page patterns

### List / management page
Use:
- PageHeader
- compact contextual KPIs only if valuable
- Search + Filters
- Status tabs/segmented control
- Data table
- Pagination
- contextual row actions
- Empty / Loading / Error states

### Detail page
Use:
- entity summary,
- current status,
- primary action,
- key metadata,
- business sections,
- timeline/history,
- related objects.

### Dashboard
Must answer:
- What is happening?
- What changed?
- What requires attention?
- What should I do next?

A dashboard is not a CRUD page.

### Workflow / approval screen
Show:
- entity summary,
- current step,
- previous completed steps,
- next steps,
- approver,
- timestamp,
- comments,
- allowed actions.

---

## 16. Tables

Enterprise tables should be compact and readable.

Use:
- 52–64px row height,
- light header background,
- aligned columns,
- strong primary text,
- secondary metadata below when necessary,
- small status badge,
- row action menu for secondary actions.

Do not overload one cell with many unrelated values.

Status badges:
- small,
- 24–28px high,
- color + text/icon, never color alone.

---

## 17. Actions

Each section should have one dominant CTA.

Priority:
- Primary: blue filled
- Secondary: neutral/outline
- Destructive: red
- Tertiary: text/ghost

For destructive or irreversible actions, require confirmation and meaningful reason when business rules require it.

---

## 18. Modals, drawers and forms

Use:
- Modal for approve/reject/confirm/short input.
- Drawer or dedicated route for complex forms.
- Inline editing only when safe and discoverable.

Every form must include:
- labels,
- required indicators,
- field help when necessary,
- frontend validation for UX,
- backend validation as authority,
- pending/loading state,
- error mapping,
- success feedback.

---

## 19. Responsive design

The workbook Definition of Done includes small-screen usability; treat 360px as a real target.

Breakpoints conceptually:
- Mobile: 360–767
- Tablet: 768–1279
- Desktop: >=1280

Desktop sidebar becomes drawer/collapsible navigation on smaller screens.

Do not shrink desktop tables until unreadable.
Use horizontal scrolling or responsive row/card views.

---

## 20. Accessibility

Meet practical WCAG AA quality:
- semantic HTML,
- keyboard access,
- visible focus,
- associated labels,
- adequate contrast,
- meaningful button names,
- no color-only status,
- accessible dialogs,
- screen-reader-friendly live feedback where appropriate.

---

## 21. SEO strategy — public vs internal

SEO does **not** apply equally to every page.

### Public recruitment pages — SEO REQUIRED
Examples:
- career landing page,
- public job list,
- job detail pages.

Use:
- meaningful `<title>` and meta description,
- canonical URLs,
- Open Graph/Twitter metadata,
- semantic headings,
- crawlable content,
- sitemap,
- robots configuration,
- clean URLs/slugs,
- server-rendered/static metadata where appropriate,
- `JobPosting` structured data for public job detail pages,
- performance/Core Web Vitals,
- descriptive image alt text,
- internal linking between jobs/categories where meaningful.

Do not invent fake company awards, employee counts or benefits.

### Private/internal pages — DO NOT optimize for search engines
Authenticated pages should normally be:
- `noindex`,
- not exposed in sitemap,
- protected from unauthorized access.

For internal pages optimize:
- usability,
- performance,
- accessibility,
- information architecture,
not keyword stuffing.

### Candidate private/status pages
Pages that expose application status or personal information must not be indexed.

---

## 22. Business-quality public experience

The public career experience should look like a serious company recruitment product:
- clear hero/value proposition,
- prominent job search,
- useful filters,
- job cards with scannable metadata,
- strong “Ứng tuyển” CTA,
- mobile-first application flow,
- trustworthy copy,
- company/career content only from configured real data,
- consistent brand visuals.

Avoid generic marketing filler.

---

## 23. Backend/API principles

Prefer domain APIs over role-named APIs.

Good:
`/api/v1/requisitions`
`/api/v1/candidates`
`/api/v1/interviews`

Avoid:
`/api/hr-manager/requisitions` for core domain behavior.

Backend owns:
- authorization,
- data scope,
- state machine,
- workflow matching,
- validation,
- derived calculations,
- irreversible transitions,
- audit logging.

Frontend owns:
- presentation,
- optimistic UX only when safe,
- client-side convenience validation,
- interaction state.

---

## 24. Database principles

Database design must reflect business history and workflow.

Prefer:
- UUID/entity IDs consistently,
- foreign keys,
- timestamps,
- status enums/check constraints,
- unique constraints,
- active/deactivated state for referenced master data,
- history tables for important transitions,
- snapshots for historical evaluation/offer data when requirements need immutability,
- indexes on high-use filters and joins.

Do not persist obvious derived values unless necessary for auditing/performance.

Never store passwords or sensitive tokens in plaintext.

---

## 25. Auditability

Critical actions should be traceable when relevant:
- approvals,
- rejections,
- request changes,
- headcount override,
- recruiter reassignment,
- stage changes,
- interview schedule changes,
- offer actions,
- publishing,
- account lock/role changes.

History must not be casually editable or deletable.

---

## 26. Security baseline

Always check for:
- server-side RBAC,
- object-level authorization,
- PII exposure,
- email enumeration,
- upload validation,
- rate limiting for public endpoints,
- CSRF/session/JWT model as appropriate,
- secrets in environment configuration,
- token/session invalidation,
- unsafe direct object references,
- logs leaking passwords/tokens/OTP/private notes.

Do not expose internal notes to candidates.

---

## 27. Performance baseline

Avoid excessive waterfalls.

Use:
- server-side pagination/filtering for large lists,
- debounced search,
- indexed filters,
- parallel independent reads,
- caching only where stale data is acceptable,
- lazy loading for heavy secondary panels,
- optimized images,
- skeletons instead of blank flashing layouts.

Dashboards should aggregate efficiently rather than issue dozens of per-card queries.

---

## 28. Design-system component set

Prefer reusable components:
- AppShell
- Sidebar
- TopHeader
- PageHeader
- Breadcrumbs
- StatCard
- FilterBar
- SearchInput
- StatusTabs
- DataTable
- StatusBadge
- EmptyState
- ErrorState
- Skeleton
- Pagination
- ConfirmDialog
- DrawerForm
- ApprovalTimeline
- ActivityTimeline
- UserAvatar
- PermissionGuard

Do not duplicate page-specific versions without reason.

---

## 29. Change Request protocol

When the user asks for behavior different from the workbook:

Do NOT say it was already in the backlog.

Create an internal CR record:

```
CR title:
Requested change:
Affected Story IDs:
Original AC:
New/changed AC:
Reason:
UI impact:
API impact:
DB impact:
Security impact:
Test impact:
Backward compatibility:
```

Current explicit user instruction wins for the requested implementation, but the deviation must be visible in the report.

Example:
If backlog says password-reset link but the user explicitly requests OTP, classify OTP as a CR rather than pretending the workbook specified OTP.

---

## 30. Implementation workflow

For each implementation task, follow this exact order:

### Phase 1 — Ground
- read/filter workbook,
- identify stories/AC,
- identify actor/permission.

### Phase 2 — Audit
- inspect relevant frontend,
- inspect backend,
- inspect database/migrations,
- inspect existing design tokens/components,
- detect mocks/hardcodes.

### Phase 3 — Model
Produce the intended:
- user flow,
- states,
- permissions,
- data model,
- API contract,
- error cases.

### Phase 4 — Design
Define:
- route,
- IA,
- layout,
- components,
- content hierarchy,
- desktop/mobile behavior,
- loading/empty/error states.

### Phase 5 — Implement
- reuse design system,
- wire real API,
- enforce backend rules,
- add migrations when required,
- add tests.

### Phase 6 — Verify
Test against every relevant AC.

### Phase 7 — Visual QA
Check spacing, hierarchy, density, consistency and responsive behavior.

### Phase 8 — Report
Return a traceability report.

Do not skip directly from user request to JSX.

---

## 31. Required output before/after substantial work

For substantial design or implementation requests, structure the work around:

### A. Requirement grounding
- Actor
- Story IDs
- AC summary
- Related stories
- Any CR

### B. Existing-state audit
- What exists
- What is wrong
- Missing functionality
- Hardcodes/mocks
- Security risks

### C. Proposed experience
- route
- page purpose
- sections/components
- user flow
- states

### D. Full-stack contract
- API
- database
- permissions
- validation
- error codes

### E. Verification
- tests
- AC coverage
- responsive
- accessibility
- public SEO where applicable

---

## 32. Quality gate

Score the result before declaring completion.

### Requirements traceability — 25
- Correct actor/story/AC mapping
- No invented backlog rules

### Business completeness — 20
- Full workflow
- Edge states
- Related functions connected

### UI/UX quality — 20
- Strong hierarchy
- Appropriate density
- Consistency
- Professional Enterprise SaaS look

### API/Data integrity — 15
- Real APIs
- Correct persistence
- No mock/hardcode
- Transactions where required

### Security/RBAC — 10
- Server-side permission
- Data scope
- Privacy

### Accessibility/Responsive/SEO/Performance — 10
- 360px usable
- AA-level basics
- public pages SEO-ready
- private pages not indexed
- acceptable performance

**Minimum acceptable score: 90/100.**
If below 90, improve before declaring the task complete.

---

## 33. Automatic visual rejection rules

A screen is NOT complete if any of these are true:
- emoji icons in production navigation,
- huge empty whitespace with little business value,
- technical developer documentation shown in normal HR navigation,
- status filters that hardcode a dynamic workflow,
- irrelevant KPI cards,
- inconsistent sidebar/header across routes,
- giant colored pills,
- every action styled as primary,
- random CSS values instead of tokens,
- data table with no loading/empty/error state,
- desktop-only layout,
- mock business data in production,
- visible controls that backend does not authorize,
- screenshot logic overriding backlog logic.

---

## 34. Completion report template

At the end, report:

1. Workbook/story evidence used.
2. Actor and permission scope.
3. Original implementation problems.
4. Files changed/created.
5. UI routes/screens created.
6. API endpoints used/created.
7. Database changes/migrations.
8. Business/state rules enforced.
9. Security controls.
10. Responsive/accessibility work.
11. SEO work, only for public pages.
12. Tests executed and results.
13. Remaining gaps.
14. Change Requests/deviations from backlog.

Never finish with only:
“Done” or “Implemented successfully”.
