---
description: Review and refresh the seven-client Knowledge Pack currency, propose SSOT promotions without auto-applying projections
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the currency objective. Minimize questions.

## Purpose

Keep ACOS aware of **native client surface** changes (rules, skills, hooks, permissions,
config, models/quota) using the versioned Knowledge Pack — then **propose** SSOT updates.
This does **not** auto-rewrite `clients.json` or projections.

Distinct from:

- `1220-personalize` — adapts a **consumer project** SSOT to that project's codebase
- `1280-model-routing-audit` — which **model IDs** sit on frontier vs subagent roles

## Canonical locations

| Path | Role |
|------|------|
| `docs/client-knowledge/current/` | Active edition (stable path) |
| `docs/client-knowledge/current/MANIFEST.json` | `asOf`, file hashes |
| `docs/client-knowledge/editions/YYYY-MM-DD/` | Frozen prior editions |
| `docs/client-knowledge/PROMOTION-LOG.md` | Accept / defer / reject decisions |
| `docs/client-best-practices/<client>.md` | Short operational cache |

If the ACOS package is installed as a dependency, resolve the pack under the package's
`docs/client-knowledge/current/` (same relative layout).

## Cadence

- About every **30 days**, or immediately after a **major client release** / schema break.
- Do not burn quota on live native sessions unless the user explicitly authorizes them.

## Procedure

### 1. Baseline check

```bash
npm run knowledge:check
# or: node <acos>/scripts/audit/client-knowledge-check.mjs
```

Record `asOf`, file count, and any hash failures. Stop and repair the pack if the check fails.

### 2. Vendor delta (research)

For each of the seven clients, scan official changelogs/docs since `asOf` (web). Summarize
only material surface changes. Do **not** invent filesystem paths or ACOS coverage.

### 3. Pack update (optional this session)

If the pack needs a new edition:

1. Copy `current/` → `editions/<asOf>/` (or today's date if replacing mid-cycle).
2. Update `current/` notes, `capabilities.json`, SYNTHESIS, changelogs.
3. Regenerate `MANIFEST.json` hashes; re-run `knowledge:check`.

### 4. Cache refresh

Update `docs/client-best-practices/<client>.md` from the pack (short memo + P0). Keep
frontmatter `lastResearched` current. Do not dump the whole pack into the cache.

### 5. Promotion proposals (human gate)

From `*/15-acos-projection-gaps.md` and SYNTHESIS P0/P1, list candidates:

| Client | Capability | Proposed SSOT change | Priority | Decision |
|--------|------------|----------------------|----------|----------|

Present **one** plan for approval. Append outcomes to `PROMOTION-LOG.md`.
**Never** apply SSOT mutations in this entrypoint without explicit user approval.
Approved changes edit canonical sources under `.ssot/agents/` (or `templates/ssot/.ssot/`
in the ACOS product repo), then `acos --fix` / `--check`.

### 6. Handoff

Record: pack `asOf`, whether an edition was bumped, cache files touched, promotions
accepted/deferred, checks run.

## Authority boundary

- No automatic promotion from pack → SSOT or projections.
- No live multi-client verification batch without explicit approval (quota).
- Preserve unrelated dirty worktree changes.
