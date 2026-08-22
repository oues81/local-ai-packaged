---
description: Mark a project's latest cycle as abandoned via MCPCO
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Mark a project's latest cycle as abandoned using the MCPCO `mark_cycle_abandoned` tool.

## MCPCO tool

`mark_cycle_abandoned(project: str) -> dict`

- `project` — the project name (resolved via project aliases).

The tool sets the latest cycle's `status` to `"abandoned"` and creates a `StuckAgent` record
(`mcp_server.py:925,957-968`). It is annotated `MUTATING` (`readOnlyHint=False, destructiveHint=True`,
`mcp_server.py:39,924`).

## Authority

Seeing this skill means both gate conditions already hold: the project's `clients.json` declares an
`ecosystemParent` whose manifest includes this entrypoint's slug, and the corresponding profile file
(`.ssot/mco-profile.json`) exists.

### Interactive path (REQ-010)

Call the MCPCO MCP tool `mark_cycle_abandoned` directly. The client's own annotation-driven approval
UI is the gate — the `MUTATING` annotation triggers the client's native confirmation prompt. ACOS adds
no duplicate confirmation layer.

### Non-interactive path (REQ-010)

Go through the numbered binding `1320-mco-abandon-cycle` in `entrypoint-bindings.mjs`, which dispatches
`mco-adapter.mjs --operation invoke --capability mark-cycle-abandoned`. The adapter requires
`--authorized` (`adapter-contract.mjs:87`); without it, the capability refuses to run.

## Cycle-control request artifact (REQ-012)

If you are an in-cycle agent (role R3) writing a cycle-control request artifact to
`.mco/requests/<cycle>-<agent>-<n>.json`, you MUST `git add` the file so it survives the Eve patch
round-trip. Unstaged files do not survive `git diff HEAD --binary` (UNVERIFIED-3, settled by T-023).
