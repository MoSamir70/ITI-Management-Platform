# Feature Specification: Frontend Shell & Role Dashboards

**Feature Branch**: `feature/frontend-shell`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: salmaabdelkader
**Phase**: 1–6 (incremental)
**Depends on**: 002-authentication (initial), then incremental on each backend spec
**Input**: Angular 17 standalone app with auth, role-based routing, layout shell, and incremental wiring of Stitch-designed screens.

## User Scenarios & Testing

### User Story 1 — Login flow with role redirect (Priority: P1)

User opens `/login`, enters credentials, lands on their role's dashboard.

**Acceptance Scenarios**:
1. **Given** valid TM credentials, **When** user submits the login form, **Then** the app navigates to `/admin/dashboard`.
2. **Given** invalid credentials, **When** submitted, **Then** an inline error renders matching the API problem-detail.
3. **Given** a successful login with `MustChangePassword=true`, **When** redirected, **Then** the app navigates to `/account/change-password` and other routes are blocked by a guard.

### User Story 2 — Auth interceptor + token refresh (Priority: P1)

The HTTP interceptor attaches the bearer token; on 401 with expired token it silently refreshes once and retries.

**Acceptance Scenarios**:
1. **Given** an expired access token and valid refresh cookie, **When** an API call returns 401, **Then** the interceptor calls `/auth/refresh`, retries once, and the original call succeeds.
2. **Given** refresh also fails, **When** retried, **Then** the user is redirected to `/login` and the auth state is cleared.

### User Story 3 — Role guards on lazy-loaded modules (Priority: P1)

Each top-level route group is gated by a role guard.

**Acceptance Scenarios**:
1. **Given** a Student attempts to navigate to `/admin/users`, **When** the guard runs, **Then** the user is redirected to `/student/dashboard`.
2. **Given** an unauthenticated user, **When** navigating to any protected route, **Then** the user is redirected to `/login?returnUrl=...`.

### User Story 4 — Role dashboard for Training Manager (Priority: P1)

The TM dashboard from the Stitch design (`training_manager_dashboard` folder) renders with metrics summary and quick actions.

**Acceptance Scenarios**:
1. **Given** a logged-in TM, **When** they land on `/admin/dashboard`, **Then** the layout matches the Stitch design and metric cards render with API data.

### User Story 5 — Incremental screen wiring (Priority: P2)

Each Stitch screen folder maps to one Angular feature module that is implemented as its corresponding backend spec lands.

**Stitch screen → module mapping**:
- `login_iti_branch_portal` → `auth/login`
- `training_manager_dashboard` → `admin/dashboard`
- `course_catalog_iti_branch_portal` → `admin/courses` & `student/courses`
- `group_management_iti_branch_portal` → `admin/groups` / `supervisor/groups`
- `students_management_iti_branch_portal` → `affairs/students` / `admin/students`
- `kpi_dashboard_iti_branch_portal` → `student/kpis` / `supervisor/kpis`
- `my_profile_iti_branch_portal` → `account/profile`
- `reports_iti_branch_portal` → `admin/reports`
- `settings_iti_branch_portal` → `admin/settings`
- `iti_enterprise_portal` → top-level layout shell

**Acceptance Scenarios**:
1. **Given** the backend spec for a module is merged, **When** the frontend feature module is implemented, **Then** the UI matches the Stitch design (within Material constraints) and end-to-end testing covers the golden path per role.

### User Story 6 — Notifications panel (Priority: P2)

A bell icon in the top bar shows unread count and opens an inbox drawer.

**Acceptance Scenarios**:
1. **Given** the user has 3 unread notifications, **When** they open the app, **Then** the bell badge shows "3".
2. **Given** the user opens the drawer, **When** they click a notification, **Then** it is marked read and they navigate to the related entity.

### Edge Cases

- Slow networks: skeleton loaders on data fetches; 30s timeout with retry CTA.
- Concurrent tab logout: a `storage` event listener invalidates auth state across tabs.
- Stitch designs deviating from Material capabilities: documented inline with a `// stitch-deviation: <reason>` comment.
- Browser back after token refresh: route guard re-validates and does not flash protected content.

## Requirements

### Functional Requirements

- **FR-001**: System MUST be Angular 17+ with standalone components (no NgModules).
- **FR-002**: System MUST use Signals for component state and RxJS only at HTTP boundaries.
- **FR-003**: System MUST use Angular Material as the primary component library.
- **FR-004**: System MUST implement an `authInterceptor` (functional interceptor) attaching `Authorization: Bearer <token>` and handling silent refresh on 401.
- **FR-005**: System MUST implement role-specific functional guards: `trainingManagerGuard`, `supervisorGuard`, `taGuard`, `studentAffairsGuard`, `studentGuard`.
- **FR-006**: System MUST lazy-load each role module via `loadChildren` with route-level standalone configs.
- **FR-007**: System MUST persist auth state via in-memory signal store; refresh token is browser-managed via cookie.
- **FR-008**: System MUST provide a typed API client (`ApiClient` service per backend module) wrapping `HttpClient` with proper DTOs.
- **FR-009**: System MUST implement an i18n scaffold (Angular i18n) with English as v1 default and Arabic placeholders ready (ITI is bilingual).
- **FR-010**: All forms MUST use Reactive Forms with `FormBuilder` and validators surfaced as Material error messages.
- **FR-011**: Each role module MUST ship Karma unit tests for at least the page-level component and any non-trivial services.

### Key Entities

DTO shapes mirror backend responses; no client-side persistence beyond auth state and cached lookups (branches, intakes, courses).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Initial page load (cold cache, login) under 2 seconds on a Fast 3G profile.
- **SC-002**: Lighthouse accessibility score ≥ 90 for every dashboard page.
- **SC-003**: Bundle size ≤ 500 KB initial (compressed); per-route chunks ≤ 200 KB.
- **SC-004**: 100% of routes gated by guards (zero anonymous protected routes — verified by route-config test).

## Assumptions

- The Stitch ZIP under `stitch_iti_training_management_portal/` is unpacked and referenced for visual fidelity; HTML/CSS extracted into Angular components.
- Charts (KPI dashboard, reports) use `ngx-charts` or Material's `MatTable` + a chart lib TBD when the first chart screen lands.
- File upload uses the native File API; chunked upload not required at v1 file sizes.
- The frontend is deployed behind the same origin as the API; CORS is not configured beyond the local dev proxy.
