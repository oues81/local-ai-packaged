---
description: Force cycle analysis for a project via MCPCO
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Force cycle analysis for a project's latest cycle using the MCPCO `force_cycle_analysis` tool.

## MCPCO tool

`force_cycle_analysis(project: str) -> dict`

- `project` — the project name (resolved via project aliases).

The tool re-analyzes report files for the project's latest cycle via the cycle analyzer
(`mcp_server.py:1111,1146-1154`). It is annotated `MUTATING` (`readOnlyHint=False, destructiveHint=True`,
`mcp_server.py:42,1110`).

## Authority

Seeing this skill means both gate conditions already hold: the project's `clients.json` declares an
`ecosystemParent` whose manifest includes this entrypoint's slug, and the corresponding profile file
(`.ssot/mco-profile.json`) exists.

### Interactive path (REQ-010)

Call the MCPCO MCP tool `force_cycle_analysis` directly. The client's own annotation-driven approval
UI is the gate — the `MUTATING` annotation triggers the client's native confirmation prompt. ACOS adds
no duplicate confirmation layer.

### Non-interactive path (REQ-010)

Go through the numbered binding `1400-mco-force-analysis` in `entrypoint-bindings.mjs`, which dispatches
`mco-adapter.mjs --operation invoke --capability force-cycle-analysis`. The adapter requires
`--authorized` (`adapter-contract.mjs:87`); without it, the capability refuses to run.

## Cycle-control request artifact (REQ-012)

If you are an in-cycle agent (role R3) writing a cycle-control request artifact to
`.mco/requests/<cycle>-<agent>-<n>.json`, you MUST `git add` the file so it survives the Eve patch
round-trip. Unstaged files do not survive `git diff HEAD --binary` (UNVERIFIED-3, settled by T-023).
