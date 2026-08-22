---
description: Generate a quality checklist for a spec or plan
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Generate or update `specs/<feature-id>/checklist.md` for the supplied feature.

1. Determine the feature ID from the user's request, the active spec, or the most recently modified spec directory.
2. Read the current `spec.md`, `plan.md`, `data-model.md`, and `tasks.md` if they exist.
3. Apply the default ACOS quality gates (completeness, clarity, consistency, security, tests) from `.ssot/agents/spec-engine.json`.
4. Produce concrete checklist items that reference the existing artifacts; do not invent work that is not implied by the spec or plan.
5. Mark items as checked only when there is evidence in the repository; leave unverified items unchecked with a note.
6. Persist the checklist and report the coverage ratio and any gaps.
