# Feature Specification: Authentication & JWT

**Feature Branch**: `feature/authentication`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: NadaFoudaa
**Phase**: 1 — Foundation
**Depends on**: 001-database-foundation
**Input**: Implement login, refresh, logout, password flows, and JWT issuance with five-role RBAC policies.

## User Scenarios & Testing

### User Story 1 — Successful login (Priority: P1)

A user submits valid credentials at `/api/v1/auth/login` and receives a JWT access token plus a refresh token cookie. The token contains the user's role claim and id.

**Why this priority**: Without login, the platform has no entry point. Every other endpoint depends on a bearer token.

**Independent Test**: Integration test posts valid credentials, asserts 200 OK with a JWT in the body and a refresh-token cookie in the response headers; the JWT decodes to the expected role and sub claim.

**Acceptance Scenarios**:
1. **Given** the seeded Training Manager account, **When** the user POSTs valid email + password, **Then** the response is 200 with `accessToken`, `expiresIn`, and a `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict`.
2. **Given** a valid account with `MustChangePassword=true`, **When** the user logs in, **Then** the response includes `mustChangePassword: true` and access is restricted to the password-change endpoint.
3. **Given** a deactivated account (`IsActive=false`), **When** the user attempts login, **Then** the response is 401 with problem-details code `account_deactivated`.

### User Story 2 — Refresh token rotation (Priority: P1)

A client with an expired access token but valid refresh cookie calls `/api/v1/auth/refresh` and receives a new access token and a rotated refresh token.

**Why this priority**: The 15-minute access token would force re-login constantly without this.

**Independent Test**: Integration test obtains a refresh token, advances the test clock past expiry, calls refresh, asserts a new JWT and a different refresh-cookie value.

**Acceptance Scenarios**:
1. **Given** a valid refresh cookie, **When** `/auth/refresh` is called, **Then** the response is 200 with a new access token and a new refresh cookie; the old refresh token is invalidated server-side.
2. **Given** a refresh token used twice (replay), **When** the second call arrives, **Then** the response is 401 and ALL refresh tokens for that user are invalidated (token reuse detection).

### User Story 3 — Role-based authorisation (Priority: P1)

A Student calls a TrainingManager-only endpoint and receives 403 Forbidden.

**Why this priority**: RBAC enforcement is the security guarantee; without it the constitution is violated.

**Independent Test**: Integration test logs in as each of the five roles and exercises a sample of representative endpoints (one per role's scope); asserts 200 for allowed and 403 for disallowed.

**Acceptance Scenarios**:
1. **Given** a Student JWT, **When** `GET /api/v1/users` (TM-only) is called, **Then** the response is 403.
2. **Given** a Supervisor JWT, **When** they query grades for a track they don't supervise, **Then** the response is 403 with code `out_of_scope`.

### User Story 4 — Password lifecycle (Priority: P2)

A user can change their own password and recover via email reset token.

**Why this priority**: Required by blueprint; first-login flow blocks productive use until implemented.

**Acceptance Scenarios**:
1. **Given** a logged-in user, **When** they POST current+new password to `/auth/change-password`, **Then** the password updates and `MustChangePassword` is cleared.
2. **Given** a user requests password reset, **When** a token is generated, **Then** it expires after 60 minutes and is single-use.

### User Story 5 — Logout invalidates session (Priority: P2)

A user calls `/auth/logout` and the refresh token is revoked server-side.

**Acceptance Scenarios**:
1. **Given** a valid session, **When** `/auth/logout` is called, **Then** the refresh-token cookie is cleared and the server-side refresh token is marked revoked.

### Edge Cases

- Brute-force login attempts: lock the account for 15 minutes after 5 failed attempts within 5 minutes.
- Concurrent refresh from two devices: each device gets its own refresh-token chain (multiple chains allowed per user).
- Token issued for a user whose role changes mid-session: role claim is re-evaluated on next refresh.
- Clock skew: token validation allows 30 seconds of skew.

## Requirements

### Functional Requirements

- **FR-001**: System MUST issue HS256-signed JWTs with `sub`, `email`, `role`, `iat`, `exp` claims; access tokens expire in 15 minutes.
- **FR-002**: System MUST issue refresh tokens as opaque GUIDs stored in `RefreshTokens` table with `UserId`, `TokenHash`, `ExpiresAt`, `RevokedAt`, `ReplacedByTokenHash`.
- **FR-003**: Refresh tokens MUST be delivered via `HttpOnly; Secure; SameSite=Strict` cookies and expire in 7 days.
- **FR-004**: System MUST detect refresh-token reuse and revoke the entire token chain.
- **FR-005**: System MUST define authorization policies: `IsTrainingManager`, `IsSupervisor`, `IsTA`, `IsStudentAffairs`, `IsStudent`, plus composite `IsStaff` (TM+Supervisor+TA+StAffairs).
- **FR-006**: System MUST define scope-checking handlers (e.g. `OwnTrackHandler`) used by `[Authorize(Policy = "SupervisorOwnTrack")]` attributes.
- **FR-007**: System MUST reject login for `IsActive=false` accounts with a distinct error code.
- **FR-008**: System MUST lock accounts after 5 failed attempts in 5 minutes for 15 minutes (Identity built-in lockout).
- **FR-009**: System MUST provide `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`.
- **FR-010**: System MUST log every authentication event (success, failure, lockout, password reset) at Information or Warning level with the user id (when known) and source IP.
- **FR-011**: JWT signing key MUST come from `IConfiguration` (`Jwt:SigningKey`) and be at least 256 bits.
- **FR-012**: All endpoints under `/api/v1/**` except auth public endpoints MUST require `[Authorize]` by default.

### Key Entities

- **RefreshToken**: id, userId, tokenHash, expiresAt, createdAt, revokedAt (nullable), replacedByTokenHash (nullable), createdByIp.
- **AuthEventLog** (optional, can use ASP.NET Identity event store): id, userId, eventType, timestamp, ip, success.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of API endpoints under `/api/v1` return 401 when no token is supplied (single integration test sweeps all routes).
- **SC-002**: 100% of role-restricted endpoints return 403 for every wrong role (parameterised integration test matrix).
- **SC-003**: Refresh-token rotation completes in under 200 ms p95.
- **SC-004**: Login p95 latency under 400 ms with 100 concurrent users (load test).

## Assumptions

- Email sending for password reset is mocked in dev via console sink; production wiring to SMTP is a deployment concern, not a spec requirement.
- Single tenant — no multi-org context in the JWT.
- 2FA is out of scope for v1.
