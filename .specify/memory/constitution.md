# ITI Branch Portal Constitution

The non-negotiable principles guiding every spec, plan, and implementation in
this repository. Specs and PRs that contradict the constitution must either be
revised or accompanied by an explicit, documented exception.

## Core Principles

### I. Role-Based Access Control is Non-Negotiable

Every API endpoint, query, and UI route MUST enforce the five-role model
(TrainingManager, Supervisor, TA, StudentAffairs, Student) as defined in the
blueprint's Section 2 permissions matrix. A feature that cannot articulate its
matrix row does not ship. Cross-scope data leaks (e.g. one supervisor seeing
another track's grades) are treated as security defects, not bugs.

### II. Scope-Bound Queries

Repositories and services MUST scope reads/writes to the caller's organisational
boundary: a Supervisor query for grades is scoped to their track; a TA query is
scoped to their group; a Student query is scoped to themselves. There is no
"unscoped admin helper" shared between roles — TrainingManager bypass is
implemented as an explicit policy check, not as the absence of a check.

### III. Spec-First, Test-Backed

No production code without a spec under `specs/NNN-feature-name/`. Each spec
ships with acceptance scenarios; each acceptance scenario maps to at least one
integration test before the feature merges to `develop`. Unit tests cover
business rules (grade calculation, absence percentage, KPI eligibility);
integration tests cover RBAC enforcement on every endpoint.

### IV. Migrations Are Code Reviews

Schema changes ship as EF Core migrations in their owning feature branch.
Migrations MUST be reviewed alongside the entities that drive them, MUST be
reversible (Down() implemented), and MUST NOT be edited after merge — new
changes ship as new migrations.

### V. Stitch Designs Are the UI Source of Truth

Frontend implementation follows the Stitch screens under
`stitch_iti_training_management_portal/`. Deviations require an inline comment
citing the reason. UI components are built from Angular Material primitives;
custom CSS is allowed only where Material cannot express the Stitch design.

## Technology Stack (Fixed)

- **Backend**: ASP.NET Core 8, EF Core 8, SQL Server (LocalDB for dev)
- **Auth**: ASP.NET Core Identity, JWT bearer (15 min access), refresh token (7 days, httpOnly cookie)
- **Frontend**: Angular 17+ standalone components, Signals, Angular Material, RxJS
- **API contract**: REST under `/api/v1`, JSON, problem-details for errors (RFC 7807)
- **Testing**: xUnit + FluentAssertions (backend), Jasmine + Karma (frontend), Testcontainers for DB integration tests
- **Tooling**: dotnet CLI, Angular CLI, npm; CI must pass `dotnet test` and `ng test --watch=false` before merge

Substituting any of the above requires a constitution amendment.

## Workflow & Branching

- Branching model from `CLAUDE.md`: `main ← develop ← feature/*`. Feature
  branches cut from latest `develop`.
- One spec = one feature branch = one PR to `develop`. No mixed-scope branches.
- Conventional commit subjects (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Each PR description links its spec file and lists the acceptance scenarios it
  covers.
- Force-push and direct push to `main`/`develop` are blocked.

## Quality Gates

A PR merges to `develop` only when:

1. All acceptance scenarios in the spec have at least one passing test.
2. `dotnet test` and `ng test --watch=false` are green locally.
3. RBAC integration tests cover every new endpoint with negative cases (wrong
   role → 403, wrong scope → 403/404).
4. New entities ship with their migration and the migration applies cleanly to
   an empty database and to the previous develop snapshot.
5. No `TODO`/`FIXME` left in shipped code without a tracking issue link.

## Governance

This constitution supersedes individual preferences and prior conventions. PRs
that violate a principle without an inline exception note will be sent back.
Amendments require a PR to this file with rationale; the PR author lists which
specs/plans the change impacts.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
