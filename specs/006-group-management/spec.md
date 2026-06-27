# Feature Specification: Group & Enrollment Management

**Feature Branch**: `feature/group-management`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: MoSamir70
**Phase**: 2 — Tracks & Courses
**Depends on**: 005-track-course-management
**Input**: Groups within a track; TA assignment to groups; student enrollment in a group (and consequently in track courses).

## User Scenarios & Testing

### User Story 1 — Create groups within a track (Priority: P1)

Supervisor or TM creates groups (e.g. Group A, Group B) under a track.

**Why this priority**: Students cannot be created without a group assignment (spec 003 FK).

**Acceptance Scenarios**:
1. **Given** a Supervisor of Track A, **When** they POST a group to Track A, **Then** the response is 201.
2. **Given** a duplicate group name within the same track, **When** POSTed, **Then** the response is 409 with code `group_name_exists_in_track`.

### User Story 2 — Assign TAs to a group (Priority: P1)

Supervisor or TM assigns one or more TAs (multiple allowed per group per blueprint Section 12).

**Acceptance Scenarios**:
1. **Given** a Supervisor and a TA user, **When** Supervisor POSTs `/groups/{id}/tas` with `userId`, **Then** the TA is added.
2. **Given** an attempt to assign a non-TA user, **When** POSTed, **Then** the response is 400 with code `invalid_ta_role`.
3. **Given** a TA already assigned, **When** re-assigned, **Then** the response is 409 with code `ta_already_assigned`.
4. **Given** a TA assigned to a group in another track, **When** assigned to this group, **Then** the response is 201 (TAs can serve multiple groups across tracks).

### User Story 3 — Student enrollment (Priority: P1)

When StAffairs creates a Student with a `GroupId` (per spec 003), the system automatically creates `StudentCourseEnrollments` rows for every course in that group's track.

**Why this priority**: Without auto-enrollment, every grade/attendance row would require manual enrollment first.

**Acceptance Scenarios**:
1. **Given** a track with 5 courses and a new student assigned to Group A, **When** the student is created, **Then** 5 `StudentCourseEnrollments` rows exist with `Status=Active`.
2. **Given** a new course added to an existing track, **When** the course is created, **Then** existing students in that track's groups are auto-enrolled.
3. **Given** a student transferred from Group A to Group B in the same track, **When** the transfer happens, **Then** their enrollments persist with updated `GroupId`.

### User Story 4 — TA scope visibility (Priority: P1)

A TA can list students only in groups they are assigned to (blueprint Section 12).

**Acceptance Scenarios**:
1. **Given** a TA assigned to Group A only, **When** they GET `/groups/A/students`, **Then** the response is 200 with names + emails (no national id per spec 003 FR-010).
2. **Given** the same TA, **When** they GET `/groups/B/students`, **Then** the response is 404.

### User Story 5 — Remove TA from group (Priority: P2)

Supervisor or TM removes a TA assignment.

**Acceptance Scenarios**:
1. **Given** an existing assignment, **When** Supervisor DELETEs `/groups/{gid}/tas/{userId}`, **Then** the row is removed and the TA loses scope for that group immediately (next request returns 404 for that group).

### Edge Cases

- Removing the last TA from a group: allowed (group can exist without TAs).
- Removing a TA who has entered lab grades: the grade rows remain; the TA loses ability to edit them.
- Student transfer between tracks: out of scope — requires manual deactivation + recreate in v1.
- Bulk enrollment for a backfill: out of scope for v1.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `GET /tracks/{id}/groups`, `POST /tracks/{id}/groups`, `PUT /groups/{id}`, `PATCH /groups/{id}/archive`.
- **FR-002**: System MUST expose `GET /groups/{id}/tas`, `POST /groups/{id}/tas` (body: `{userId}`), `DELETE /groups/{id}/tas/{userId}`.
- **FR-003**: System MUST expose `GET /groups/{id}/students` scope-checked.
- **FR-004**: Group create/edit/archive MUST be allowed for TM and the track's Supervisor.
- **FR-005**: TA assignment MUST be allowed for TM and the track's Supervisor; the assigned user MUST have role `TA`.
- **FR-006**: System MUST auto-enroll students in all active track courses on student creation or course creation events (domain event handler).
- **FR-007**: System MUST reject removal of a group with active student enrollments (409 `group_has_students`).
- **FR-008**: System MUST scope group/student listings per role (Section 2 matrix).
- **FR-009**: Group name MUST be unique within a track.

### Key Entities

`Groups`, `GroupTAs`, `StudentCourseEnrollments` from spec 001.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Creating a student auto-enrolls them in all track courses in under 300 ms with 20 courses.
- **SC-002**: TA scope is enforced by integration tests covering all CRUD attempts cross-group.
- **SC-003**: Group listing endpoints p95 under 150 ms.

## Assumptions

- Group capacity is not enforced in v1 (no max student count per group).
- Student transfer is not modelled — for v1, transferring a student means deactivate + recreate.
