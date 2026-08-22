---
description: Prepare the next cycle for a project via MCPCO
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Prepare the next cycle for a project using the MCPCO `prepare_next_cycle` tool.

## MCPCO tool

`prepare_next_cycle(project: str, orientation_preamble: str | None = None) -> dict`

- `project` — the project name (resolved via project aliases).
- `orientation_preamble` — optional preamble text passed to the prompt builder for all agents.

The tool computes the next cycle number (latest + 1, or 1 if no cycles exist) and builds prompts for
all configured agents (1-4) via the prompt builder (`mcp_server.py:1058,1088-1095`). It is annotated
`MUTATING` (`readOnlyHint=False, destructiveHint=True`, `mcp_server.py:41,1057`).

## Authority

Seeing this skill means both gate conditions already hold: the project's `clients.json` declares an
`ecosystemParent` whose manifest includes this entrypoint's slug, and the corresponding profile file
(`.ssot/mco-profile.json`) exists.

### Interactive path (REQ-010)

Call the MCPCO MCP tool `prepare_next_cycle` directly. The client's own annotation-driven approval
UI is the gate — the `MUTATING` annotation triggers the client's native confirmation prompt. ACOS adds
no duplicate confirmation layer.

### Non-interactive path (REQ-010)

Go through the numbered binding `1360-mco-prepare-cycle` in `entrypoint-bindings.mjs`, which dispatches
`mco-adapter.mjs --operation invoke --capability prepare-next-cycle`. The adapter requires
`--authorized` (`adapter-contract.mjs:87`); without it, the capability refuses to run.

## Cycle-control request artifact (REQ-012)

If you are an in-cycle agent (role R3) writing a cycle-control request artifact to
`.mco/requests/<cycle>-<agent>-<n>.json`, you MUST `git add` the file so it survives the Eve patch
round-trip. Unstaged files do not survive `git diff HEAD --binary` (UNVERIFIED-3, settled by T-023).
