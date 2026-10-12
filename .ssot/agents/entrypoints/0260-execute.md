---
description: Execute the current approved plan with bounded autonomy
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Execute the smallest coherent unfinished plan slice for the active feature. This is the combined entrypoint that covers tasks generation and implementation in one step; use `0240-tasks` for task generation only or `0280-implement` for implementation only.

## Artifact path resolution

Resolve the feature directory in this order: explicit path from the user or parent →
project-declared active source → search `docs/specs/<feature-id>` then `specs/<feature-id>`.
Reuse existing artifacts; keep the default consumer spelling `specs/` when no
explicit/`docs/specs` hit is found. Signal only real ambiguity between active sources after
exploration. Shared projection generation remains coordinator/parent-owned — do not
regenerate projections from a parallel lane unless you are that owner.

1. Determine the feature ID from the user's request or the active spec; resolve its directory
   via artifact path resolution (default most recently modified under `specs/` when unresolved).
2. Read `<resolved>/tasks.md`; if it does not exist, derive tasks from `plan.md` and `spec.md`
   before executing. If `tasks.md` already exists, skip task derivation and proceed directly
   to implementation.
3. Execute with bounded autonomy: preserve unrelated changes, follow repository instructions, and keep specifications synchronized with deliberate behavior changes.
4. Validate incrementally. Mark completed tasks in `tasks.md` and update `convergence.md` only if convergence analysis is requested.
5. If `plan.md` declares a `Parallelization strategy` with a `waveType`, run `acos-wave-plan --root . --spec <feature-id> --wave-type <type>` to generate a wave-config, then dispatch using `acos-wave-dispatch` (CLI modes) or `acp-orchestrator` (ACP modes). Ownership-disjoint lanes may run in parallel within one repository; overlapping write-sets stay sequential.
6. Resolve safe implementation details autonomously; pause only for missing authority or a product decision that materially changes the result.
