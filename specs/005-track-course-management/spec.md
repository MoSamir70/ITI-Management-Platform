# Feature Specification: Track & Course Management

**Feature Branch**: `feature/track-course-management`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: MoSamir70
**Phase**: 2 — Tracks & Courses
**Depends on**: 004-branch-intake-management
**Input**: Tracks created by TM with one assigned Supervisor; Courses created by Supervisor (or TM) under their track with grading mode and hours.

## User Scenarios & Testing

### User Story 1 — TM creates a Track and assigns a Supervisor (Priority: P1)

The TM creates a track (e.g. Full Stack .NET) under an Intake and assigns exactly one Supervisor.

**Why this priority**: Tracks are the academic unit. Without one, no courses, students, or grades exist.

**Acceptance Scenarios**:
1. **Given** an existing intake and a Supervisor user, **When** TM POSTs a track with `supervisorId`, **Then** the response is 201 and the track is queryable by both TM and the assigned Supervisor.
2. **Given** an attempt to assign a non-Supervisor user as supervisor, **When** POSTed, **Then** the response is 400 with code `invalid_supervisor_role`.
3. **Given** an attempt to assign a Supervisor already assigned to another track in the same intake, **When** POSTed, **Then** the response is 409 with code `supervisor_already_assigned_in_intake` (one supervisor : one track per intake per blueprint Section 1.2).

### User Story 2 — Supervisor adds a Course to their track (Priority: P1)

A Supervisor creates a Course with name, instructor (free text), lecture/lab/self-study hours, grading mode, KPI flags, hasExam.

**Acceptance Scenarios**:
1. **Given** a Supervisor of Track A, **When** they POST a course to Track A with `gradingMode="GradesAndAbsence"`, **Then** the response is 201.
2. **Given** the same Supervisor, **When** they POST a course to Track B, **Then** the response is 403.
3. **Given** invalid grading mode value, **When** POSTed, **Then** the response is 400 with the allowed enum values.
4. **Given** negative hour values, **When** POSTed, **Then** the response is 400.

### User Story 3 — TM toggles KPI flags at the track level (Priority: P2)

TM (or Supervisor for their own track) enables/disables Certificate and Freelance KPIs at the track level; per-course overrides remain possible.

**Acceptance Scenarios**:
1. **Given** a track with `certificateKpiEnabled=false`, **When** Supervisor PATCHes to enable it, **Then** the response is 200 and student-side KPI submission opens.
2. **Given** a course with explicit `certificateKpiEnabled=true`, **When** the track-level flag is false, **Then** the course-level value wins (effective = true).

### User Story 4 — Listing courses for a track (Priority: P1)

Students enrolled in a track see the full course list (read-only); TAs see their assigned courses; StAffairs sees the course list (no grades).

**Acceptance Scenarios**:
1. **Given** a Student in Track A, **When** they GET `/tracks/{a}/courses`, **Then** the response is 200 with course list including hours and grading mode but never grades.
2. **Given** a Student in Track A, **When** they GET `/tracks/{b}/courses`, **Then** the response is 403.
3. **Given** a TA, **When** they GET `/tracks/{a}/courses`, **Then** only the courses in groups they are assigned to are returned.

### User Story 5 — Archive a course (Priority: P3)

Courses can be archived (Status=Archived) after intake completion without deleting grade history.

**Acceptance Scenarios**:
1. **Given** an active course, **When** Supervisor PATCHes `/courses/{id}/archive`, **Then** the course is hidden from default listings; its grades remain queryable.

### Edge Cases

- Reassigning a Supervisor mid-intake: blueprint silent — assume only TM can do this and existing grades retain their original publisher's id.
- Grading mode change after grades are recorded: must be blocked if any grade rows exist for the course (409 `grading_mode_locked`).
- Course with `hasExam=false` but an exam already scheduled: must be blocked (409).

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose CRUD endpoints for Tracks under Intakes: `GET /intakes/{id}/tracks`, `POST /intakes/{id}/tracks`, `PUT /tracks/{id}`, `PATCH /tracks/{id}/assign-supervisor`, `PATCH /tracks/{id}/archive`.
- **FR-002**: System MUST expose CRUD endpoints for Courses under Tracks: `GET /tracks/{id}/courses`, `POST /tracks/{id}/courses`, `PUT /courses/{id}`, `PATCH /courses/{id}/archive`.
- **FR-003**: Track create/edit/archive/assign-supervisor MUST be TM-only.
- **FR-004**: Course create/edit/archive MUST be allowed for TM and the track's Supervisor only.
- **FR-005**: System MUST enforce one-supervisor-per-track-per-intake invariant at the application and DB level (unique index on `(IntakeId, SupervisorId)`).
- **FR-006**: System MUST reject assignment of a user whose role is not `Supervisor`.
- **FR-007**: Grading mode MUST be a closed enum: `GradesOnly`, `GradesAndAbsence`, `LabAndAbsence`, `ExamMode`.
- **FR-008**: System MUST block grading mode change after any grade row exists for the course.
- **FR-009**: System MUST scope read endpoints per blueprint Section 2.
- **FR-010**: Hours fields MUST be non-negative integers; sum (lecture+lab+self-study) ≤ 200 (sanity bound).

### Key Entities

`Tracks` and `Courses` from spec 001.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A Supervisor can populate a track with 10 courses in under 5 minutes via the API.
- **SC-002**: 100% of scope-leak negative cases covered by integration tests.
- **SC-003**: Course list endpoint p95 under 150 ms with 1000 courses.

## Assumptions

- Instructors are free-text on courses — they are not system users in v1.
- A course belongs to exactly one track; cross-track shared courses are out of scope.
