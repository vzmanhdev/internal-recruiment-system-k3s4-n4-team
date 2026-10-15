# Evidence contract v1

## Scope and source authority

- Choose `as-is` for reverse engineering; describe what the current files support. A ORM model alone does not prove a deployed database schema; a UI label alone does not prove permission enforcement.
- Choose `as-designed` for requirement-driven design; distinguish specified behavior from new proposals.
- Choose `gap` only for an explicit comparison. Label mixed statuses visually and record the differences.
- Use sprint/story documents for business intent, backend permission checks for implemented authorization, routers plus registration for mounted APIs, model/migration files for declared persistence, and deployment files for configured runtime.
- Preserve disagreements: a sprint requirement and a code implementation can both be true sources while conflicting. Record the discrepancy and its impact; do not silently choose one.
- Do not invent unavailable actors, endpoints, services, queues, tables, integrations or hosting providers. Cite inferred relationships and explain the inference. Omit unknown details or list a question.
- Never import previous chat role lists as established requirements. Reconfirm each role from the supplied current project.
- Never include credentials, tokens, real candidate records or confidential payloads in diagrams.

## Stable identifiers and manifest

Use stable IDs such as `REQ-001`, `ACT-001`, `UC-001`, `ENT-001`, `CMP-001`, `REL-001`. Reuse the same ID for the same concept across diagrams. Prefer existing story IDs. A node can be a goal, participant, class, table, component, deployment node or documented state; a relationship can be an association, message, dependency, transition, include or extend.

Use this JSON structure:

```json
{
  "schema_version": 1,
  "requirements": [
    {"id":"REQ-001","label":"Example requirement","sources":[{"path":"docs/requirements.md","start_line":1,"end_line":3}]}
  ],
  "diagrams": [
    {
      "id":"D-001","path":"docs/diagrams/as-designed/usecase/example.puml",
      "view":"as-designed","type":"usecase","requirement_ids":["REQ-001"],
      "elements":[
        {"id":"ACT-001","label":"Example actor","kind":"actor","status":"required","sources":[{"path":"docs/requirements.md","start_line":1,"end_line":3}]},
        {"id":"UC-001","label":"Example goal","kind":"usecase","status":"required","sources":[{"path":"docs/requirements.md","start_line":1,"end_line":3}]}
      ],
      "relationships":[
        {"id":"REL-001","label":"performs","kind":"association","from":"ACT-001","to":"UC-001","status":"required","sources":[{"path":"docs/requirements.md","start_line":1,"end_line":3}]}
      ]
    }
  ]
}
```

Allowed statuses: `implemented`, `required`, `proposed`, `inferred`. Each implemented or required item needs at least one original code/requirement citation. Inferred items need citations plus `rationale`. Proposed items need `rationale`; omit sources if none exist. Do not cite the generated diagram or a generated inventory as proof of its own claims.

`as-is` permits implemented and explicitly labeled inferred items only. Put required-but-unimplemented features into an `as-designed` diagram or a gap report. Each source must use a project-relative path and a real 1-based inclusive line range. For DOCX, cite the extracted text line plus its OOXML paragraph/table-cell locator and retained original path/hash from extraction metadata. A traceable extract is acceptable evidence only when its provenance is verified; a generated inventory is not original evidence. Never invent Word page numbers from XML extraction. For spreadsheets/PDFs, retain the original file and create a text evidence extract with sheet/cell or page locators in each line; cite that extract and link its provenance to the original. Do not fabricate locators when extraction is blocked.

## Consistency and QA

- Match use case preconditions and results with sequence branches and persisted state.
- Reconcile actors with backend role policy, endpoints with mounted routers, entities with columns/constraints, and components with imports/calls.
- Represent authorization, missing records, validation failures and transaction rollback only where relevant and evidenced; mark proposed handling as proposed.
- List uncovered requirements, partially covered requirements and unsupported claims. Keep requirement coverage a human judgement; the audit script checks only linked IDs.
- Maintain `docs/design/traceability.md` linking requirement → use case → activity/sequence → class/entity → architecture where applicable. Use “N/A” with a reason rather than inventing a matching diagram.
- Record revision/commit when available, source inputs, renderer version, exact commands and syntax/visual/semantic review results. Regenerate affected diagrams after source changes; remove stale exports before presenting replacements.
- Never report “fully verified” if tools are missing, citations are merely present, or semantic/visual QA has not occurred.
