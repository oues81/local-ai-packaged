---
description: Gap analysis after implementation
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Run convergence analysis for a feature after implementation, quality gates, and verification.

1. Determine the feature ID from the user's request or the active spec.
2. Read the spec, plan, tasks, checklist, and any verification evidence.
3. Read the quality-gate artifacts if present:
   - `specs/<feature-id>/review.md` (from `delivery.review`)
   - `specs/<feature-id>/tests.md` (from `delivery.tests`)
   - `specs/<feature-id>/lint-report.md` (from `delivery.lint`)
   - `specs/<feature-id>/security-review.md` (from `delivery.security`)
4. Compare actual implementation (recent commits, changed files, tests) against the expected artifacts.
5. Incorporate the gate artifacts into the gap analysis: every blocker/high finding from `review.md` or `security-review.md` is a high-severity gap; every untested acceptance criterion from `tests.md` is a medium-severity gap; every remaining lint issue from `lint-report.md` is a low-severity gap.
6. Produce `specs/<feature-id>/convergence.md` with:
   - Summary of implemented vs. planned state
   - Gaps table: artifact, expected, actual, severity, resolution (includes gate findings)
   - Resolved and unresolved decisions
   - Delivery-readiness checklist
7. Do not mark delivery readiness as complete unless all high-severity gaps are resolved or explicitly accepted by the user.
8. Report remaining risks and the authority required for any publish, deploy, or merge action.
