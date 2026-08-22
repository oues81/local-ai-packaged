---
description: Generate or update the data model for a feature
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Generate or update `specs/<feature-id>/data-model.md` from the spec and plan.

1. Determine the feature ID from the user's request or the active spec.
2. Read `spec.md` and `plan.md` for that feature.
3. Identify entities, relations, invariants, and API contracts implied by the requirements and implementation plan.
4. Keep the model lightweight: one entity per logical concept, one invariant per non-obvious rule, one API contract per public surface.
5. Record migration notes only when the feature changes persisted or serialized shape.
6. Cross-check terminology with the spec and plan; reconcile contradictions rather than duplicating them.
7. Persist the data model and summarize what changed.
