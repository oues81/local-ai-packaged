# ACOS Project Rules

1. Canonical harness sources live under `.ssot/`; files carrying the ACOS generated banner are projections and are never edited directly.
2. Stable workflow IDs are used in dependencies and documentation. Numeric prefixes control visible ordering only.
3. Preserve unrelated user changes and do not perform destructive or externally visible actions without authority.
4. Read `.ssot/status.md` and `.ssot/handoff.md` when resuming work; update them after meaningful progress.
5. Run `npx --no-install acos --fix`, `npx --no-install acos --check`, and relevant project verification after changing canonical harness sources. Prefer `maintenance.sync` / `0660-sync` for projection regeneration and `maintenance.doctor` / `0640-doctor` when drift is suspected.
6. Treat `.ssot/protected-paths.json` as advisory unless the active client adapter explicitly reports native enforcement.
7. Maintain `.ssot/context-index.md` as a compact, canonical map of active specifications, architecture, and key project context. Link to sources rather than duplicating them.

## Canonical lifecycle hooks

These hooks are semantic requirements. A client with a safe native hook surface may enforce them automatically; every other adapter projects them into its mandatory rules and explicit entrypoints.

- On entrypoint activation: orient from `.ssot/context-index.md`, `.ssot/status.md`, and `.ssot/handoff.md` before executing the entrypoint body. Sub-agents re-orient independently — they do not inherit the calling agent's context.
- Before mutation: inspect Git state, protected paths, applicable specifications, and the authority boundary.
- After mutation: run the smallest relevant static checks and tests, then inspect generated-file drift.
- Before completion: run `npx --no-install acos --check` when the harness is present, report checks not run, and persist `.ssot/status.md` plus `.ssot/handoff.md` after meaningful progress.
- On session resume: read durable status and handoff before selecting the next action.
- On infrastructure use: discover the configured external profile first; never deploy a substitute because discovery failed.
- On native client verification: prefer mechanical checks over live sessions; warn the user and obtain explicit approval before launching more than one live `0020-resume` session in a batch; record the date, client, and version in the native verification checklist after any live session.
