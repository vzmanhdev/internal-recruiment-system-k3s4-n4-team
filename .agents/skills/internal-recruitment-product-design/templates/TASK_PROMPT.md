# Task Prompt Template

Use the `Internal Recruitment Product Design Orchestrator` skill.

## Request
<Describe the feature/screen/workflow>

## Mandatory behavior
1. Open and filter the current Product Backlog Excel before doing design or code.
2. Identify the exact actor, Story IDs and Acceptance Criteria.
3. Pull related upstream/downstream stories that affect this workflow.
4. Compare requirements against the current frontend/backend/database.
5. Do not assume screenshots are business truth.
6. Flag any request that differs from Excel as a Change Request.
7. Fix information architecture before styling.
8. Use real API/database data; no production mock/hardcode.
9. Enforce permissions server-side.
10. Build loading, empty, error, success and permission states.
11. Validate responsive behavior down to 360px.
12. Apply SEO only to public recruitment pages; private/internal pages should not be indexed.
13. Self-review against the 90/100 quality gate before declaring completion.

## Deliverables
- Requirement Evidence Card
- Existing-state audit
- UI/UX proposal
- Database/API impact
- Implementation
- Tests
- Final traceability report
