# Feature Specification: Attendance & Absence Requests

**Feature Branch**: `feature/attendance`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: alaa-elsated
**Phase**: 3 — Grades & Attendance
**Depends on**: 006-group-management
**Input**: Online/offline attendance recording by TA/Supervisor/StAffairs; absence requests submitted by Students; approval by Supervisor.

## User Scenarios & Testing

### User Story 1 — TA records attendance for a session (Priority: P1)

The TA opens the roster for their group and marks each student present/absent for a given date and session type.

**Acceptance Scenarios**:
1. **Given** a TA assigned to Group A, **When** they POST `/courses/{cid}/attendance` with date, sessionType=Online, and a list of `{studentId, isAbsent}`, **Then** rows are upserted in `Attendance`.
2. **Given** the same TA, **When** they POST attendance for Group B, **Then** the response is 404.
3. **Given** an attempt to record attendance for a student no longer enrolled, **When** POSTed, **Then** the response is 409 with code `student_not_enrolled`.
4. **Given** duplicate (studentId, courseId, sessionDate, sessionType), **When** re-POSTed, **Then** the row is updated (upsert semantics).

### User Story 2 — StAffairs records offline attendance (Priority: P2)

Student Affairs records in-person absence per blueprint Section 7.4.

**Acceptance Scenarios**:
1. **Given** a StAffairs user, **When** they POST attendance with `sessionType=Offline`, **Then** the response is 201.
2. **Given** the same user, **When** they POST `sessionType=Online`, **Then** the response is 403 with code `offline_only_for_staffairs`.

### User Story 3 — Student submits an absence request (Priority: P1)

Student requests pre-approved absence for one or more dates with a reason.

**Acceptance Scenarios**:
1. **Given** a Student, **When** they POST `/absence-requests` with `dates=[...]`, `reason="..."`, **Then** the response is 201 with `Status=Pending`.
2. **Given** dates in the past (more than 7 days ago), **When** POSTed, **Then** the response is 400 with code `requested_date_too_old`.
3. **Given** overlapping pending request for the same dates, **When** POSTed, **Then** the response is 409 with code `overlapping_request_exists`.

### User Story 4 — Supervisor approves or rejects (Priority: P1)

The track's Supervisor reviews requests from students in their track and decides.

**Acceptance Scenarios**:
1. **Given** a pending request from a student in the supervisor's track, **When** Supervisor PATCHes `/absence-requests/{id}/review` with `decision=Approved`, **Then** the request status updates AND any Attendance rows in the approved date range are marked with `AbsenceRequestId=requestId` (excluded from absence percentage calculation).
2. **Given** a request from another track, **When** Supervisor PATCHes, **Then** the response is 404.
3. **Given** a TA, **When** they PATCH a review, **Then** the response is 403 (TA cannot approve).

### User Story 5 — Student views own attendance (Priority: P2)

Student sees their absence record per course with online/offline split and threshold indicator.

**Acceptance Scenarios**:
1. **Given** a Student, **When** they GET `/students/me/attendance`, **Then** the response groups by course with `onlineAbsences`, `offlineAbsences`, `approvedAbsences`, `effectivePercentage`.

### User Story 6 — TA/Supervisor view absence summaries (Priority: P2)

Scope-bound listings for TA (own group), Supervisor (own track), StAffairs (all), TM (all).

**Acceptance Scenarios**:
1. **Given** a TA, **When** they GET `/courses/{cid}/attendance/summary`, **Then** the response includes only their group's students.

### Edge Cases

- Same-day duplicate session of the same type: blueprint silent — treat as second session and disambiguate by adding a `SessionOrdinal` column (defaults to 1).
- Approval of past dates: allowed (per blueprint, retrospective approval is a valid flow).
- Concurrent approval and rejection by TM and Supervisor: optimistic concurrency token.
- Absence request spanning a non-class day: stored but ignored when computing percentage (only sessions in `Attendance` count).

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `POST /courses/{id}/attendance` (bulk upsert) and `GET /courses/{id}/attendance/summary`.
- **FR-002**: Attendance write permissions: TA (own group, any sessionType), Supervisor (own track), StAffairs (Offline only), TM (any).
- **FR-003**: System MUST expose `POST /absence-requests` (Student only), `GET /absence-requests` (scope-bound), `PATCH /absence-requests/{id}/review` (Supervisor or TM).
- **FR-004**: Approval MUST update any matching Attendance rows in the approved date range to link `AbsenceRequestId`.
- **FR-005**: Absence percentage MUST be computed as `(absences_not_excused / total_sessions) * 100`, where excused = `AbsenceRequestId != null AND request.Status=Approved`.
- **FR-006**: System MUST expose `GET /students/me/attendance` returning the student's own data, grouped by course.
- **FR-007**: All read endpoints MUST be scope-checked per Section 7.4 of the blueprint.
- **FR-008**: An absence threshold constant (default 25%) MUST be configurable in `appsettings.json`; responses include a `thresholdExceeded` flag.

### Key Entities

`Attendance`, `AbsenceRequests` from spec 001.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Recording attendance for a 50-student group completes in under 500 ms.
- **SC-002**: 100% RBAC matrix covered.
- **SC-003**: Absence percentage formula has unit tests covering 6 edge scenarios (no sessions, all absent, partial excused, etc.).

## Assumptions

- Attendance is recorded per session (course + date + type), not per minute.
- Time zone: stored as `DATE` in branch local (Africa/Cairo).
- Sessions outside class days (holidays) are not auto-tracked — only sessions actually recorded count toward the percentage.
