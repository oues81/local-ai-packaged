---
description: Resolve ambiguities and unresolved decisions in an existing spec
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Resolve ambiguities, contradictions, and unresolved decisions in an existing `specs/<feature-id>/spec.md` before planning.

1. Determine the feature ID from the user's request or the active spec; default to the most recently modified spec under `specs/`.
2. Read the current `spec.md` and identify all `unresolved-decisions`, ambiguous acceptance criteria, undefined terms, and contradictions between sections.
3. Ask up to 5 highly targeted clarification questions. Prefer concrete either/or choices over open-ended questions. Resolve as many as possible from repository evidence before asking the user.
4. Encode the answers back into `spec.md`: close unresolved decisions, tighten acceptance criteria, define terms, and reconcile contradictions.
5. If a clarification reveals a scope change, update the scope and non-goals sections accordingly and flag the change in the spec's Status field.
6. Persist the updated spec and report the number of decisions resolved, any remaining unresolved decisions, and whether the spec is now ready for `0140-plan`.
