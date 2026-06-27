# Feature Specification: KPI (Certificates & Freelance)

**Feature Branch**: `feature/kpi`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: alaa-elsated
**Phase**: 4 — Requests & KPIs
**Depends on**: 006-group-management
**Input**: Student-submitted Certificate KPIs (with file upload) and Freelance KPIs (with payment screenshot); Supervisor review/approve.

## User Scenarios & Testing

### User Story 1 — Student submits a Certificate KPI (Priority: P1)

Student uploads a certificate file with metadata and links it to a track or course requirement.

**Acceptance Scenarios**:
1. **Given** a track with `certificateKpiEnabled=true`, **When** Student POSTs `/kpis` (multipart) with type=Certificate + file + metadata, **Then** the response is 201 with `Status=Pending`.
2. **Given** a track with `certificateKpiEnabled=false` AND course with `certificateKpiEnabled=false`, **When** Student POSTs, **Then** the response is 409 with code `kpi_type_not_enabled`.
3. **Given** a file > 5 MB, **When** uploaded, **Then** the response is 413 with code `file_too_large`.
4. **Given** a non-PDF/image content-type, **When** uploaded, **Then** the response is 415 with code `unsupported_media_type`.

### User Story 2 — Student submits a Freelance KPI (Priority: P1)

Student submits a freelance project with payment screenshot.

**Acceptance Scenarios**:
1. **Given** a track with `freelanceKpiEnabled=true`, **When** Student POSTs with type=Freelance + screenshot + metadata, **Then** the response is 201.
2. **Given** missing required field `Platform`, **When** POSTed, **Then** the response is 400.

### User Story 3 — Supervisor approves or rejects (Priority: P1)

Supervisor reviews KPIs for students in their track and decides.

**Acceptance Scenarios**:
1. **Given** a pending KPI from a student in the supervisor's track, **When** Supervisor PATCHes `/kpis/{id}/review` with `decision=Approved`, **Then** the response is 200, status updates, and a `KpiDecision` notification is emitted (consumed by spec 009).
2. **Given** a KPI from another track, **When** Supervisor PATCHes, **Then** the response is 404.
3. **Given** a TA, **When** they attempt to review, **Then** the response is 403.

### User Story 4 — Student views own KPI status (Priority: P1)

Student sees their submissions with status and reviewer note.

**Acceptance Scenarios**:
1. **Given** a Student with 3 KPI submissions, **When** they GET `/kpis?mine=true`, **Then** the response includes all 3 with status and notes.

### User Story 5 — StAffairs views KPI status (Priority: P2)

StAffairs sees KPI lists for monitoring (no review action).

**Acceptance Scenarios**:
1. **Given** a StAffairs user, **When** they GET `/kpis`, **Then** the response is 200 with KPIs across all tracks.
2. **Given** the same user, **When** they PATCH review, **Then** the response is 403.

### User Story 6 — File serving with scope (Priority: P1)

Uploaded files are not publicly addressable; downloads require a scope-checked endpoint.

**Acceptance Scenarios**:
1. **Given** a KPI file, **When** the owning Student GETs `/kpis/{id}/file`, **Then** the response is 200 with the file stream.
2. **Given** a different Student, **When** they GET `/kpis/{id}/file`, **Then** the response is 404.

### Edge Cases

- Re-submission after rejection: a new KPI record is created (the rejected one is kept for audit, not edited).
- Concurrent review by two TMs: optimistic concurrency token.
- Storage exhaustion: API returns 507 with `storage_unavailable`.
- KPI submitted while the track flag was true, then the flag flips to false: the submission remains valid and reviewable.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `POST /kpis` (multipart/form-data) for Student only.
- **FR-002**: System MUST expose `GET /kpis` (scope-bound: Student → own; Supervisor → own track; StAffairs → all read-only; TM → all).
- **FR-003**: System MUST expose `PATCH /kpis/{id}/review` for Supervisor (own track) and TM.
- **FR-004**: System MUST expose `GET /kpis/{id}/file` returning the file stream with scope check.
- **FR-005**: System MUST validate KPI type is enabled at track OR course level before accepting submission.
- **FR-006**: Max file size MUST be 5 MB; allowed content types: `application/pdf`, `image/jpeg`, `image/png`.
- **FR-007**: Files MUST be stored under `wwwroot/uploads/kpis/{kpiId}.{ext}` (v1) with a randomly-generated filename component to prevent collisions.
- **FR-008**: Approval action MUST emit a `KpiReviewed` domain event consumed by spec 009.
- **FR-009**: System MUST scan uploaded files for size/type before disk write; reject before persistence.
- **FR-010**: Listing endpoints MUST support filters: type, status, trackId, studentId; pagination required.

### Key Entities

`KPIs` from spec 001.

## Success Criteria

### Measurable Outcomes

- **SC-001**: KPI upload (5 MB file) completes in under 3 seconds locally.
- **SC-002**: 100% RBAC matrix coverage incl. file download scope.
- **SC-003**: File scope-leak negative tests pass for every role pair.

## Assumptions

- v1 storage is local filesystem; the storage abstraction (`IFileStore`) supports a future S3 impl.
- No virus scanning in v1; will add in a follow-up (track via TODO).
- KPI requirements per track (e.g. "needs 2 certificates to graduate") are not enforced in v1 — just collected.
