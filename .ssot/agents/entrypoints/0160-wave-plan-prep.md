---
description: Strategic analysis and wave decomposition prep (frontier model optional, opt-in)
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Produce a strategic analysis that feeds the wave-plan phase. The current agent performs
the analysis in-session by default (per `0200-frontier-consult` self-mode semantics); a
frontier model is invoked only if the user explicitly requests one via `--cli`/`--frontier`.

## Artifact path resolution

Resolve the feature directory in this order:

1. Explicit path supplied by the user or parent caller.
2. Active source declared by the project (context-index / specifications).
3. Search `docs/specs/<feature-id>` then `specs/<feature-id>`.

Reuse existing artifacts at the resolved path. Do not duplicate or re-derive tasks when
an active package already exists. The default consumer spelling remains `specs/` when no
explicit/`docs/specs` hit is found. Signal only a real ambiguity between two active sources
after exploration.

1. Determine the feature ID from the user's request, the parent caller, or the active spec.
2. Read `<resolved>/<feature-id>/spec.md`, `plan.md`, and `data-model.md` if present
   (paths via artifact path resolution above).
3. Analyze the plan for parallelization opportunities: identify independent task groups,
   shared dependencies, and the critical path. Ownership-disjoint write-sets in a **single
   repository** may be parallel; overlapping files, shared generation, or true dependencies
   stay sequential. Shared projection generation is reserved for the coordinator / parent.
4. Produce `<resolved>/<feature-id>/wave-prep.md` with:
   - Candidate wave decomposition (which tasks can run in parallel)
   - Dependency graph between waves
   - Risk notes for each wave (shared-file conflicts, ordering constraints)
   - Recommended wave type (fix, feature, refactor) and dispatch mode
5. This is **read-only during planning** — do not mutate `plan.md` or `tasks.md` (those are
   owned by `delivery.plan` and `delivery.tasks`).
   - **Parent-invoked** (e.g. called from `1840-auto-improve` before its single G1): return
     `wave-prep.md` to the parent and **stop**. Do **not** pause for a second user gate;
     the parent owns the one Approve/Amend on the complete plan.
   - **Standalone** (user invoked `0160` directly with no parent cycle): pause for user
     approval before the wave-plan phase consumes `wave-prep.md`.
6. If no parallelization is possible, state that explicitly and recommend a single-wave
   sequential execution.
