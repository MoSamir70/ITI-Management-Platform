# Feature Specification: Exams & Notifications

**Feature Branch**: `feature/exams-notifications`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: alaa-elsated
**Phase**: 5 — Exams & Notifications
**Depends on**: 007-grades
**Input**: Exam scheduling with regular/corrective types, targeted student lists, publish-to-notify; portal notification inbox.

## User Scenarios & Testing

### User Story 1 — Schedule a regular exam (Priority: P1)

Supervisor schedules an exam for one of their courses with date, location, duration, optional online link.

**Acceptance Scenarios**:
1. **Given** a Supervisor of the course's track, **When** they POST `/courses/{cid}/exams` with `type=Regular`, **Then** the response is 201 with `IsPublished=false`.
2. **Given** a course where `hasExam=false`, **When** Supervisor POSTs, **Then** the response is 409 with code `course_has_no_exam`.
3. **Given** a Supervisor of another track, **When** they POST, **Then** the response is 403.

### User Story 2 — Publish exam → notify enrolled students (Priority: P1)

Toggling publish creates a notification per enrolled student.

**Acceptance Scenarios**:
1. **Given** a scheduled regular exam, **When** Supervisor PATCHes `/exams/{id}/publish`, **Then** `IsPublished=true`, `PublishedAt=now`, and a `Notifications` row of type `ExamScheduled` is created for every active enrollee in the course.
2. **Given** an already-published exam, **When** PATCH publish is called again, **Then** the response is 409 with code `already_published`.

### User Story 3 — Corrective exam targeting specific students (Priority: P1)

Supervisor selects specific students (e.g. those who failed) for a corrective exam.

**Acceptance Scenarios**:
1. **Given** a Supervisor, **When** they POST `/courses/{cid}/exams` with `type=Corrective` and a `studentIds=[...]` list, **Then** the response is 201 and rows in `CorrectiveExamStudents` are created.
2. **Given** publish on a corrective exam, **When** triggered, **Then** notifications are sent only to the targeted students.
3. **Given** an attempt to target a student not enrolled in the course, **When** POSTed, **Then** the response is 400 with the offending student ids.

### User Story 4 — Notification inbox (Priority: P1)

Any authenticated user sees their notifications with read/unread state.

**Acceptance Scenarios**:
1. **Given** an authenticated user with 5 notifications, **When** they GET `/notifications`, **Then** the response is paginated newest-first with read state.
2. **Given** a notification, **When** the user PATCHes `/notifications/{id}/read`, **Then** `IsRead=true` and `ReadAt` is set.
3. **Given** a user attempts to read another user's notification, **When** PATCHed, **Then** the response is 404.

### User Story 5 — StAffairs read-only exam monitoring (Priority: P2)

StAffairs can view exam schedules (regular and corrective) for any course — read-only (blueprint Section 11).

**Acceptance Scenarios**:
1. **Given** a StAffairs user, **When** they GET `/courses/{cid}/exams`, **Then** the response is 200.
2. **Given** the same user, **When** they POST, PATCH, or DELETE, **Then** the response is 403.

### User Story 6 — Grade-publish and KPI-decision notifications integrate here (Priority: P2)

The grades module (spec 007) and KPI module (spec 010) emit domain events consumed by this module to create notifications.

**Acceptance Scenarios**:
1. **Given** a `GradePublished` event for a course, **When** consumed, **Then** a notification of type `GradePublished` lands for each affected student.
2. **Given** a `KpiReviewed` event, **When** consumed, **Then** a notification of type `KpiDecision` lands for the submitting student.

### Edge Cases

- Exam scheduled in the past: allowed (per blueprint — useful for backfill) but a warning is included in response body.
- Notification batch creation for a large course (1000 students): must not block the request — use a background queue.
- Republishing after edits: NOT supported by `PATCH publish` (returns 409); instead, edit fields and call `PATCH /exams/{id}/notify-update` (separate endpoint, sends a `ExamUpdated` notification).
- Notification storm if a Supervisor publishes 10 exams in quick succession: each exam still produces its own batch; no debouncing.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `GET /courses/{id}/exams`, `POST /courses/{id}/exams`, `PUT /exams/{id}`, `PATCH /exams/{id}/publish`, `PATCH /exams/{id}/notify-update`.
- **FR-002**: Write actions MUST be allowed for TM and the track's Supervisor only.
- **FR-003**: Read MUST be allowed for TM, Supervisor (own), StAffairs (read-only), Student (only if enrolled and exam is published).
- **FR-004**: Publish action MUST be idempotent at the DB level but reject duplicate publish attempts at API level (409).
- **FR-005**: Corrective exam target list MUST be subset of `StudentCourseEnrollments` for the course.
- **FR-006**: System MUST expose `GET /notifications` and `PATCH /notifications/{id}/read` for any authenticated user.
- **FR-007**: Notification creation MUST happen via a background queue (Channel or hosted service) when batch size > 50; smaller batches inline.
- **FR-008**: Notification types MUST be a closed enum: `ExamScheduled`, `ExamUpdated`, `CorrectiveExam`, `GradePublished`, `AbsenceRequestUpdate`, `KpiDecision`, `GeneralAnnouncement`.
- **FR-009**: System MUST allow TM and Supervisor to POST `/announcements` (general broadcast) with target = track/group/all.
- **FR-010**: Each notification MUST include `Title`, `Body`, `Type`, optional `RelatedEntityId`, `CreatedAt`, `IsRead`, `ReadAt`.

### Key Entities

`Exams`, `CorrectiveExamStudents`, `Notifications` from spec 001.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Publishing an exam for a 100-student course delivers all notifications within 5 seconds.
- **SC-002**: Notification inbox read endpoint p95 under 150 ms for users with 1000 notifications.
- **SC-003**: 100% RBAC matrix coverage.

## Assumptions

- Notifications are portal-only in v1 (no email/push); the interface is designed so an email channel can be added later.
- SignalR for real-time push is OPTIONAL and not required for v1 — polling the inbox endpoint is sufficient.
- Corrective exam students cannot be added/removed after publish; instead a new corrective exam is created.
