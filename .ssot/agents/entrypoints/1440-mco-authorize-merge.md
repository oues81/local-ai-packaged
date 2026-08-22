---
description: Authorize merging a cycle's PR with two-factor confirmation via MCPCO
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Authorize merging a cycle's open PR using the MCPCO `authorize_cycle_merge` tool.

## MCPCO tool

`authorize_cycle_merge(project: str, cycle: int, confirm_pr_number: int) -> dict`

- `project` — the project name (resolved via project aliases).
- `cycle` — the cycle number whose PR is to be merged.
- `confirm_pr_number` — the PR number to confirm; must match the `pr_number` persisted by
  `open_cycle_pr` (`mcp_server.py:1586,1489-1498`).

The tool requires **two-factor authorization**:

1. **Factor (a) — credential**: the `MCP_API_KEY` environment variable must be set
   (`mcp_server.py:1436-1444`). If missing, the tool returns `missing_credential` and refuses.
2. **Factor (b) — PR number confirmation**: `confirm_pr_number` must match the `pr_number` stored on
   the cycle row by `open_cycle_pr` (`mcp_server.py:1489-1498`). A mismatch returns
   `pr_number_mismatch`.

On success, the tool merges the PR via `gh pr merge`, records `merged_at`, and removes agent and
integration worktrees (`mcp_server.py:1500-1525,1540-1567`). It is annotated `MUTATING`
(`readOnlyHint=False, destructiveHint=True`, `mcp_server.py:45,1585`).

## Authority

Seeing this skill means both gate conditions already hold: the project's `clients.json` declares an
`ecosystemParent` whose manifest includes this entrypoint's slug, and the corresponding profile file
(`.ssot/mco-profile.json`) exists.

### Interactive path (REQ-010)

Call the MCPCO MCP tool `authorize_cycle_merge` directly. The client's own annotation-driven approval
UI is the gate — the `MUTATING` annotation triggers the client's native confirmation prompt. ACOS adds
no duplicate confirmation layer. The two-factor requirement (MCP_API_KEY + confirm_pr_number) is
enforced by the tool itself, not by ACOS.

### Non-interactive path (REQ-010)

Go through the numbered binding `1440-mco-authorize-merge` in `entrypoint-bindings.mjs`, which dispatches
`mco-adapter.mjs --operation invoke --capability authorize-cycle-merge`. The adapter requires
`--authorized` (`adapter-contract.mjs:87`); without it, the capability refuses to run. The two-factor
requirement (MCP_API_KEY + confirm_pr_number) is enforced by the tool itself, not by the adapter.

## Cycle-control request artifact (REQ-012)

If you are an in-cycle agent (role R3) writing a cycle-control request artifact to
`.mco/requests/<cycle>-<agent>-<n>.json`, you MUST `git add` the file so it survives the Eve patch
round-trip. Unstaged files do not survive `git diff HEAD --binary` (UNVERIFIED-3, settled by T-023).
