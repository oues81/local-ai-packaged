---
description: Cross-artifact consistency analysis
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Run a cross-artifact consistency analysis for a feature.

1. Determine the feature ID from the user's request or the active spec.
2. Read `spec.md`, `plan.md`, `data-model.md`, `tasks.md`, and `checklist.md` if present.
3. Compare the artifacts:
   - Acceptance criteria in `spec.md` must be referenced in `plan.md` or `tasks.md`.
   - Entities in `data-model.md` must support the requirements in `spec.md`.
   - Tasks in `tasks.md` must cover every phase and milestone in `plan.md`.
   - `checklist.md` must be consistent with the quality gates in `.ssot/agents/spec-engine.json`.
4. List contradictions, missing coverage, stale references, and unresolved decisions that block implementation.
5. Suggest the smallest corrective action for each issue, but do not mutate files unless explicitly instructed.
6. Persist a brief analysis summary if the user expects durable context; otherwise report in compact form.
