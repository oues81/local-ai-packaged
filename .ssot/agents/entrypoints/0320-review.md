---
description: Post-implementation code review for bugs, security, quality, and spec coherence
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Run a structured code review after implementation and before verification.

1. Determine the feature ID from the user's request or the active spec.
2. Inspect the diff since the spec was opened (`git diff` against the base branch or last tagged commit).
3. Review each changed file for:
   - Bugs: logic errors, off-by-one, null dereferences, race conditions, resource leaks.
   - Security: injection, auth bypass, secret exposure, unsafe deserialization (cross-reference `delivery.security` for STRIDE depth).
   - Quality: naming, dead code, duplication, complexity, missing error handling.
   - Spec coherence: does the change satisfy the acceptance criteria in `specs/<feature-id>/spec.md`?
4. Produce `specs/<feature-id>/review.md` with:
   - Findings table: file, line, severity (blocker/high/medium/low/nit), category, description, suggested fix.
   - Summary: blocker count, high count, overall recommendation (approve / request changes / reject).
5. Do not auto-fix — this is a review, not a mutation step. Findings feed `delivery.converge`.
6. If no changes exist to review, report that explicitly and skip.
