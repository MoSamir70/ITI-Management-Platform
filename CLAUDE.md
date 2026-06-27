# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ITI Management Platform — a web platform for managing ITI (Information Technology Institute) operations, with planned modules for authentication, students, courses, and instructors. The project is in early development; no source code exists yet.

## Git Workflow

This project enforces a strict branching model. **Never push directly to `main` or `develop`.**

```
main ← develop ← feature/*
```

### Branch rules
- `main`: production-only, PR from `develop` required, force-push and deletion blocked.
- `develop`: integration branch, PR from `feature/*` required, force-push and deletion blocked.
- `feature/*`: one branch per feature, always cut from the latest `develop`.

### Starting work on a feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<feature-name>
```

### Submitting work
Push the feature branch and open a Pull Request targeting `develop`. A reviewer merges it — never self-merge to `develop` or `main`.

### Keeping a feature branch up to date
```bash
git checkout develop && git pull origin develop
git checkout feature/<feature-name>
git merge develop
```

Resolve any merge conflicts in the feature branch before opening the PR.

### Branch naming
```
feature/authentication
feature/student-module
feature/course-module
feature/instructor-module
feature/frontend
feature/database
bugfix/<description>
hotfix/<description>
```

### Commit messages
Use a short imperative sentence describing what the commit does:
```
Add JWT authentication
Create Student entity
Implement Course CRUD
Fix login validation
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
