# {{feature_id}} — Tasks

## Feature ID

`{{feature_id}}`

## Status

- **Spec phase**: tasks | implement | verify
- **Last updated**: YYYY-MM-DD

## Overview

{What this task list covers and how it relates to the spec and plan.}

## Task list

Each task below uses structured fields (`Files`, `Domain`, `Parallelizable`, `Lane`) that enable
mechanical wave planning via `acos-wave-plan`. Populate them so the wave-config generator can group
tasks into non-overlapping parallel lanes without guessing.

- [ ] **T-001** — {Actionable task description}
  - Depends on: {none | T-...}
  - Estimate: {duration}
  - Owner: {optional}
  - Acceptance: {how to mark done}
  - Files: {comma-separated file paths}
  - Domain: {code | tests | docs | infra}
  - Parallelizable: {true | false}
  - Lane: {auto | A1 | A2 | ...}
- [ ] **T-002** — {Actionable task description}
  - Depends on: T-001
  - Estimate: {duration}
  - Owner: {optional}
  - Acceptance: {how to mark done}
  - Files: {comma-separated file paths}
  - Domain: {code | tests | docs | infra}
  - Parallelizable: {true | false}
  - Lane: {auto | A1 | A2 | ...}

## Dependencies

```text
T-001 -> T-002 -> T-003
T-004 (parallel)
```

## Estimates

| Task | Estimate | Notes |
|------|----------|-------|
| T-001 | {duration} | {notes} |

## Owners

- {Owner}: {tasks or areas of responsibility}

## Verification

- {How completed tasks will be checked against acceptance criteria and the checklist.}
