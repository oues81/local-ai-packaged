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

Run `npx --no-install acos --check` to confirm projections are in sync, then run
`npx --no-install acos-handoff-check --root .` after writing. Reconcile any Git state/count contradiction before
ending the session; do not edit the handoff automatically merely to increase its score.

After the handoff is written, check `.ssot/agents/dependencies.json`. If it exists, is valid JSON, and contains at least one dependency, invoke the `project.crosshandoff` entrypoint (`1080-cross-handoff`) to produce a cross-project handoff report for each declared downstream dependency. Include the resulting report in the session summary or attach it to the handoff.

## H1 — Next-cycle hypothesis (mandatory before 1040)

Spec: `../acos-mcp-launcher-work/docs/specs/019-cycle-continuity/spec.md` (invariant **H1**).

Before invoking `1040-session-bridge`, write (or refresh)
`.session/next-cycle-hypothesis.md`. Alias accepted during transition:
`.session/next-cycle-analysis.md` (same content requirements).

The hypothesis MUST include:

1. **Facts carried forward** — verified claims from this session (with command/result pointers).
2. **Open gaps** — each tagged `fact` | `hypothesis` | `ops-only`.
3. **Candidate lanes** — 1–5 next-cycle work items with intent, suggested wave role
   (`diagnose` | `fix` | `validate` | `ship`), write-set hint, parallelizable yes/no.
4. **Explicit non-goals** — what the next cycle must not redo or must not claim.
5. **Uncertainty log** — researched-but-unresolved questions for session N+1.

Forbidden as the only next-action: a leftover sentence ("fix X") or an unstructured
shopping list. Ops-only items (push, deploy, bake) MUST be labeled `ops-only`.

The handoff's "Next recommended action" MUST point at launching `1840-auto-improve` with
this hypothesis artifact (not a leftover sentence alone).

If this session ran an improve cycle (`1840` or equivalent) and H1 is missing, write it
now. Do **not** call `1040` until H1 exists.

After the handoff, cross-handoff, and **H1** are complete, invoke `1040-session-bridge`
automatically to write `.ssot/next-session-prompt.md` and produce the copy-paste snippet
for the next session. This is mandatory — every session handoff prepares the next
session's auto-improve cycle so the user only needs to paste the snippet at the start
of the next session.
