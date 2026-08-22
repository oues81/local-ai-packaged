---
description: Promote a reusable project-specific skill to canonical ACOS through scan, generalization, approval, and write
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the skill-promotion objective. Minimize questions.

## Purpose

ACOS provides a **capability** to promote a project-specific skill into canonical ACOS.
Promotion is a per-project decision — ACOS does **not** hardcode which skills to promote
(REQ-029). No artifact in `templates/ssot/` may carry project-specific assumptions.

## Pipeline (REQ-027)

1. **Deterministic scan** — `node scripts/core/skill-promotion.mjs --root <project> --skill <path> --scan-only`
   Identifies the skill, cross-references to it, its dependencies, and projection targets.
   The scan is read-only and never writes.
2. **Agent analysis** — read the skill and produce a generalization plan: proposed category,
   prefix (if entrypoint), type (`entrypoint` vs `standalone-skill`), and adaptations that
   remove project-specific references while preserving the core procedure.
3. **Generalization checklist** — apply every item below before asking for approval.
4. **Human approval gate** — present the proposed canonical skill. Require explicit approval
   (`--approve` or an interactive yes). **No write without approval** (REQ-027c).
5. **Deterministic write** — after approval, place the skill in the canonical location,
   update `workflows.json` when promoting an entrypoint, and regenerate projections with
   `acos --fix`.

## Generalization checklist (REQ-028 / T-049)

Preserve:

- The core reusable procedure and decision gates that apply to any ACOS project.
- Stable ACOS concepts (SSOT, projections, entrypoints, protected paths) stated generically.

Remove or generalize:

- Specific infrastructure hostnames, LAN service names, and environment nicknames.
- Hardcoded absolute paths (`C:\...`, `/home/...`, `/Users/...`, `/mnt/...`).
- Domain-specific or project-named scripts and binaries.
- Named abstraction layers or product frameworks tied to one domain.
- Satellite/ecosystem project names embedded as assumed defaults.

Run the pattern scan to surface common issues:

`node scripts/core/skill-promotion.mjs --root <project> --skill <path> --scan-patterns`

The pattern scan is a helper, not exhaustive — **human review is the final gate**.

## CLI usage

```text
# Scan only (read-only report)
node scripts/core/skill-promotion.mjs --root <project> --skill <path> --scan-only

# Write after explicit approval (requires generalized content)
node scripts/core/skill-promotion.mjs --root <project> --skill <path> \
  --approve --write --content <generalized.md> \
  [--canonical-root <acos-or-fixture>] \
  [--name <skill-name>] [--type standalone-skill|entrypoint] \
  [--prefix <nnn>] [--id <stable.id>] [--category <category>]
```

Without `--approve`, `--write` MUST fail.

## Operator steps

1. Identify the source skill path under the project's `.ssot/skills/` (or equivalent).
2. Run the deterministic scan; share the report with the reviewing agent/human.
3. Produce generalized content; run the pattern scan; fix any findings.
4. Present the proposed skill for explicit human approval.
5. Only after approval, run the deterministic write and `acos --fix` on the canonical root.
6. Verify projections and that the promoted skill has no project-specific leftovers.

Never auto-promote. Never skip the approval gate.
