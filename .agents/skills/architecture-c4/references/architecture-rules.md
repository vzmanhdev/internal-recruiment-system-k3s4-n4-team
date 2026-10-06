# Architecture and persistence rules

## C4

- Context: one system of interest, its external people and software systems.
- Container: separately running applications/data stores within that system, plus relevant external people/systems. A C4 container is a runtime abstraction, not necessarily a Docker container.
- Component: meaningful internals of one container. Do not mix DB tables, physical servers and high-level systems on the same abstraction level.
- Relationships: label purpose, direction and protocol/technology only when known. Browser → API is not proof of an API Gateway. Background jobs/queues require call/config evidence.
- C4 Deployment: deploy containers onto evidenced nodes; do not manufacture replication, clusters, scaling, load balancers or regions.

## ERD

Use a physical view for declared schemas; cite the actual ORM/migration definitions. Use types and keys supported by the selected renderer version. Put extra constraints in a companion data dictionary if Mermaid cannot represent them faithfully.

For `PARENT ||..o{ CHILD`, each CHILD has exactly one PARENT and PARENT may have zero or many CHILD records. If CHILD.parent_id is nullable, the parent-side cardinality may be `|o`. A foreign key does not require every parent to have a child. A unique child FK constrains the child-side maximum to one. Resolve many-to-many using an existing association table in a physical view; only use a conceptual many-to-many line in a named conceptual view.

Use dashed non-identifying relationships when the parent key does not participate in child identity; solid identifying edges require a supported identifying dependence. Do not interpret cascade delete alone as composite primary-key identity.

ORM relationships without ForeignKey may describe application links; mark them as inferred unless the join condition/constraints establish them. Distinguish nullable from optional object fields in API schemas. On-delete rules, composite keys, partial unique indexes and enum values may need companion notes.

## Decisions

Record context, options, evidence, decision status, consequences and validation. Defaults are suggestions, not deployed facts. Separate security controls observed in code from controls proposed for later work.

Official sources:
- https://c4model.com/diagrams
- https://github.com/plantuml-stdlib/C4-PlantUML
- https://plantuml.com/stdlib
- https://mermaid.js.org/syntax/entityRelationshipDiagram
