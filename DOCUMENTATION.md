# ITI Branch Portal — Complete Technical Documentation

> **Stack:** ASP.NET Core 8 · Angular 17 · SQL Server LocalDB · Entity Framework Core 8 · ASP.NET Core Identity · JWT

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Domain Model & Database Schema](#4-domain-model--database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Reference](#6-api-reference)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Design System (Stitch)](#8-design-system-stitch)
9. [Seed Data & Test Accounts](#9-seed-data--test-accounts)
10. [How to Run Locally](#10-how-to-run-locally)
11. [Git Workflow](#11-git-workflow)
12. [Environment Configuration](#12-environment-configuration)
13. [Error Code Glossary](#13-error-code-glossary)

---

## 1. Project Overview

The **ITI Branch Portal** is the internal management system for Information Technology Institute (ITI) branches. It covers the full lifecycle of a training intake: from setting up branches and tracks to recording grades, attendance, exams, and student KPI submissions.

### Who uses it

| Role | What they do |
|---|---|
| **TrainingManager** | Full admin — creates branches, intakes, tracks, courses, users; publishes grades |
| **Supervisor** | Manages their assigned track; reviews KPI submissions; views reports |
| **TA** (Teaching Assistant) | Records attendance and grades for their assigned group |
| **StudentAffairs** | Creates and manages student accounts |
| **Student** | Views own grades/attendance/exams; submits KPI evidence; submits absence requests |

---

## 2. Architecture

The backend follows **Clean Architecture** with four layers that depend inward only:

```
┌─────────────────────────────────────────────────────┐
│                  ItiPortal.Api                      │  ← HTTP controllers, middleware, DI wiring
│    (ASP.NET Core, JWT Bearer, Swagger, CORS)        │
└──────────────────────┬──────────────────────────────┘
                       │ depends on ↓
┌──────────────────────▼──────────────────────────────┐
│              ItiPortal.Application                  │  ← Business logic, service interfaces, DTOs
│   (IAuthService, IGradeService, IExamService …)     │
└──────────────────────┬──────────────────────────────┘
                       │ implements ↑, depends on ↓
┌──────────────────────▼──────────────────────────────┐
│             ItiPortal.Persistence                   │  ← EF Core DbContext, repositories, service impls
│        (AppDbContext, migrations, DbSeeder)         │
└──────────────────────┬──────────────────────────────┘
                       │ depends on ↓
┌──────────────────────▼──────────────────────────────┐
│               ItiPortal.Domain                      │  ← Entities, enums, value objects — no deps
│          (ApplicationUser, Grade, Exam …)           │
└─────────────────────────────────────────────────────┘
```

The **frontend** is a standalone Angular 17 SPA. It communicates with the API via an HTTP proxy (dev) or direct URL (prod). All state lives in Angular signals; no NgModule or NgRx is used.

---

## 3. Project Structure

```
ITI-Management-Platform/
│
├── src/                                   ← Backend (.NET solution)
│   ├── ItiPortal.Domain/
│   │   ├── Entities/                      ← All domain entities (see §4)
│   │   └── Enums/                         ← Roles, GradingMode, KpiType, etc.
│   │
│   ├── ItiPortal.Application/
│   │   ├── Auth/                          ← IAuthService, AuthService, DTOs
│   │   ├── Users/                         ← IUserService, DTOs
│   │   ├── Org/                           ← IBranchService, IIntakeService, DTOs
│   │   ├── Academic/                      ← ITrackService, ICourseService, DTOs
│   │   ├── Groups/                        ← IGroupService, DTOs
│   │   ├── Grades/                        ← IGradeService, DTOs
│   │   ├── Attendance/                    ← IAttendanceService, DTOs
│   │   ├── Exams/                         ← IExamService, DTOs
│   │   ├── Kpi/                           ← IKpiService, DTOs
│   │   ├── Notifications/                 ← INotificationService, DTOs
│   │   └── DependencyInjection.cs         ← Registers Application services
│   │
│   ├── ItiPortal.Persistence/
│   │   ├── AppDbContext.cs                ← EF Core DbContext
│   │   ├── Migrations/                    ← Auto-generated EF migrations
│   │   ├── Seed/DbSeeder.cs               ← Dev seed data (roles, users, data)
│   │   ├── Auth/                          ← AuthService implementation
│   │   ├── Users/                         ← UserService + UserQueryRepository
│   │   ├── Org/                           ← BranchService, IntakeService
│   │   ├── Academic/                      ← TrackService, CourseService
│   │   ├── Groups/                        ← GroupService
│   │   ├── Grades/                        ← GradeService
│   │   ├── Attendances/                   ← AttendanceService (namespace pluralized)
│   │   ├── Exams/                         ← ExamService
│   │   ├── Kpis/                          ← KpiService (namespace pluralized)
│   │   ├── Notifications/                 ← NotificationService
│   │   └── DependencyInjection.cs         ← Registers all Persistence services
│   │
│   └── ItiPortal.Api/
│       ├── Program.cs                     ← App bootstrap, middleware pipeline
│       ├── Authorization/                 ← Policies.cs (IsStaff, IsTrainingManager)
│       └── Controllers/
│           ├── Auth/AuthController.cs
│           ├── Users/UsersController.cs
│           ├── Org/BranchesController.cs  ← Also hosts IntakesController
│           ├── Academic/TracksController.cs ← Also hosts CoursesController
│           ├── Groups/GroupsController.cs
│           ├── Grades/GradesController.cs
│           ├── Attendance/AttendanceController.cs
│           ├── Exams/ExamsController.cs
│           ├── Kpi/KpiController.cs
│           └── Notifications/NotificationsController.cs
│
└── frontend/                              ← Angular 17 SPA
    ├── src/
    │   ├── index.html                     ← Loads Google Fonts CDN
    │   ├── styles.scss                    ← Global Stitch design tokens + utility classes
    │   ├── environments/
    │   │   └── environment.ts             ← { apiBase: '/api/v1' }
    │   └── app/
    │       ├── app.routes.ts              ← Lazy-loaded route tree
    │       ├── core/
    │       │   ├── guards/auth.guard.ts   ← Redirects to /login if unauthenticated
    │       │   ├── interceptors/          ← JWT bearer + 401 auto-refresh
    │       │   ├── models/auth.models.ts  ← LoginResponse, AuthState interfaces
    │       │   └── services/auth.service.ts
    │       ├── layout/shell/              ← App shell (sidebar + topbar)
    │       └── features/
    │           ├── login/
    │           ├── dashboard/
    │           ├── students/
    │           ├── grades/
    │           ├── attendance/
    │           ├── exams/
    │           ├── kpi/
    │           └── notifications/
    └── proxy.conf.json                    ← Dev proxy: /api → localhost:5251
```

---

## 4. Domain Model & Database Schema

### Entity Hierarchy

```
Branch  1──*  Intake  1──*  Track  1──*  Course
                                │
                                └──*  Group  *──*  ApplicationUser (Students)
                                              │
                                              └──*  GroupTA  (join to TA users)
```

### All Entities

#### `ApplicationUser` ← extends `IdentityUser<Guid>`
| Column | Type | Notes |
|---|---|---|
| `Id` | `Guid` | Primary key (ASP.NET Identity) |
| `FullName` | `string` | Display name |
| `NationalId` | `string?` | Optional, unique |
| `Gender` | `string?` | Optional |
| `DateOfBirth` | `DateTime?` | Optional |
| `PhotoUrl` | `string?` | Avatar URL |
| `GroupId` | `int?` | FK → `Group` (students only) |
| `IsActive` | `bool` | Soft-disable account |
| `MustChangePassword` | `bool` | Forces password change on next login |
| `CreatedAt / UpdatedAt` | `DateTime` | Audit |
| `CreatedById` | `Guid?` | Self-referencing FK |

#### `Branch`
| Column | Type |
|---|---|
| `Id` | `int` |
| `Name` | `string` |
| `Code` | `string` (unique) |
| `IsActive` | `bool` |
| `CreatedById` | `Guid?` |

#### `Intake`
| Column | Type | Notes |
|---|---|---|
| `BranchId` | `int` | FK → Branch |
| `Name` | `string` | e.g. "Intake 2024" |
| `Number` | `int` | e.g. 44 |
| `StartDate / EndDate` | `DateTime` | |
| `IsActive` | `bool` | |

#### `Track`
| Column | Type | Notes |
|---|---|---|
| `IntakeId` | `int` | FK → Intake |
| `Name / Code` | `string` | e.g. "Information Technology", "IT" |
| `SupervisorId` | `Guid` | FK → ApplicationUser (Supervisor role) |
| `CertificateKpiEnabled` | `bool` | Enables certificate KPI submissions |
| `FreelanceKpiEnabled` | `bool` | Enables freelance KPI submissions |
| `Status` | `EntityStatus` | Active / Archived |

#### `Course`
| Column | Type | Notes |
|---|---|---|
| `TrackId` | `int` | FK → Track |
| `Name / Code` | `string` | |
| `InstructorName` | `string?` | |
| `LectureHours / LabHours / SelfStudyHours` | `int` | |
| `GradingMode` | `GradingMode` | See enum below |
| `HasExam` | `bool` | Whether regular exam is scheduled |
| `CertificateKpiEnabled / FreelanceKpiEnabled` | `bool` | |

**`GradingMode` enum:**
- `GradesOnly (0)` — only total grade matters
- `GradesAndAbsence (1)` — grade + absence %
- `LabAndAbsence (2)` — lab grade + absence %
- `ExamMode (3)` — exam-only course

#### `Group`
| Column | Type |
|---|---|
| `TrackId` | `int` |
| `Name / Code` | `string` |
| `IsActive` | `bool` |
| **TAs** (nav) | `ICollection<GroupTA>` |
| **Students** (nav) | `ICollection<ApplicationUser>` |

#### `GroupTA` (join table)
| Column | Type |
|---|---|
| `GroupId` | `int` |
| `UserId` | `Guid` (TA) |
| `AssignedAt` | `DateTime` |
| `AssignedById` | `Guid` |

#### `StudentCourseEnrollment` (join table)
| Column | Type | Notes |
|---|---|---|
| `StudentId` | `Guid` | |
| `CourseId` | `int` | |
| `GroupId` | `int` | |
| `EnrolledAt` | `DateTime` | |
| `Status` | `EnrollmentStatus` | Active / Dropped / Completed |

#### `Grade`
| Column | Type | Notes |
|---|---|---|
| `StudentId` | `Guid` | |
| `CourseId` | `int` | |
| `GroupId` | `int` | |
| `LabGrade` | `decimal?` | 0–100 |
| `ExamGrade` | `decimal?` | 0–100 |
| `TotalGrade` | `decimal?` | Computed: (lab+exam)/2 |
| `AbsencePercentage` | `decimal?` | |
| `IsPublished` | `bool` | Visible to student only after publish |
| `PublishedAt / PublishedById` | | |
| `EnteredAt / EnteredById` | | Audit |

#### `Attendance`
| Column | Type | Notes |
|---|---|---|
| `StudentId / CourseId / GroupId` | | Composite context |
| `SessionDate` | `DateTime` | |
| `SessionType` | `SessionType` | Online / Offline |
| `SessionOrdinal` | `int` | Session number that day |
| `IsAbsent` | `bool` | |
| `AbsenceRequestId` | `int?` | FK → AbsenceRequest (if excused) |
| `RecordedById / RecordedAt` | | Who recorded it |

#### `Exam`
| Column | Type | Notes |
|---|---|---|
| `CourseId` | `int` | |
| `ExamType` | `ExamType` | Regular / Corrective |
| `ExamDate` | `DateTime` | |
| `ExamLink` | `string?` | Online exam URL |
| `Location` | `string?` | Physical location |
| `DurationMinutes` | `int` | |
| `IsPublished` | `bool` | Notifies students when published |
| `CorrectiveStudents` | `ICollection<CorrectiveExamStudent>` | Only for corrective exams |

#### `Kpi`
| Column | Type | Notes |
|---|---|---|
| `StudentId` | `Guid` | Submitter |
| `TrackId / CourseId` | `int?` | Optional context |
| `KpiType` | `KpiType` | Certificate / Freelance |
| `Title` | `string` | |
| `IssuingBody / IssueDate / ExpiryDate` | | Certificate fields |
| `Platform / ClientContact / ProjectDescription / AmountEarned` | | Freelance fields |
| `FileUrl` | `string` | Proof document |
| `Status` | `KpiStatus` | Pending / Approved / Rejected |
| `ReviewedById / ReviewedAt / ReviewNote` | | Supervisor review |

#### `Notification`
| Column | Type | Notes |
|---|---|---|
| `UserId` | `Guid` | Recipient |
| `Title / Body` | `string` | |
| `Type` | `NotificationType` | ExamScheduled / GradePublished / KpiDecision / … |
| `RelatedEntityId` | `string?` | e.g. exam ID for deep-linking |
| `IsRead / ReadAt` | | Read state |

#### `AbsenceRequest`
| Column | Type | Notes |
|---|---|---|
| `StudentId` | `Guid` | |
| `RequestedDatesJson` | `string` | JSON array of dates |
| `Reason` | `string` | |
| `Status` | `AbsenceRequestStatus` | Pending / Approved / Rejected |
| `ReviewedById / ReviewedAt / ReviewNote` | | Staff review |

---

## 5. Authentication & Authorization

### JWT Flow

```
1. POST /api/v1/auth/login  →  { accessToken, expiresInSeconds, role, userId, fullName, mustChangePassword }
                                + Set-Cookie: refreshToken (HttpOnly, SameSite=Strict, 7 days)

2. Client attaches:  Authorization: Bearer <accessToken>  on every request

3. Access token expires in 15 minutes (configurable via Jwt:AccessTokenMinutes)

4. POST /api/v1/auth/refresh  →  { accessToken, expiresInSeconds }
   Cookie auto-sent by browser → new access token returned, cookie rotated

5. POST /api/v1/auth/logout  →  204, cookie deleted
```

### Token Details

- **Algorithm:** HS256 (HMAC-SHA256)
- **Claims:** `sub` (userId), `role`, `name`, `jti`
- **Access token lifetime:** 15 min (configurable)
- **Refresh token lifetime:** 7 days
- **Cookie path:** `/api/v1/auth` — refresh cookie only sent to auth endpoints
- **Cookie `Secure` flag:** `Request.IsHttps` — `true` on HTTPS, `false` on HTTP (dev)

### Authorization Policies

| Policy | Who |
|---|---|
| `IsTrainingManager` | Role == TrainingManager |
| `IsStaff` | Role in { TrainingManager, Supervisor, TA, StudentAffairs } |
| *(default Authorize)* | Any authenticated user |

### Angular Auth Flow

```typescript
// auth.service.ts
_state = signal<AuthState | null>(loadFromSessionStorage)

isAuthenticated = computed(() => state.expiresAt > new Date())

// On login success:
expiresAt = new Date(Date.now() + res.expiresInSeconds * 1000)

// HTTP interceptor:
//   1. Attaches Bearer token on every request
//   2. On 401 response → calls /auth/refresh → retries original request
//   3. If refresh also fails → redirects to /login
```

---

## 6. API Reference

All routes are prefixed with `/api/v1`. All require `Authorization: Bearer <token>` unless marked **[public]**.

### 6.1 Authentication — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/login` | public | Login with email + password |
| `POST` | `/refresh` | public (cookie) | Rotate access token using refresh cookie |
| `POST` | `/logout` | Bearer | Invalidate refresh token, delete cookie |
| `POST` | `/change-password` | Bearer | Change own password |
| `POST` | `/forgot-password` | public | Send reset email (always 204) |
| `POST` | `/reset-password` | public | Apply reset token + new password |

**Login request:**
```json
{ "email": "admin@iti.local", "password": "Admin!2026" }
```
**Login response:**
```json
{
  "accessToken": "eyJ...",
  "expiresInSeconds": 900,
  "role": "TrainingManager",
  "userId": "...",
  "fullName": "Ahmed Salem",
  "mustChangePassword": false
}
```

---

### 6.2 Users — `/api/v1/users`

| Method | Path | Policy | Description |
|---|---|---|---|
| `GET` | `/users` | TrainingManager | List users (filter: `role`, `branchId`, `isActive`, `q`, `page`, `pageSize`) |
| `POST` | `/users` | IsStaff | Create user → returns `{ id, tempPassword }` |
| `GET` | `/users/{id}` | Bearer | Get user detail (own profile or staff) |
| `PUT` | `/users/{id}` | IsStaff | Update user |
| `PATCH` | `/users/{id}/deactivate` | TrainingManager | Soft-disable account |
| `GET` | `/users/me` | Bearer | Get own profile |
| `PUT` | `/users/me` | Bearer | Update own phone/photo |

**Create user request:**
```json
{
  "email": "student@iti.local",
  "fullName": "Sara Ahmed",
  "role": "Student",
  "phone": "01012345678",
  "gender": "Female",
  "dateOfBirth": "2000-05-15",
  "nationalId": "12345678901234",
  "groupId": 1
}
```

---

### 6.3 Branches & Intakes — `/api/v1/branches`

| Method | Path | Policy | Description |
|---|---|---|---|
| `GET` | `/branches` | IsStaff | List branches (`?includeArchived=true`) |
| `POST` | `/branches` | TrainingManager | Create branch |
| `GET` | `/branches/{id}` | IsStaff | Get branch detail |
| `PUT` | `/branches/{id}` | TrainingManager | Update branch |
| `PATCH` | `/branches/{id}/archive` | TrainingManager | Archive branch |
| `GET` | `/branches/{branchId}/intakes` | IsStaff | List intakes for branch |
| `POST` | `/branches/{branchId}/intakes` | TrainingManager | Create intake |
| `GET` | `/intakes/{id}` | IsStaff | Get intake detail |
| `PUT` | `/intakes/{id}` | TrainingManager | Update intake |
| `PATCH` | `/intakes/{id}/archive` | TrainingManager | Archive intake |

---

### 6.4 Tracks & Courses — `/api/v1`

| Method | Path | Policy | Description |
|---|---|---|---|
| `GET` | `/intakes/{intakeId}/tracks` | IsStaff | List tracks in intake |
| `POST` | `/intakes/{intakeId}/tracks` | TrainingManager | Create track |
| `GET` | `/tracks/{id}` | IsStaff | Get track |
| `PUT` | `/tracks/{id}` | IsStaff | Update track |
| `PATCH` | `/tracks/{id}/assign-supervisor` | TrainingManager | Change supervisor |
| `PATCH` | `/tracks/{id}/archive` | TrainingManager | Archive track |
| `GET` | `/tracks/{trackId}/courses` | Bearer | List courses in track |
| `POST` | `/tracks/{trackId}/courses` | IsStaff | Create course |
| `PUT` | `/courses/{id}` | IsStaff | Update course |
| `PATCH` | `/courses/{id}/archive` | IsStaff | Archive course |

---

### 6.5 Groups — `/api/v1`

| Method | Path | Policy | Description |
|---|---|---|---|
| `GET` | `/tracks/{trackId}/groups` | IsStaff | List groups in track |
| `POST` | `/tracks/{trackId}/groups` | IsStaff | Create group |
| `PUT` | `/groups/{id}` | IsStaff | Update group |
| `PATCH` | `/groups/{id}/archive` | IsStaff | Archive group (fails if has students) |
| `GET` | `/groups/{id}/tas` | IsStaff | List TAs assigned to group |
| `POST` | `/groups/{id}/tas` | IsStaff | Assign TA to group |
| `DELETE` | `/groups/{id}/tas/{userId}` | IsStaff | Remove TA from group |
| `GET` | `/groups/{id}/students` | IsStaff | List students in group |

---

### 6.6 Grades — `/api/v1`

| Method | Path | Policy | Description |
|---|---|---|---|
| `GET` | `/courses/{courseId}/grades` | Bearer | List all grade rows for course |
| `PUT` | `/courses/{courseId}/grades/{studentId}/lab` | Bearer | Set lab grade (TA/supervisor only) |
| `PUT` | `/courses/{courseId}/grades/{studentId}/exam` | Bearer | Set exam grade |
| `PATCH` | `/courses/{courseId}/grades/publish` | Bearer | Publish all grades (triggers notifications) |
| `GET` | `/students/{studentId}/grades` | Bearer | Get a student's grades across all courses |
| `GET` | `/students/me/grades` | Bearer | Get own grades (Student) |

**Set grade request:**
```json
{ "value": 87.5 }
```

---

### 6.7 Attendance — `/api/v1`

| Method | Path | Description |
|---|---|---|
| `POST` | `/courses/{courseId}/groups/{groupId}/attendance` | Record a full session (all students) |
| `GET` | `/courses/{courseId}/groups/{groupId}/attendance` | List session summaries |
| `GET` | `/courses/{courseId}/groups/{groupId}/attendance/{date}/{ordinal}` | Get one session's detail |
| `GET` | `/students/{studentId}/attendance` | Get student attendance summary |
| `GET` | `/students/me/attendance` | Own attendance (Student) |
| `POST` | `/absence-requests` | Submit absence request (Student) |
| `GET` | `/absence-requests` | List requests (own for Student, all for staff) |
| `PATCH` | `/absence-requests/{id}/review` | Approve/reject request (TA/Supervisor) |

**Record session request:**
```json
{
  "sessionDate": "2025-06-01",
  "sessionType": 1,
  "sessionOrdinal": 1,
  "entries": [
    { "studentId": "...", "isAbsent": false, "notes": null },
    { "studentId": "...", "isAbsent": true,  "notes": "No prior notice" }
  ]
}
```

---

### 6.8 Exams — `/api/v1`

| Method | Path | Description |
|---|---|---|
| `POST` | `/courses/{courseId}/exams` | Schedule exam |
| `GET` | `/courses/{courseId}/exams` | List exams for course |
| `GET` | `/exams/{examId}` | Get exam detail |
| `PUT` | `/exams/{examId}` | Update exam |
| `PATCH` | `/exams/{examId}/publish` | Publish exam (sends notifications to enrolled students) |
| `GET` | `/students/me/exams` | Get own upcoming published exams (Student) |

**Create exam request:**
```json
{
  "examType": 0,
  "examDate": "2025-06-15T09:00:00Z",
  "location": "Hall B-12",
  "durationMinutes": 120,
  "notes": "Open-book allowed",
  "correctiveStudentIds": null
}
```

---

### 6.9 KPI — `/api/v1/kpi`

| Method | Path | Description |
|---|---|---|
| `POST` | `/kpi` | Submit KPI (Student) |
| `GET` | `/kpi/me` | Get own submissions (Student) |
| `GET` | `/kpi/pending` | List pending submissions (Supervisor/TrainingManager) |
| `GET` | `/kpi/{id}` | Get single KPI |
| `PATCH` | `/kpi/{id}/review` | Approve or reject KPI (Supervisor) |

**Submit KPI (certificate) request:**
```json
{
  "kpiType": 0,
  "title": "AWS Cloud Practitioner",
  "trackId": 1,
  "issuingBody": "Amazon Web Services",
  "issueDate": "2025-05-01",
  "platform": "Credly",
  "fileUrl": "https://credly.com/badges/..."
}
```

**Review KPI request:**
```json
{ "approve": true, "reviewNote": "Valid certification, verified on Credly." }
```

---

### 6.10 Notifications — `/api/v1/notifications`

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications` | Get own notifications (`?unreadOnly=true`) |
| `PATCH` | `/notifications/{id}/read` | Mark one as read |
| `PATCH` | `/notifications/read-all` | Mark all as read |

Notifications are **auto-created** by the system when:
- An exam is published → all enrolled students notified
- Grades are published → enrolled students notified
- A KPI is approved/rejected → submitting student notified
- An absence request is reviewed → requesting student notified

---

## 7. Frontend Architecture

### Tech

- **Angular 17** — standalone components, no NgModule anywhere
- **Signals** — `signal()` and `computed()` for all reactive state
- **Lazy loading** — every feature component is loaded via `loadComponent()`
- **HTTP interceptor** — auto-attaches JWT; retries on 401 after refresh

### Route Tree

```
/login                    → LoginComponent             (public)
/                         → ShellComponent (auth guard)
  /dashboard              → DashboardComponent
  /students               → StudentsComponent
  /grades                 → GradesComponent
  /attendance             → AttendanceComponent
  /exams                  → ExamsComponent
  /kpi                    → KpiComponent
  /notifications          → NotificationsComponent
  ** → redirect /
```

### Auth Service (`core/services/auth.service.ts`)

```typescript
// Signals
_state          = signal<AuthState | null>(...)   // persisted in sessionStorage
isAuthenticated = computed(() => state.expiresAt > now)
currentUser     = computed(() => state)
role            = computed(() => state?.role)

// Methods
login(req)          → Observable<LoginResponse>   // sets state + sessionStorage
logout()            → void                        // clears state, calls API, navigates /login
refreshToken()      → Observable<RefreshResponse> // used by interceptor on 401
getAccessToken()    → string | null
hasRole(...roles)   → boolean
```

### Auth State Shape

```typescript
interface AuthState {
  accessToken: string;
  userId: string;
  fullName: string;
  role: UserRole;
  expiresAt: Date;         // computed from expiresInSeconds
  mustChangePassword: boolean;
}
```

### Key Design Decisions

- `expiresAt` is **never stored as-is from the server** — it's computed client-side as `new Date(Date.now() + expiresInSeconds * 1000)` to avoid clock skew.
- State is in `sessionStorage` (not `localStorage`) so it's cleared when the tab closes.
- The interceptor catches 401, calls `/auth/refresh`, and **retries the original request** — the user never sees a session-expired error for normal usage.

### Component Pattern

Every feature component follows this structure:

```typescript
@Component({ standalone: true, imports: [...], template: `...` })
export class FeatureComponent implements OnInit {
  data    = signal<Dto[]>([]);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Dto[]>(`${environment.apiBase}/endpoint`).subscribe({
      next: d  => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
```

---

## 8. Design System (Stitch)

The UI follows the **Stitch ITI Training Management Portal** design system.

### Color Tokens (`styles.scss`)

```css
--iti-red:        #B03633   /* Primary brand red — buttons, active nav, icons */
--dark-crimson:   #901B20   /* Hover state for red */
--primary:        #8f1d1e   /* Slightly darker, used in text/headings */
--deep-navy:      #203947   /* Sidebar background */

--bg:             #fbf9f9   /* Page background */
--surface:        #ffffff   /* Cards, panels */
--surface-low:    #f5f3f3   /* Hover backgrounds */
--surface-gray:   #EDEDED   /* Borders, dividers */
--surface-dim:    #dbdad9   /* Scrollbar thumb */

--on-surface:     #1b1c1c   /* Primary text */
--secondary:      #496271   /* Secondary text, labels */
--on-surface-var: #58413f   /* Form labels */
--outline:        #8c716e   /* Placeholder, muted text */

--sidebar-w:      280px
--header-h:       64px
--card-shadow:    0 4px 20px rgba(0,0,0,.05)
--red-shadow:     0 4px 20px rgba(176,54,51,.20)
```

### Typography

| Use | Font | Weight |
|---|---|---|
| Display headings | Montserrat | 800 |
| Section headings | Montserrat | 700 |
| UI labels | Inter | 600 |
| Body text | Inter | 400 |

Both loaded from **Google Fonts CDN** in `index.html`.

### Icons

**Material Symbols Outlined** — Google Fonts CDN. Usage:
```html
<span class="material-symbols-outlined">dashboard</span>
<!-- Filled variant: add class "icon-fill" -->
<span class="material-symbols-outlined icon-fill">grade</span>
```

### Global CSS Classes

| Class | Purpose |
|---|---|
| `.card` | White box, 12px radius, shadow |
| `.stat-card` | KPI card with hover navy effect |
| `.btn--primary` | Red button with shadow |
| `.btn--ghost` | Bordered ghost button |
| `.badge--approved` | Green pill |
| `.badge--rejected` | Red pill |
| `.badge--pending` | Yellow/brown pill |
| `.badge--active` | Blue pill |
| `.data-table` | Full-width table with hover rows |
| `.form-field` | Label + input-wrap with icon |
| `.page-header` | Flex row: title left, action right |
| `.empty-state` | Centered icon + text |
| `.spinner` | Red spinning loader |

### Layout

- **Sidebar:** Fixed 280px left, `#203947` background, active nav has left red border + red-tinted background
- **Topbar:** 64px high, frosted glass (`backdrop-filter: blur(12px)`), `"ITI Branch Portal"` in Montserrat/red
- **Content:** `flex: 1`, scrollable, `padding: 32px`

---

## 9. Seed Data & Test Accounts

The `DbSeeder` runs automatically on every startup in **Development** mode and is **idempotent** (checks if data already exists before inserting).

### Accounts

| Email | Password | Role |
|---|---|---|
| `admin@iti.local` | `Admin!2026` | TrainingManager |
| `supervisor@iti.local` | `Super!2026` | Supervisor |
| `ta@iti.local` | `Ta!2026Ta` | TA |
| `sara.ahmed@iti.local` | `Student!2026` | Student |
| `omar.khaled@iti.local` | `Student!2026` | Student |
| `nour.hassan@iti.local` | `Student!2026` | Student |
| `youssef.ali@iti.local` | `Student!2026` | Student |
| `layla.ibrahim@iti.local` | `Student!2026` | Student |
| `karim.mahmoud@iti.local` | `Student!2026` | Student |
| `hana.samir@iti.local` | `Student!2026` | Student |
| `adam.tarek@iti.local` | `Student!2026` | Student |

### Seeded Data

| Entity | Count | Notes |
|---|---|---|
| Intake | 1 | "Intake 2024" (Oct 2024 – Jul 2025), Branch: Alexandria |
| Track | 1 | "Information Technology" (IT), supervisor = Ali Hassan |
| Course | 2 | Web Development (WEB-101), Database Fundamentals (DB-101) |
| Group | 1 | "Group A" (GRP-A), TA = Mohamed Kamal |
| Enrollments | 16 | 8 students × 2 courses |
| Grades | 16 | Lab + exam + total, all published |
| Attendance records | 40 | 5 sessions × 8 students for WEB-101 |
| Exams | 1 | Published; scheduled 14 days after seed date |
| KPI submissions | 4 | 2 approved certificates, 1 pending certificate, 1 pending freelance |
| Notifications | 14 | Exam announcements, grade publish, KPI decisions |

---

## 10. How to Run Locally

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 18+](https://nodejs.org) + npm
- SQL Server LocalDB (included with Visual Studio) **or** SQL Server Express

### Step 1 — Clone & open

```bash
git clone https://github.com/MoSamir70/ITI-Management-Platform.git
cd ITI-Management-Platform
```

Open the folder in **VS Code**.

### Step 2 — Configure API secrets (first time only)

The API needs a JWT signing key. In development, `appsettings.Development.json` already has defaults. Check it contains:

```json
{
  "Jwt": {
    "SigningKey": "your-super-secret-key-at-least-32-chars",
    "Issuer":    "iti-portal",
    "Audience":  "iti-portal",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays":   7
  },
  "ConnectionStrings": {
    "Default": "Server=(localdb)\\mssqllocaldb;Database=ItiPortal;Trusted_Connection=True;"
  }
}
```

### Step 3 — Run the API

Open **Terminal 1** in VS Code:

```bash
cd src/ItiPortal.Api
dotnet run --launch-profile http
```

The API starts on **http://localhost:5251**.  
On first launch it automatically:
1. Applies all EF Core migrations (creates the DB)
2. Seeds roles, admin account, and all dummy data

> Swagger UI is available at: http://localhost:5251/swagger

### Step 4 — Run the Frontend

Open **Terminal 2** in VS Code:

```bash
cd frontend
npm install          # first time only
npm start
```

The Angular dev server starts on **http://localhost:4200**.  
All `/api/*` requests are proxied to `http://localhost:5251` via `proxy.conf.json`.

### Step 5 — Log in

Open http://localhost:4200 and log in with any seeded account (see §9).

---

## 11. Git Workflow

### Branch Model

```
main ← develop ← feature/*
```

- `main` — production only. Never push directly.
- `develop` — integration branch. All features merge here via PR.
- `feature/*` — one branch per feature, cut from `develop`.

### Starting a feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Submitting work

```bash
git push -u origin feature/your-feature-name
gh pr create --base develop --head feature/your-feature-name --title "feat: ..."
```

### Commit message style

```
feat(grades): publish endpoint with student notifications
fix(auth): refresh cookie Secure flag on HTTP dev
chore(seed): add dummy KPI and attendance data
```

---

## 12. Environment Configuration

### Backend (`appsettings.json`)

| Key | Default | Description |
|---|---|---|
| `ConnectionStrings:Default` | LocalDB | SQL Server connection string |
| `Jwt:SigningKey` | — | HMAC-SHA256 key (min 32 chars) |
| `Jwt:Issuer` | `iti-portal` | JWT issuer claim |
| `Jwt:Audience` | `iti-portal` | JWT audience claim |
| `Jwt:AccessTokenMinutes` | `15` | Access token lifetime |
| `Jwt:RefreshTokenDays` | `7` | Refresh token lifetime |

### Frontend (`environment.ts`)

```typescript
export const environment = {
  production: false,
  apiBase: '/api/v1'    // proxied to localhost:5251 in dev
};
```

### Dev Proxy (`proxy.conf.json`)

```json
{
  "/api": {
    "target": "http://localhost:5251",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## 13. Error Code Glossary

All error responses follow RFC 7807 Problem Details:
```json
{ "type": "email_already_exists", "title": "email_already_exists", "status": 409 }
```

| Code | HTTP | Meaning |
|---|---|---|
| `invalid_credentials` | 401 | Wrong email or password |
| `account_inactive` | 401 | Account has been deactivated |
| `missing_refresh_token` | 401 | Refresh cookie not present |
| `invalid_refresh_token` | 401 | Token expired, revoked, or not found |
| `wrong_current_password` | 400 | Change-password: current password wrong |
| `email_already_exists` | 409 | User create: duplicate email |
| `national_id_already_exists` | 409 | User create: duplicate NID |
| `forbidden_role` | 403 | Caller cannot create users with that role |
| `branch_code_exists` | 409 | Branch code already taken |
| `has_active_intakes` | 409 | Cannot archive branch with active intakes |
| `intake_not_found` | 404 | Track create: intake doesn't exist |
| `invalid_supervisor_role` | 400 | Assigned user is not a Supervisor |
| `supervisor_already_assigned_in_intake` | 409 | One supervisor per intake per track |
| `track_not_found` | 404 | Course/group create: track doesn't exist |
| `group_name_exists_in_track` | 409 | Duplicate group name |
| `group_has_students` | 409 | Cannot archive group with enrolled students |
| `ta_already_assigned` | 409 | TA already in group |
| `invalid_ta_role` | 400 | Assigned user is not a TA |
| `student_not_enrolled` | 404 | Grade set: student not in course |
| `lab_grades_not_applicable_for_grading_mode` | 409 | Course doesn't use lab grades |
| `incomplete_grades` | 409 | Grade publish: some students have no grade |
| `forbidden` | 403 | Caller lacks permission for this resource |
| `not_found` | 404 | Entity does not exist |
