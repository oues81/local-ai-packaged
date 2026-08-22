---
description: Verify behavior, tests, specifications, and operational readiness
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Verify independently from implementation claims for the active feature.

1. Determine the feature ID from the user's request or the active spec.
2. Read `specs/<feature-id>/checklist.md` and `specs/<feature-id>/spec.md`.
3. Run the acceptance criteria, quality checklist, relevant static checks, tests, build or smoke checks, and ACOS integrity checks.
4. Trace each acceptance criterion to evidence. Inspect failure paths and generated-file drift.
5. Report pass, fail, not run, and residual risk separately; never convert an unrun check into a pass.
