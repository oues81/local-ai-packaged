# local-ai-packaged — Agent Instructions

This project uses ACOS. Read `.ssot/context-index.md`, `.ssot/constitution.md`, `.ssot/architecture.md`, `.ssot/decisions.md`, `.ssot/status.md`, `.ssot/handoff.md`, and `.ssot/infrastructure.md` as relevant to the task.

## Quick orientation

When any entrypoint is activated, orient yourself:
1. `.ssot/context-index.md` — project identity and active specs
2. `.ssot/status.md` — current objective and milestone
3. `.ssot/handoff.md` — next recommended action
4. If `clients.json` declares `ecosystemParent`, read the parent context

Full reference: `.ssot/agents/context/orientation.md`

## Operating contract

- Treat the user's task, specification, or question as the objective; do not require process instructions already encoded in ACOS.
- Use stable workflow IDs for internal references. Numeric prefixes are only visible invocation order.
- Maintain operational uniformity across projects: the same kind of operation uses the same
  prefix, and custom entrypoints not covered by a core category must be classified as `project`
  (1500+) or, for multi-project ecosystems, `ecosystem` (13xx–14xx). See `000-numbering-conventions/spec.md`.
- Edit canonical harness sources under `.ssot/`, then run `npx --no-install acos --fix` and `npx --no-install acos --check`.
- Never edit a file carrying the ACOS generated banner.
- Respect `.ssot/protected-paths.json`; its default mode is advisory unless a native enforcement adapter is active.
- Preserve unrelated user changes and verify work proportionally to risk.
- Update `.ssot/status.md` and `.ssot/handoff.md` after meaningful progress.
- Reuse the existing Harbor, cache, and MCP control plane through its configured adapter; never recreate or silently bypass it.
- Prefer mechanical native-client checks over live sessions; warn the user and obtain explicit approval before running multiple live `0020-resume` sessions in a single batch.

## Primary entrypoints

- New project: `project.new` / `0000-new`
- Existing project: `project.resume` / `0020-resume`
- General request: `project.route` / `0040-route`
- Constitution: `project.constitution` / `0060-constitution`

## Maintenance & operations

- Git layout audit: `git.layout` / `0500-git-layout`
- Git add/commit/push: `git.acp` / `0540-git-acp`
- Pull requests: `git.pr` / `0580-git-pr`
- Git cleanup: `git.cleanup` / `0620-git-cleanup`
- Doctor: `maintenance.doctor` / `0640-doctor`
- Sync projections: `maintenance.sync` / `0660-sync`
- Infrastructure: `maintenance.infrastructure` / `0680-infra`
- GSD adapter: `maintenance.gsd` / `0720-gsd`
- Runtime sync: `maintenance.runtimesync` / `0760-runtime-sync`
- ACP adapter: `maintenance.acp` / `0800-acp`
- MCPCO cycle-control: `ecosystem.mco.*` / `1300`-`1440` — projects declaring `ecosystemParent: ecosystem-parents/mco` AND shipping `.ssot/mco-profile.json` receive 8 MCPCO entrypoints and the MCPCO MCP server entry.

## Native spec engine

ACOS provides a dependency-free spec engine. Use it to produce structured artifacts under `specs/<feature-id>/`:

- Constitution: `project.constitution` / `0060-constitution` (prerequisite for spec)
- Spec: `delivery.spec` / `0100-spec`
- Plan: `delivery.plan` / `0140-plan`
- Data model: `delivery.datamodel` / `0180-data-model`
- Checklist: `delivery.checklist` / `0220-checklist`
- Execute: `delivery.execute` / `0260-execute`
- Verify: `delivery.verify` / `0300-verify`
- Analyze: `delivery.analyze` / `0400-analyze`
- Converge: `delivery.converge` / `0420-converge`
- Ship: `delivery.ship` / `0440-ship`

Canonical templates live in `.ssot/agents/specs/` and the lifecycle definition is `.ssot/agents/spec-engine.json`. For everyday use, `0040-route` routes through the lifecycle automatically.
