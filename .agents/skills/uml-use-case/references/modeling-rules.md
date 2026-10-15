# Use Case modeling rules

- Actor = an external role interacting with the chosen boundary, including a system/service when it exchanges meaningful information. The DB inside the system is not a business actor.
- Use case = an actor goal producing observable value. “Apply for a vacancy” can be a goal; “click Submit”, “check email format” and “insert a row” are usually internal steps.
- Authentication is normally a precondition for secured business use cases; do not attach `include Login` everywhere. Model Login separately when it is in scope.
- Include: required reused behavior at the insertion point. Dashed arrow from including base use case to included use case, label `<<include>>`.
- Extend: conditional supplementary behavior at an extension point; base is meaningful independently. Dashed arrow from extending use case to base, label `<<extend>>`. Record condition/extension point in the specification.
- Generalization: specialization can substitute for its parent role/behavior. Solid hollow triangle points from child to parent. Do not use it just to group departments or statuses.
- Sequence is not encoded by include/extend arrows. Approval order belongs in activity/sequence/state specifications.
- CRUD can be grouped as a management goal only if the scope and specification identify constituent outcomes. Avoid mixing “Manage all recruitment” with granular “Change candidate phone number” in one view.
- A rejected approval may be an alternate flow, not automatically a separate use case. Use independent actor goals as the deciding criterion.
- Draw actors with plain associations. Add a legend when statuses differ. Split diagrams by module/actor concern to limit crossings.

Notation reference: https://plantuml.com/use-case-diagram . PlantUML accepts syntax; it does not enforce these business modeling choices.
