---
description: Audit and refresh frontier vs subagent model routing (Anthropic + OpenAI + Cursor) against the canonical matrix
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the model-routing objective. Minimize questions.

## Purpose

Keep **frontier (parent)** and **subagent (execute / verify)** model choices aligned with
`docs/model-selection.md` — quality without burning quota on the wrong tier.

This is **not** the client-surface completeness audit (spec 018 / personalize). That work
updates hooks, permissions, and native files. This entrypoint updates **which model IDs**
belong on which role.

## Canonical combos (as of 2026-10-16)

| Stack | Frontier | Verify / review | Execute / volume |
|-------|----------|-----------------|------------------|
| Anthropic | `claude-opus-5-5` | `claude-sonnet-5-5` (≥ floor) | `claude-haiku-5-5` |
| OpenAI | `gpt-6.1-sol` | Sol (or Luna with care) | `gpt-6-luna` |
| Cursor | Auto / Opus (chat) | ACOS agents `composer-2.5-fast` | Explore `disabled` in `cli-config.json` |

**Banned for new work:** Sonnet 4.6 (dominated by 5.5), Haiku 4.5 (prefer 5.5), Haiku on
planner/reviewer/verifier.

## Procedure

### 1. Deterministic audit

Resolve ACOS root from `clients.json` → `acosSource` (local-checkout or `node_modules/@acos/core`).

```bash
node <acos>/scripts/audit/model-routing-audit.mjs --root <project-root> --json
```

Record hard violations vs warnings. From SSOT **1.9.5**, the audit also checks
`.ssot/agents/clients.json` → `frontierRouting` (consultant / prep / verifyFloor /
forbid / budget). Missing block = warning; invalid verifyFloor or banned models =
hard violation.

### 2. Refresh pricing / IDs (agent)

If the user asked for a refresh, or the audit reports a stale matrix:

1. Fetch current Anthropic + OpenAI pricing / model overview pages.
2. Propose a short diff to `docs/model-selection.md` (and the copy under
   `docs/agent-waves/model-selection.md` if present).
3. **Stop for approval** before editing the canonical doc.

### 3. Apply client overrides (after approval)

Update `.ssot/agents/clients.json` only when the user approved concrete overrides:

- Cursor: `agentModelOverrides` planner/reviewer/verifier → `composer-2.5-fast`
- Claude: keep ACOS agents ≥ `claude-sonnet-5-5`; document Haiku 5.5 for mechanical CLI waves
- Codex: prefer `gpt-6-luna` for volume agents

Then:

```bash
npx --no-install acos --fix
npx --no-install acos --check
node <acos>/scripts/audit/model-routing-audit.mjs --root <project-root>
```

### 4. Cursor machine controls (operator / global)

If Cursor is in scope, verify (do not invent settings keys):

- `~/.cursor/cli-config.json` → `subagentModels.explore: "disabled"`
- `~/.cursor/hooks.json` → `subagentStart` cost guard
- See `docs/agent-waves/13-CURSOR-COST-CONTROLS.md`

### 5. Persist

Update `.ssot/status.md` / `.ssot/handoff.md` with the matrix date and any override changes.
Log durable decisions in `.ssot/decisions.md` when changing default routing policy.

## Authority

- Do **not** lower verifier/reviewer below Sonnet 5.5.
- Do **not** commit credentials or paste API keys from dashboards.
- Multi-project engine refresh: prefer `node <acos>/scripts/lifecycle/acos-rollout.mjs`.
