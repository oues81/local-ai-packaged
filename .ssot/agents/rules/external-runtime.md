# External runtime rule

Git is the single source of truth for any declared external runtime in `.ssot/agents/runtimes.json`. The runtime is derived from the repository; agents MUST NOT edit the runtime without a prior committed git change.

- Before mutating a runtime, verify the current drift status with `npx --no-install acos-runtime-sync --root .`.
- If the status is `runtime-diverged`, stop and ask the user to reconcile git and the runtime before continuing.
- Only execute the declared `syncCommand` when the user explicitly requests it via `npx --no-install acos-runtime-sync --root . --sync`.
- Never run runtime drift, health, or sync commands automatically from `0020-resume` or any other entrypoint.
