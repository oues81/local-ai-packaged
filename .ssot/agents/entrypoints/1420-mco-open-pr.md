---
description: Open a pull request for a project's cycle via MCPCO
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Open a pull request for a project's cycle using the MCPCO `open_cycle_pr` tool.

## MCPCO tool

`open_cycle_pr(project: str, cycle: int | None = None) -> dict`

- `project` — the project name (resolved via project aliases).
- `cycle` — optional cycle number; if omitted, the latest cycle is used (`mcp_server.py:1378,1246-1253`).

The tool requires the cycle to be `complete`, invokes integration if needed, pushes an integration
branch, and opens a PR via `gh` (`mcp_server.py:1346-1353`). It persists `pr_number` and `pr_url`
against the cycle row (`mcp_server.py:1342-1344`). It is annotated
`readOnlyHint=False, destructiveHint=False` (`mcp_server.py:44,1377`) — non-destructive but
side-effecting (it pushes a branch and opens a PR), so it must not be dispatched without authority.

## Authority

Seeing this skill means both gate conditions already hold: the project's `clients.json` declares an
`ecosystemParent` whose manifest includes this entrypoint's slug, and the corresponding profile file
(`.ssot/mco-profile.json`) exists.

### Interactive path (REQ-010)

Call the MCPCO MCP tool `open_cycle_pr` directly. The client's own annotation-driven approval
UI is the gate — the `readOnlyHint=False` annotation triggers the client's native confirmation prompt.
ACOS adds no duplicate confirmation layer.

### Non-interactive path (REQ-010)

Go through the numbered binding `1420-mco-open-pr` in `entrypoint-bindings.mjs`, which dispatches
`mco-adapter.mjs --operation invoke --capability open-cycle-pr`. The adapter requires
`--authorized` (`adapter-contract.mjs:87`); without it, the capability refuses to run.

## Cycle-control request artifact (REQ-012)

If you are an in-cycle agent (role R3) writing a cycle-control request artifact to
`.mco/requests/<cycle>-<agent>-<n>.json`, you MUST `git add` the file so it survives the Eve patch
round-trip. Unstaged files do not survive `git diff HEAD --binary` (UNVERIFIED-3, settled by T-023).
