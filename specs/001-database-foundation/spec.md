# Feature Specification: Database Foundation

**Feature Branch**: `feature/database-foundation`
**Created**: 2026-06-27
**Status**: Draft
**Owner**: NadaFoudaa
**Phase**: 1 — Foundation
**Input**: Establish the relational schema, EF Core DbContext, and initial migration that every downstream module depends on.

## User Scenarios & Testing

### User Story 1 — Provisioning a clean database (Priority: P1)

A new developer clones the repository, runs `dotnet ef database update`, and gets a fully provisioned SQL Server schema matching the blueprint, including seed data for the Training Manager role and one default branch.

**Why this priority**: Nothing else in the platform can be built or tested until the schema exists. This is the gating dependency for every other spec.

**Independent Test**: Drop the local database, run `dotnet ef database update`, then run `dotnet test` on the `Persistence.IntegrationTests` project — all migration round-trip tests pass and seed data is present.

**Acceptance Scenarios**:
1. **Given** an empty SQL Server instance, **When** the developer runs migrations, **Then** all 15 tables from the blueprint (Branches, Intakes, Tracks, Groups, GroupTAs, Users, Courses, StudentCourseEnrollments, Grades, Attendance, AbsenceRequests, Exams, CorrectiveExamStudents, KPIs, Notifications) exist with the documented columns and constraints.
2. **Given** a freshly migrated database, **When** the seed runs, **Then** exactly one Training Manager user, one Branch, and the supporting Identity role rows exist.
3. **Given** an existing database, **When** the developer runs `dotnet ef migrations remove` then re-applies, **Then** the schema is identical (down migration is reversible).

### User Story 2 — Querying with strong typing (Priority: P2)

A backend developer writes a LINQ query against `AppDbContext.Tracks` and gets typed results including navigation properties for `Intake`, `Supervisor`, and `Groups`.

**Why this priority**: Without correctly configured relationships, every downstream module would re-litigate FK shapes. Configuring them once here removes that cost.

**Independent Test**: A `DbContext` integration test loads a track with `Include(t => t.Groups).ThenInclude(g => g.TAs)` and asserts the navigation graph hydrates correctly.

**Acceptance Scenarios**:
1. **Given** seeded data with one track, two groups, and three TAs, **When** the test eager-loads the track, **Then** the resulting object graph contains the expected groups and TAs without lazy-loading.
2. **Given** an attempt to delete a Branch that has Intakes, **When** SaveChanges runs, **Then** an FK violation is raised (ON DELETE RESTRICT).

### User Story 3 — Audit trail (Priority: P3)

Every entity records `CreatedAt`/`UpdatedAt` automatically.

**Why this priority**: Required by the blueprint for every table; cheaper to centralise now than retrofit.

**Independent Test**: A repository test creates an entity and asserts `CreatedAt` is populated by `SaveChangesAsync` without explicit assignment.

**Acceptance Scenarios**:
1. **Given** a new Branch entity, **When** `SaveChangesAsync` runs, **Then** `CreatedAt` is set to the current UTC time and `UpdatedAt` equals `CreatedAt`.
2. **Given** an existing Branch, **When** a property is modified and saved, **Then** `UpdatedAt` is refreshed and `CreatedAt` is unchanged.

### Edge Cases

- Concurrent updates to the same entity (optimistic concurrency via `xmin`/rowversion).
- Migration applied against a database that already has a partial schema from an aborted prior run.
- Cascading restrictions: deleting a User who is a Supervisor while assigned to a Track must fail.
- Soft-delete of a Branch (IsActive=false) must NOT cascade into Intakes.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define EF Core entity classes for all 15 tables enumerated in blueprint Section 14.1 with the exact column names, types, and nullability listed in the blueprint.
- **FR-002**: The `AppDbContext` MUST register every entity with explicit `IEntityTypeConfiguration<T>` classes (no implicit conventions for FKs).
- **FR-003**: The system MUST extend ASP.NET Core Identity (`IdentityUser<Guid>`) as the `User` entity.
- **FR-004**: The system MUST configure ON DELETE RESTRICT for every FK unless soft-delete (`IsActive`) is documented for that table.
- **FR-005**: The system MUST ship a single `InitialCreate` migration that produces the complete schema; subsequent specs add migrations, never modify this one.
- **FR-006**: The system MUST seed: one Training Manager user (`admin@iti.local`, password `Admin!2026`, MustChangePassword=true), all five Identity roles, one default Branch (`Alexandria`).
- **FR-007**: The system MUST implement automatic `CreatedAt`/`UpdatedAt` population via a `SaveChangesInterceptor`.
- **FR-008**: The system MUST configure a rowversion column on every entity for optimistic concurrency control.
- **FR-009**: The system MUST expose the connection string via `appsettings.json` with a `DefaultConnection` key, defaulting to LocalDB.
- **FR-010**: The system MUST include integration tests using Testcontainers (SQL Server) that apply migrations to a fresh database and assert table shapes.

### Key Entities

The 15 entities from blueprint Section 14.1, with exact column definitions from blueprint sections 3.x, 4.2, 5.2, 6.2, 7.2, 7.3, 8.1, 9.3, and 14.2.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `dotnet ef database update` against an empty LocalDB completes in under 30 seconds.
- **SC-002**: 100% of blueprint tables and columns are represented in code.
- **SC-003**: Migration round-trip test (up → down → up) passes.
- **SC-004**: A fresh developer can clone, restore, migrate, and run tests in under 5 minutes from a clean machine with the .NET 8 SDK installed.

## Assumptions

- SQL Server LocalDB is acceptable for development; production targets full SQL Server 2019+.
- Guid primary keys are used for `User` (Identity default); other entities use `int IDENTITY` per blueprint.
- File uploads (PhotoUrl, FileUrl) store paths, not blobs; the storage abstraction is out of scope for this spec and addressed in spec 010.
- All timestamps are stored in UTC.
