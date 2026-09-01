---
description: Persist a factual end-of-session handoff
personalized: true
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Update `.ssot/status.md` and `.ssot/handoff.md`. Record completed work, exact current state, modified files, verification results, unresolved problems, next recommended action, and commands needed to resume. Separate facts from assumptions. Do not claim completion when required checks failed or were not run.

**Project-specific verification (local-ai-packaged)**: this is an infrastructure project with
no test suite — do not report "tests passed" as a verification. Instead, run and record the
result of `docker compose config --quiet` (add the override files relevant to the session,
e.g. `-f docker-compose.yml -f docker-compose.minimal.yml`) before claiming a compose or
Dockerfile change is verified. If a container was touched, also record whether it was
restarted and observed healthy (`docker compose ps`), not merely that the config parses.

If the canonical context sources under `.ssot/agents/context/` (e.g., `AGENTS.src.md`, `CLAUDE.src.md`) were edited during the session, run `npx --no-install acos --fix` so the generated projections (`AGENTS.md`, `CLAUDE.md`, and client-specific pointers) are regenerated before handing off. Do not edit generated projections directly.

Run `npx --no-install acos-handoff-check --root .` after writing. Reconcile any Git state/count contradiction before
ending the session; do not edit the handoff automatically merely to increase its score.

After the handoff is written, check `.ssot/agents/dependencies.json`. If it exists, is valid JSON, and contains at least one dependency, invoke the `project.crosshandoff` entrypoint (`1060-cross-handoff`) to produce a cross-project handoff report for each declared downstream dependency. Include the resulting report in the session summary or attach it to the handoff.
