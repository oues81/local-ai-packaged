---
description: Execute the current approved plan with bounded autonomy
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Execute the smallest coherent unfinished plan slice for the active feature. This is the combined entrypoint that covers tasks generation and implementation in one step; use `0240-tasks` for task generation only or `0280-implement` for implementation only.

1. Determine the feature ID from the user's request or the active spec; default to the most recently modified spec under `specs/`.
2. Read `specs/<feature-id>/tasks.md`; if it does not exist, derive tasks from `plan.md` and `spec.md` before executing. If `tasks.md` already exists, skip task derivation and proceed directly to implementation.
3. Execute with bounded autonomy: preserve unrelated changes, follow repository instructions, and keep specifications synchronized with deliberate behavior changes.
4. Validate incrementally. Mark completed tasks in `tasks.md` and update `convergence.md` only if convergence analysis is requested.
5. If `plan.md` declares a `Parallelization strategy` with a `waveType`, run `acos-wave-plan --root . --spec <feature-id> --wave-type <type>` to generate a wave-config, then dispatch using `acos-wave-dispatch` (CLI modes) or `acp-orchestrator` (ACP modes).
6. Resolve safe implementation details autonomously; pause only for missing authority or a product decision that materially changes the result.
