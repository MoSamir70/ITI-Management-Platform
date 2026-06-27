# Feature Specification: User Management

**Feature Branch**: `feature/user-management`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: NadaFoudaa
**Phase**: 1 — Foundation
**Depends on**: 002-authentication
**Input**: CRUD for users with role-scoped creation (TM creates staff; StAffairs creates students), profile reads, deactivation.

## User Scenarios & Testing

### User Story 1 — Training Manager creates a Supervisor (Priority: P1)

The TM submits new staff details and the system creates a Supervisor account with a temporary password and `MustChangePassword=true`.

**Why this priority**: Without staff accounts, no other module is usable; supervisors gate all academic operations.

**Independent Test**: Integration test logs in as TM, POSTs to `/api/v1/users` with role=Supervisor, asserts 201 with a Location header and the user appears in `GET /users`.

**Acceptance Scenarios**:
1. **Given** an authenticated TM, **When** they POST a new Supervisor with all required fields, **Then** the response is 201 with the new user id and a temp password is generated and (in dev) returned in the response body for testing.
2. **Given** a TM submits a Supervisor with a duplicate email, **When** the request is processed, **Then** the response is 409 with code `email_already_exists`.
3. **Given** a Student Affairs user attempts to create a Supervisor, **When** they POST, **Then** the response is 403.

### User Story 2 — Student Affairs creates a Student (Priority: P1)

StAffairs submits full personal data (name, national id, phone, gender, DOB, group) and creates the student account.

**Why this priority**: Students are created in volume at intake start; this is the highest-throughput user-creation path.

**Acceptance Scenarios**:
1. **Given** an authenticated StAffairs user, **When** they POST a student with role=Student and a valid GroupId, **Then** the response is 201 and the user is enrolled in the group.
2. **Given** StAffairs attempts to create a TA, **When** they POST, **Then** the response is 403.
3. **Given** a duplicate national id, **When** the request arrives, **Then** the response is 409 with code `national_id_already_exists`.

### User Story 3 — Profile views are scope-bound (Priority: P1)

Each role can read profiles only within their permitted scope per blueprint Section 2.

**Acceptance Scenarios**:
1. **Given** a Supervisor of Track A, **When** they GET a student in Track A, **Then** the response is 200 with full personal data including national id.
2. **Given** the same Supervisor, **When** they GET a student in Track B, **Then** the response is 404 (scope-hidden — not 403 — to avoid existence leaks).
3. **Given** a TA, **When** they GET a student profile, **Then** national id and DOB are omitted from the response (per blueprint TA restrictions).

### User Story 4 — Deactivation (Priority: P2)

TM deactivates a user; the user can no longer log in but historical records remain.

**Acceptance Scenarios**:
1. **Given** an active user, **When** TM PATCHes `/users/{id}/deactivate`, **Then** `IsActive=false`, all refresh tokens are revoked, and subsequent login returns 401 with code `account_deactivated`.
2. **Given** a Supervisor with active track assignments, **When** TM attempts deactivation, **Then** the response is 409 with code `has_active_assignments` and a list of conflicting tracks.

### User Story 5 — Self-service profile read and edit (Priority: P2)

Any authenticated user can GET `/users/me` and PUT a limited set of fields (phone, photo).

**Acceptance Scenarios**:
1. **Given** any logged-in user, **When** they GET `/users/me`, **Then** the response is 200 with their profile.
2. **Given** a user PUTs a new phone, **When** processed, **Then** the field updates; attempts to PUT `Role` or `IsActive` are ignored.

### Edge Cases

- National id format validation (Egyptian 14-digit format for students).
- Photo upload size cap (2 MB) and content-type whitelist (jpeg/png).
- Email change requires re-verification (out of scope v1 — emails are immutable post-create).
- Concurrent deactivation by two TMs.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `POST /api/v1/users` restricted by role: TM may create any role except Student; StAffairs may create Students only.
- **FR-002**: System MUST expose `GET /api/v1/users` for TM only, with pagination (page, pageSize ≤ 100), filters (role, branch, isActive), and search (name, email).
- **FR-003**: System MUST expose `GET /api/v1/users/{id}` scope-checked per blueprint Section 2.
- **FR-004**: System MUST expose `PUT /api/v1/users/{id}` allowing TM to edit any field except password; StAffairs may edit student personal data only.
- **FR-005**: System MUST expose `PATCH /api/v1/users/{id}/deactivate` for TM, blocking when active assignments exist.
- **FR-006**: System MUST expose `GET /api/v1/users/me` and `PUT /api/v1/users/me` for self-service (phone, photo only).
- **FR-007**: System MUST generate a strong temporary password (16 chars, mixed) on create and set `MustChangePassword=true`.
- **FR-008**: System MUST validate Egyptian national id format for Student creation.
- **FR-009**: System MUST validate uniqueness of email globally and national id among Students.
- **FR-010**: System MUST hide national id and date of birth from TA responses for student profile reads.
- **FR-011**: System MUST audit every user create/update/deactivate event with actor id and timestamp.

### Key Entities

Uses the `Users` entity from spec 001. Adds no new tables; may add `UserAuditLog` (optional) for change tracking.

## Success Criteria

### Measurable Outcomes

- **SC-001**: StAffairs can create 100 students via API in under 60 seconds total wall clock.
- **SC-002**: 100% of role/scope combinations are covered by RBAC integration tests.
- **SC-003**: User search (`?q=...`) returns p95 under 200 ms on a 10k-user dataset.

## Assumptions

- Photos are stored on local disk under `wwwroot/uploads/users/{id}.{ext}` for v1; S3 abstraction deferred.
- Bulk student import (CSV) is out of scope; one-by-one creation only in v1.
- Email is the login credential; phone numbers are not used for authentication.
