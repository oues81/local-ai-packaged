---
description: Establish or update the project constitution — principles, constraints, and authority boundaries
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the constitutional objective. Minimize questions.

1. Read the existing `.ssot/constitution.md` if it exists. If it already contains meaningful content, reconcile rather than overwrite.
2. Identify the project's core principles, constraints, and authority boundaries from:
   - The user's stated objective
   - Repository evidence (README, existing docs, architecture decisions)
   - Existing `.ssot/decisions.md` entries
3. Write or update `.ssot/constitution.md` with clear, numbered principles.
4. The constitution is the highest-level governance document. It constrains all specifications and plans.
5. Do not add generic boilerplate. Every principle must be specific to the project.
6. After writing, log the decision in `.ssot/decisions.md` and update `.ssot/status.md`.
7. The constitution is a prerequisite for `0100-spec`. If no constitution exists, `0100-spec` will prompt to create one first.
