---
description: Execute the approved tasks with bounded autonomy
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Execute the approved tasks in `<resolved>/<feature-id>/tasks.md` with bounded autonomy, updating artifacts as decisions change.

## Artifact path resolution

Resolve the feature directory in this order: explicit path from the user or parent →
project-declared active source → search `docs/specs/<feature-id>` then `specs/<feature-id>`.
Reuse existing artifacts; keep the default consumer spelling `specs/` when no
explicit/`docs/specs` hit is found. Signal only real ambiguity between active sources after
exploration. Shared projection generation remains coordinator/parent-owned.

1. Determine the feature ID from the user's request or the active spec; resolve its directory
   via artifact path resolution (default most recently modified under `specs/` when unresolved).
2. Read `tasks.md`. If it does not exist, prompt the user to run `0240-tasks` first. If `plan.md` is also missing, prompt for `0140-plan`.
3. Execute the smallest coherent unfinished task slice. Preserve unrelated changes, follow repository instructions, and keep specifications synchronized with deliberate behavior changes. Ownership-disjoint tasks may proceed in parallel within one repository; overlapping write-sets stay sequential.
4. Validate incrementally. Mark completed tasks in `tasks.md` and update `convergence.md` only if convergence analysis is requested.
5. If `plan.md` declares a `Parallelization strategy` with a `waveType`, run `acos-wave-plan --root . --spec <feature-id> --wave-type <type>` to generate a wave-config, then dispatch using `acos-wave-dispatch` (CLI modes) or `acp-orchestrator` (ACP modes).
6. Resolve safe implementation details autonomously; pause only for missing authority or a product decision that materially changes the result.
7. After each task slice, run the smallest relevant static checks and tests. Report what was implemented, what was verified, and what remains.
