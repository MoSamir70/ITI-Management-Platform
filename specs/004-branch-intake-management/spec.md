# Feature Specification: Branch & Intake Management

**Feature Branch**: `feature/branch-intake-management`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: MoSamir70
**Phase**: 1 — Foundation
**Depends on**: 003-user-management
**Input**: CRUD for Branches and Intakes by the Training Manager.

## User Scenarios & Testing

### User Story 1 — TM creates a Branch (Priority: P1)

The TM provisions a new physical branch (e.g. Cairo) with a code and active flag.

**Why this priority**: Branches are the root of the org hierarchy; nothing under them can exist without one.

**Acceptance Scenarios**:
1. **Given** an authenticated TM, **When** they POST `{name: "Cairo", code: "CAI"}`, **Then** the response is 201 with the branch id.
2. **Given** a duplicate branch code, **When** POSTed, **Then** the response is 409 with code `branch_code_exists`.
3. **Given** a non-TM role, **When** they POST a branch, **Then** the response is 403.

### User Story 2 — TM creates an Intake under a Branch (Priority: P1)

The TM creates an intake (e.g. Intake 45) with start/end dates.

**Acceptance Scenarios**:
1. **Given** an existing branch, **When** TM POSTs `/branches/{id}/intakes` with valid dates, **Then** the response is 201.
2. **Given** an intake where end ≤ start, **When** POSTed, **Then** the response is 400 with code `invalid_date_range`.
3. **Given** an intake with overlapping number for the same branch, **When** POSTed, **Then** the response is 409 with code `intake_number_exists_in_branch`.

### User Story 3 — Listing branches and intakes (Priority: P2)

Authenticated staff can list branches and their intakes for reference (dropdowns, filters).

**Acceptance Scenarios**:
1. **Given** any staff role (TM, Supervisor, TA, StAffairs), **When** they GET `/branches`, **Then** the response is 200 with active branches.
2. **Given** a Student, **When** they GET `/branches`, **Then** the response is 403 (students don't browse the org tree).

### User Story 4 — Soft-deactivation (Priority: P3)

TM can archive a Branch or Intake without losing historical records.

**Acceptance Scenarios**:
1. **Given** an active branch with intakes, **When** TM PATCHes `/branches/{id}/archive`, **Then** `IsActive=false` and the branch disappears from default listings but remains queryable with `?includeArchived=true`.
2. **Given** an attempt to archive a branch with active (current) intakes, **When** processed, **Then** the response is 409 with code `has_active_intakes`.

### Edge Cases

- Time zone of `StartDate`/`EndDate` — stored as `DATE` in branch local time; comparisons assume Africa/Cairo.
- Two TMs creating identical branches simultaneously.
- Renaming a branch while reports are running.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose CRUD endpoints for Branches: `GET /branches`, `GET /branches/{id}`, `POST /branches`, `PUT /branches/{id}`, `PATCH /branches/{id}/archive`.
- **FR-002**: System MUST expose CRUD endpoints for Intakes nested under branch: `GET /branches/{id}/intakes`, `POST /branches/{id}/intakes`, `PUT /intakes/{id}`, `PATCH /intakes/{id}/archive`.
- **FR-003**: All write endpoints MUST require TM role.
- **FR-004**: Read endpoints MUST require any staff role (not Student).
- **FR-005**: Branch code MUST be globally unique and 2–10 chars uppercase.
- **FR-006**: Intake number MUST be unique within a branch (composite uniqueness).
- **FR-007**: Listing endpoints MUST default to `IsActive=true` and accept `?includeArchived=true`.
- **FR-008**: All listing endpoints MUST support pagination (`page`, `pageSize`).

### Key Entities

`Branches` and `Intakes` from spec 001. No new tables.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A TM can fully provision a new branch with 3 intakes in under 60 seconds via the API.
- **SC-002**: All endpoints respond p95 under 150 ms with 1000 branches/3000 intakes.
- **SC-003**: 100% endpoint coverage in RBAC integration tests.

## Assumptions

- Branches are not geo-fenced; no map integration in v1.
- Intake dates are reference data only — they don't drive scheduling logic in this spec.
