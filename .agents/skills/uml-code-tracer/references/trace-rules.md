# Trace and UML semantics

- Trace registered routes including combined prefixes; a decorated function may never be mounted.
- Trace auth dependencies before handler work. A role field/UI visibility alone does not prove an authorization check.
- Distinguish validation before handler entry from errors in business code. Follow documented error mapping and return status.
- Trace DB queries, flush/commit/rollback and ownership checks. An ORM `relationship` declaration does not mean a query eagerly loads it.
- If no separate auth service/repository exists, draw the real functions/modules and direct calls. Omit unsupported infrastructure.
- Sequence: return arrows should return to the actual caller; close `alt`/`loop`/activation blocks. Avoid a participant called “System” alongside unexplained implementation modules.
- Activity: branch labels must be mutually interpretable; add explicit join/fork only for real concurrency. Do not equate asynchronous Python syntax with parallel business execution.
- Class: inheritance uses hollow triangle toward base; composition requires justified ownership/lifetime. Python imports are not class associations. HTTP DTOs, ORM classes and domain concepts are different views.
- State: transitions need source state, event, guard and target. Read operation/state-check code, not only constant declarations. Capture rollback/rejection/cancellation paths when they exist.
- In a design view, propose layers sparingly and attach rationale. Keep the proposal separate from the as-is representation.

Official syntax references:
- https://plantuml.com/sequence-diagram
- https://plantuml.com/class-diagram
- https://plantuml.com/activity-diagram-beta
- https://plantuml.com/state-diagram
