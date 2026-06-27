# ITI Branch Portal — Specifications

This folder contains the feature specifications driving implementation of the
ITI Branch Portal. Each spec corresponds to one feature branch and one PR to
`develop`. Specs are numbered in implementation order — dependencies flow
left-to-right and are noted in each spec's header.

## Index

| #   | Spec                              | Branch                              | Owner            | Phase | Depends on |
|-----|-----------------------------------|-------------------------------------|------------------|-------|------------|
| 001 | [Database Foundation](001-database-foundation/spec.md)         | `feature/database-foundation`       | NadaFoudaa       | 1     | —          |
| 002 | [Authentication](002-authentication/spec.md)                   | `feature/authentication`            | NadaFoudaa       | 1     | 001        |
| 003 | [User Management](003-user-management/spec.md)                 | `feature/user-management`           | NadaFoudaa       | 1     | 002        |
| 004 | [Branch & Intake](004-branch-intake-management/spec.md)        | `feature/branch-intake-management`  | MoSamir70        | 1     | 003        |
| 005 | [Track & Course](005-track-course-management/spec.md)          | `feature/track-course-management`   | MoSamir70        | 2     | 004        |
| 006 | [Group Management](006-group-management/spec.md)               | `feature/group-management`          | MoSamir70        | 2     | 005        |
| 007 | [Grades](007-grades/spec.md)                                   | `feature/grades`                    | alaa-elsated     | 3     | 006        |
| 008 | [Attendance](008-attendance/spec.md)                           | `feature/attendance`                | alaa-elsated     | 3     | 006        |
| 009 | [Exams & Notifications](009-exams-notifications/spec.md)       | `feature/exams-notifications`       | alaa-elsated     | 5     | 007        |
| 010 | [KPI](010-kpi/spec.md)                                         | `feature/kpi`                       | alaa-elsated     | 4     | 006        |
| 011 | [Frontend Shell](011-frontend-shell/spec.md)                   | `feature/frontend-shell`            | salmaabdelkader  | 1–6   | 002+       |

## Governance

All specs comply with `.specify/memory/constitution.md`. Each spec ships with:
- Prioritised user stories (P1/P2/P3) and acceptance scenarios.
- Functional requirements (`FR-NNN`).
- Measurable success criteria (`SC-NNN`).
- Explicit assumptions and edge cases.

Plans and tasks are added per-feature when implementation begins on that branch.
