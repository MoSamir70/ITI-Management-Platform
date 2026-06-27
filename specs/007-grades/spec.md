# Feature Specification: Grades

**Feature Branch**: `feature/grades`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: alaa-elsated
**Phase**: 3 — Grades & Attendance
**Depends on**: 006-group-management
**Input**: TA enters lab grades for own group; Supervisor enters exam grades for own courses; Supervisor publishes grades; Students view published grades only.

## User Scenarios & Testing

### User Story 1 — TA enters lab grades (Priority: P1)

A TA opens the grade roster for their group and enters lab grades for each student.

**Acceptance Scenarios**:
1. **Given** a TA assigned to Group A and a course with grading mode `LabAndAbsence` or `GradesAndAbsence`, **When** they PUT `/courses/{cid}/grades/{sid}/lab` with value 85, **Then** the response is 200, `LabGrade=85`, `IsPublished=false`.
2. **Given** the same TA, **When** they PUT a lab grade for a student in Group B, **Then** the response is 404 (scope-hidden).
3. **Given** a course with grading mode `GradesOnly`, **When** TA attempts to PUT a lab grade, **Then** the response is 409 with code `lab_grades_not_applicable_for_grading_mode`.
4. **Given** a value > 100 or < 0, **When** PUTed, **Then** the response is 400.

### User Story 2 — Supervisor enters exam grades (Priority: P1)

Supervisor sets exam grade per student in their own course.

**Acceptance Scenarios**:
1. **Given** a Supervisor of the course's track, **When** they PUT `/courses/{cid}/grades/{sid}/exam` with value 75, **Then** the response is 200 and `ExamGrade=75`.
2. **Given** a TA, **When** they PUT an exam grade, **Then** the response is 403 (TA cannot enter exam grades).
3. **Given** a published grade row, **When** Supervisor edits the exam grade, **Then** the edit is accepted and `PublishedAt` is unchanged but a re-publish notification is queued.

### User Story 3 — Publish grades (Priority: P1)

Supervisor toggles publish for all grades in a course, making them visible to students.

**Acceptance Scenarios**:
1. **Given** complete grades for all enrolled students, **When** Supervisor PATCHes `/courses/{cid}/grades/publish`, **Then** every grade row gets `IsPublished=true`, `PublishedAt=now`, `PublishedBy=supervisorId`, and a `GradePublished` notification is created per student.
2. **Given** missing grades for some students (`Total` null), **When** publish is requested, **Then** the response is 409 with code `incomplete_grades` and the list of missing student ids.
3. **Given** a Student, **When** they GET `/students/me/grades` after publish, **Then** the response includes the new course grades.
4. **Given** a Student, **When** they GET `/students/me/grades` before publish, **Then** unpublished rows are omitted.

### User Story 4 — Total calculation (Priority: P1)

Total grade is computed from lab + exam grades based on the course's grading mode.

**Acceptance Scenarios**:
1. **Given** `GradesAndAbsence` mode with ExamGrade=80 and AbsencePercentage=10 (within allowed), **When** computed, **Then** Total reflects the documented formula and AbsencePercentage is reflected from the Attendance module (spec 008).
2. **Given** `LabAndAbsence` mode with LabGrade=70 and AbsencePercentage=25 (over threshold), **When** computed, **Then** Total is flagged with a warning indicator (still numeric, but `WarningCode="absence_exceeded"`).

### User Story 5 — Read scope (Priority: P1)

Per blueprint Section 6: TM sees all, Supervisor sees own-course, TA sees own-course (read-only), StAffairs has NO access, Student sees own published only.

**Acceptance Scenarios**:
1. **Given** a StAffairs user, **When** they GET any grade endpoint, **Then** the response is 403.
2. **Given** a Supervisor, **When** they GET grades in another track, **Then** the response is 404.
3. **Given** a TA, **When** they GET grades for their assigned course, **Then** the response is 200 (read-only).

### Edge Cases

- Editing a lab grade after publish: allowed (per blueprint — Supervisor may edit); creates an audit trail row.
- Concurrent edits to the same grade row by Supervisor and TA: optimistic concurrency token must match.
- Republishing after edits: should NOT create duplicate notifications within 1 minute (debounce).
- Withdrawn students (`Status=Dropped`): excluded from publish completeness check.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `GET /courses/{id}/grades` returning rows for all active enrollments in the course.
- **FR-002**: System MUST expose `PUT /courses/{id}/grades/{sid}/lab` for TA (own group) and Supervisor.
- **FR-003**: System MUST expose `PUT /courses/{id}/grades/{sid}/exam` for Supervisor only.
- **FR-004**: System MUST expose `PATCH /courses/{id}/grades/publish` for Supervisor only.
- **FR-005**: System MUST expose `GET /students/{id}/grades` returning own published only for Students; scoped for Supervisor; all for TM.
- **FR-006**: System MUST compute `TotalGrade` deterministically from grading mode + components; the formula MUST be unit-tested for every mode.
- **FR-007**: Lab and exam grade values MUST be decimal 0–100.
- **FR-008**: Publish action MUST require completeness of grades for all `Active` enrollees.
- **FR-009**: System MUST emit a `GradePublished` notification (consumed by spec 009) for every affected student.
- **FR-010**: Every grade write MUST record `EnteredAt` and `EnteredBy` (audit).
- **FR-011**: StAffairs role MUST return 403 on every grade endpoint (verified in tests — blueprint Section 11).

### Key Entities

`Grades` from spec 001. Optional `GradeAuditLog` for edit history.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Publishing grades for a 50-student course completes in under 1 second.
- **SC-002**: Negative test matrix covers all role × scope × action combinations.
- **SC-003**: Total formula has 100% branch coverage in unit tests across the 4 grading modes.

## Assumptions

- Absence percentage comes from spec 008 (Attendance). For tests, a deterministic stub is acceptable.
- Grading mode `ExamMode` defers to the Exams module for grade entry — handled in spec 009.
- Pass/fail threshold and final grade weights follow ITI institutional defaults documented in a constants file; not parameterised in v1.
