# Git Workflow Guide

This document describes the Git workflow used for the **ITI Management Platform** project.

---

# Branch Strategy

The repository uses the following branches:

```
main
│
└── develop
      │
      ├── feature/authentication
      ├── feature/student-module
      ├── feature/course-module
      ├── feature/instructor-module
      ├── feature/frontend
      └── ...
```

## Branches

### `main`

* Production-ready code only.
* Never push directly.
* Only receives code through Pull Requests from `develop`.

### `develop`

* Integration branch.
* All completed features are merged here.
* Never push directly.
* Only receives Pull Requests from feature branches.

### `feature/*`

Each new feature must have its own branch created from `develop`.

Examples:

```
feature/authentication
feature/student-module
feature/course-module
feature/frontend
feature/database
```

---

# Initial Repository Setup

Clone the repository:

```bash
git clone <repository-url>
cd ITI-Management-Platform
```

Create the `develop` branch (only once by the repository owner):

```bash
git checkout -b develop
git push -u origin develop
```

---

# Starting a New Feature

Always start from the latest `develop` branch.

```bash
git checkout develop
git pull origin develop

git checkout -b feature/<feature-name>
```

Example:

```bash
git checkout -b feature/student-module
```

---

# Working on a Feature

After making changes:

```bash
git add .
git commit -m "Implement Student CRUD"
git push -u origin feature/student-module
```

---

# Pull Request Workflow

When the feature is completed:

1. Push the feature branch.
2. Open a Pull Request.

```
feature/student-module
          ↓
       develop
```

A reviewer reviews the code and merges the Pull Request.

---

# Release Workflow

When all planned features have been merged into `develop` and tested:

```
develop
    ↓
 main
```

Create a Pull Request from `develop` to `main`.

---

# Repository Rules

## main

* No direct pushes.
* Pull Request required.
* Force pushes blocked.
* Branch deletion blocked.

## develop

* No direct pushes.
* Pull Request required.
* Force pushes blocked.
* Branch deletion blocked.

---

# Branch Naming Convention

Use descriptive names.

```
feature/authentication
feature/student-module
feature/course-module
feature/instructor-module
feature/frontend
feature/database
bugfix/login-error
hotfix/token-validation
```

Avoid names like:

```
test
newbranch
samir
alaa
```

---

# Commit Message Convention

Use clear, descriptive commit messages.

Examples:

```
Add JWT authentication

Create Student entity

Implement Course CRUD

Fix login validation

Update README
```

---

# Team Workflow

Each developer works independently on their assigned feature branch.

```
develop
      ↓
feature/<feature-name>
      ↓
Commit
      ↓
Push
      ↓
Pull Request
      ↓
Code Review
      ↓
Merge into develop
```

After all features are completed:

```
develop
      ↓
Pull Request
      ↓
main
```

---

# Best Practices

* Pull the latest `develop` before starting any new work.
* Keep feature branches focused on a single feature.
* Commit frequently with meaningful messages.
* Never commit directly to `main` or `develop`.
* Resolve merge conflicts in the feature branch before opening a Pull Request.
* Delete feature branches after they have been merged.

---

# Git Commands Cheat Sheet

### Clone

```bash
git clone <repository-url>
```

### Switch to Develop

```bash
git checkout develop
git pull origin develop
```

### Create Feature Branch

```bash
git checkout -b feature/<feature-name>
```

### Check Status

```bash
git status
```

### Stage Changes

```bash
git add .
```

### Commit

```bash
git commit -m "Your commit message"
```

### Push

```bash
git push -u origin feature/<feature-name>
```

### Update Feature Branch with Latest Develop

```bash
git checkout develop
git pull origin develop

git checkout feature/<feature-name>
git merge develop
```

---

# Workflow Summary

```
main
    ▲
    │
develop
    ▲
    │
feature/*
    │
Commit
    │
Push
    │
Pull Request
    │
Code Review
    │
Merge
```

This workflow ensures clean version history, organized feature development, easier code reviews, and reduced merge conflicts.
