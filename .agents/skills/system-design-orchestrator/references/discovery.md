# Discovery for an existing project

Use `rg --files` first; inspect project instructions and relevant files. If `rg` is missing use the host's file search. Exclude `.git`, `.venv`, `node_modules`, build output, lockfile noise and secret-bearing `.env` files. Inspect `.env.example` only for names, never secret values.

For Next.js: inspect route/page files and route handlers, API clients, server actions, middleware, auth/session checks, forms and state consumers. Resolve the real base URL config without printing secrets. UI role checks indicate presentation rules; confirm backend enforcement independently.

For FastAPI: trace `include_router`, prefixes, decorated endpoints, dependency injection, response schemas, status codes, service calls, exceptions and DB session handling. Show a separate repository layer only if one exists. If a handler calls SQLAlchemy directly, show the direct path.

For SQLAlchemy: inspect mapped classes, table names, ForeignKey, nullable, unique/index constraints, association tables and migrations. Distinguish declared relationships from constraints. Do not assume that database creation or an unapplied migration succeeded.

For infrastructure: inspect Dockerfile/compose, deployment manifests, reverse-proxy config, environment examples and documented startup commands. k3s in a project name is not evidence of a deployed Kubernetes cluster. Distinguish local SQLite from a configured PostgreSQL target; never claim both are active in one runtime without evidence.

For requirements: retain story IDs and acceptance criteria. Number normalized extracts, link sheet/cell/page provenance, and identify incomplete access. Treat registration roles, approval order, offer states and onboarding as unknown unless supplied sources establish them.

Freeze discovered source revision in the design report when git is available. Check for modified working files: the diagrams must reflect the working files actually read, not just the commit.

Official foundations, checked 2026-10-03:
- https://www.antigravity.google/docs/skills?tab=ide
- https://plantuml.com/
- https://mermaid.js.org/
- https://github.com/plantuml-stdlib/C4-PlantUML

These are foundations for format and tooling, not endorsements of this custom skill bundle. Recheck host discovery paths when installing on a newer version.
