---
description: Diagnose environment, dependencies, ACOS integrity, and drift
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Detect the operating system, shell, runtime manifests, lockfiles, required tools, repository-specific setup instructions, and configured infrastructure profile. Check versions, dependency consistency, Harbor/cache reachability, and MCP control-plane discovery using non-destructive commands. Run `npx --no-install acos --validate` and `npx --no-install acos --check`. Distinguish missing prerequisite, version mismatch, configuration drift, generated-file drift, infrastructure-profile absence, and external-service unavailability. Provide exact remediation commands but do not install or mutate external state without authority.

If `.ssot/agents/runtimes.json` exists, run `npx --no-install acos-runtime-sync --root .` to refresh the
runtime drift/health report. Surface `runtime-diverged` as a diagnostic blocker that prevents resume
unless the user explicitly supplies `--force` to `acos-runtime-sync`. Only execute the declared
`syncCommand` when the user explicitly requests it via `npx --no-install acos-runtime-sync --root . --sync`.

If the project declares a `gitWorktree` scope in `.ssot/agents/clients.json`, report the real Git root
with `git rev-parse --show-toplevel`, list worktrees with `git worktree list`, and compare the current
branch to the declared branch. Surface a branch mismatch and any uncommitted changes (dirty state) as
diagnostic items. A dirty worktree must be committed or stashed before the state is treated as safe
local drift.

If `.ssot/agents/clients.json` declares an ecosystem role (`container`, `satellite`, `worktree`, or
`standalone`), verify ecosystem consistency:
- A `container` must declare `ecosystemChildren` with path and role for each child.
- A `satellite` or `worktree` must declare an `ecosystemParent` pointing to a directory that contains a
  valid `.ssot/agents/clients.json`.
- Report a missing parent, missing children, or a child path that is not an ACOS project.
- Report inheritance conflicts: any file appearing in both `ecosystemParent.inherited` and
  `ecosystemParent.overridden` is a conflict.
- Report undeclared overridden files: if a file is overridden locally but is not listed in
  `ecosystemParent.overridden`, flag it as an undeclared override.
- Detect circular `ecosystemParent` hierarchies using a depth-bounded traversal (max depth 16). If a
  parent chain revisits a project, report the cycle as a diagnostic error.

Start with `npx --no-install acos-doctor --root .`. Its JSON report performs
only bounded local reads plus Git and ACOS validation/check commands; it does not execute discovered
project commands or probe external infrastructure. Use `maintenance.infrastructure` separately
when current remote service state is relevant.

Inspect `.ssot/agents/clients.json` top-level `adapters` and `.ssot/agents/runtimes.json` `syncCommand`,
`healthCheckCommand`, and `driftCheckCommand` for destructive shell patterns (`rm -rf`, `format`,
`del /f`, `dd`, `mkfs`, etc.). Warn when any declared command matches a known destructive pattern and
require explicit user confirmation before running it. ACOS never auto-executes runtime or adapter
commands from this entrypoint; the warning is purely defensive and covers FM-019.
