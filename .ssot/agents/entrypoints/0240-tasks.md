---
description: Generate an actionable, dependency-ordered tasks.md for the feature
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Generate or update `specs/<feature-id>/tasks.md` from the approved plan, data model, and checklist — without executing any task.

1. Determine the feature ID from the user's request or the active spec; default to the most recently modified spec under `specs/`.
2. Read `spec.md`, `plan.md`, `data-model.md`, and `checklist.md` if they exist. If `plan.md` is missing, prompt the user to run `0140-plan` first.
3. Break the plan into actionable, dependency-ordered tasks. Each task must have: a stable ID, a one-line description, a dependency list (referencing other task IDs or `none`), an estimate (optional), and an owner (optional).
4. Use the `tasks` default sections from `.ssot/agents/spec-engine.json` (overview, task-list, dependencies, estimates, owners).
5. Ensure every acceptance criterion in `spec.md` maps to at least one task. Ensure every checklist item is covered by a task or a verification step.
6. If the plan declares a `Parallelization strategy` with a `waveType`, annotate tasks with wave assignments but do not generate the wave-config (that happens in `0260-execute`).
7. Persist `tasks.md` and report the task count, dependency depth, and coverage ratio against acceptance criteria.
