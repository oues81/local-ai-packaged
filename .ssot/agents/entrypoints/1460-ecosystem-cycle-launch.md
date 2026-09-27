---
description: Resolve and fan-out per-project ACOS cycles (0020→1840→1020) from a container across selected targets
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

# 1460 — ecosystem-cycle-launch

Launch (or dry-run) the **canonical per-project cycle** across one or more
satellites/worktrees selected from an **ecosystem container**.

## Invariants

- Working **inside** a single project: keep using `0020 → 1840 → 1020` unchanged.
- This entrypoint is **selector + fan-out only**. It does not merge repos and does
  not replace `1080-cross-handoff` (report-only).
- ACOS is project-agnostic: department names (if any) live in consumer
  `ecosystemTargets` data, not in core logic.

## Preconditions

- Current workspace (or `--root`) is an ACOS **container** (`ecosystemRole: container`)
  with `ecosystemChildren`.
- Optional: `ecosystemTargets` on `clients.json` or `.ssot/ecosystem-targets.json`.

## Procedure

1. Confirm container root.
2. Dry-run resolve:

```text
npx --no-install acos-ecosystem --list-targets <containerRoot>
npx --no-install acos-ecosystem --launch --root <containerRoot> \
  --targets <id[,id…]> \
  [--projects <id[,id…]>] \
  [--objective "<text>"] \
  --mode dry-run \
  [--output .session/ecosystem-launch-plan.md]
```

3. Present the plan to the human (selected roots, unresolved members, copy-paste blocks).
4. **Phase A stop**: do not mutate children. After approval, Phase B+ fans out one
   `0020 → 1840 → 1020` session **per resolved root** (same cycle semantics).
5. Aggregate results at the container (status/handoff + links to child handoffs).
   Do not claim child completion without evidence from that child's root.

## Modes

| Mode | Phase | Behavior |
|------|-------|----------|
| `dry-run` | A (default) | Resolve + plan only |
| `agent` | B | Write prompts / dispatch agents per root |
| `mco` | C | Batch MCPCO prepare/trigger when gated |

## Forbidden

- Changing `0020` / `1840` / `1020` / `1040` behavior for single-project use
- Blind Refresh / destructive git from the container on behalf of children
- Treating two folders as one ACOS project
