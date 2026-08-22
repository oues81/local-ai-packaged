# Reference: User Interview Questions

<overview>
This reference provides templates for asking business decisions during migration. Adapt each question to the project context.
</overview>

## Q1 — Ecosystem role

**Question:**
> Should this project start as `standalone` or `satellite`?
> - `standalone` — no parent dependency.
> - `satellite` — inherits from an already ACOS-migrated parent.
>
> **Default:** `standalone`.

**When to ask:** Always.

**Record:**
- `ecosystemRole`: `standalone` or `satellite`
- `ecosystemParent.path`: relative path if satellite

---

## Q2 — Workflow canonization

**Question:**
> The project has `<N>` workflow files. Which ones should become canonical ACOS entrypoints?
> List candidates:
> - `<file-1>`: `<description>`
> - `<file-2>`: `<description>`
> - ...
>
> For each chosen workflow:
> 1. What numeric prefix should it have? (e.g., `480`, `500`, `520`)
> 2. What category does it belong to? (`onboarding`, `delivery`, `maintenance`, `session`)
> 3. Should the other workflows be archived or deleted?

**When to ask:** When there are workflow files.

**Record:**
- Canonical entrypoints table.
- Archived workflows list.

---

## Q3 — Agent mappings

**Question:**
> For each legacy agent, choose the action:
> - `<agent-1>` → keep name / map to canonical name / archive
> - `<agent-2>` → keep name / map to canonical name / archive
> - ...
>
> For agents that collide with ACOS templates (`reviewer.md`, `test-engineer.md`, `fabric-debugger.md`):
> - Merge legacy content into ACOS template?
> - Use ACOS template as-is and archive legacy?
> - Use legacy file as-is and override ACOS template?

**When to ask:** When there are agent files.

**Record:**
- Agent mapping table.
- Merge decisions for colliding agents.

---

## Q4 — Rule consolidation

**Question:**
> The project has rules in `<locations>`. How should they be consolidated?
> - Merge all into `.ssot/agents/rules/common.md`.
> - Keep separate files per concern.
> - Archive obsolete rules.
>
> Which rules are always-on and must be preserved?

**When to ask:** When there are rule files.

**Record:**
- Rule consolidation strategy.
- Always-on rules list.

---

## Q5 — ACP registry

**Question:**
> The project has an `.acp/registry.json` with `<N>` agents. Which agents should be kept?
> For each kept agent:
> - Where is the script located?
> - Should the path be updated to `.ssot/agents/scripts/`?
>
> For agents whose scripts do not exist:
> - Remove them from the registry?
> - Create stub scripts?
> - Leave them and ask later?

**When to ask:** When `.acp/registry.json` exists.

**Record:**
- Kept agents and paths.
- Removed agents.
- Created stubs (if any).

---

## Q6 — Hooks strategy

**Question:**
> The project has native hooks in `<locations>`.
> - Should ACOS manage hooks automatically? (only if no native hooks)
> - Or should native hooks be manually merged with ACOS lifecycle hooks and protected?
> - Which native hooks must be preserved?

**When to ask:** When there are hook files.

**Record:**
- Hook strategy: `auto` or `manual merge`.
- Preserved hooks list.

---

## Q7 — Context files

**Question:**
> The project has `<context files>` (e.g., `claude.md`, `INDEX.md`).
> - Should useful content be migrated to `.ssot/agents/context/AGENTS.src.md` and `.ssot/context-index.md`?
> - Should the legacy root files be deleted after migration?
> - Is there any content that must be preserved verbatim?

**When to ask:** When root context files exist.

**Record:**
- Context migration decisions.
- Files to delete.

---

## Q8 — Non-ACOS infrastructure

**Question:**
> The project has non-ACOS infrastructure: `<list>`.
> - Which files/directories must be preserved as-is?
> - Which can be archived?
> - Are any of these managed by an external tool that should not be touched by ACOS?

**When to ask:** When non-ACOS infrastructure exists (e.g., `.codex/`, `.acp/`, custom scripts).

**Record:**
- Protected paths list.
- Archive list.

---

## Q9 — Cleanup scope

**Question:**
> After validation passes, may I delete:
> - `.ssot.legacy/` (the temporary renamed legacy directory)
> - `ACOS_MIGRATION_PLAN.json`
> - `ACOS_PRE_INIT_AUDIT.md`
> - `ACOS_ADOPTION_REPORT.md`
> - `.cursor/hooks.json.legacy` (the backup)
>
> **Default:** yes, after validation.

**When to ask:** At Decision Gate 3.

**Record:**
- Cleanup approval.

---

## Q10 — Commit strategy

**Question:**
> After the migration is validated, do you want me to:
> - Commit and push?
> - Commit only and let you push?
> - Show you the diff and wait?

**When to ask:** At Decision Gate 4.

**Record:**
- Commit and push preferences.
