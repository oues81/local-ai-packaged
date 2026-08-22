---
description: Frontier model strategic analysis and wave decomposition prep
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Produce a frontier-model strategic analysis that feeds the wave-plan phase.

1. Determine the feature ID from the user's request or the active spec.
2. Read `specs/<feature-id>/spec.md`, `specs/<feature-id>/plan.md`, and `specs/<feature-id>/data-model.md` if present.
3. Analyze the plan for parallelization opportunities: identify independent task groups, shared dependencies, and the critical path.
4. Produce `specs/<feature-id>/wave-prep.md` with:
   - Candidate wave decomposition (which tasks can run in parallel)
   - Dependency graph between waves
   - Risk notes for each wave (shared-file conflicts, ordering constraints)
   - Recommended wave type (fix, feature, refactor) and dispatch mode
5. This is **read-only during planning** — do not mutate `plan.md` or `tasks.md` (those are owned by `delivery.plan` and `delivery.tasks`). Pause for user approval before the wave-plan phase consumes `wave-prep.md`.
6. If no parallelization is possible, state that explicitly and recommend a single-wave sequential execution.
