# Reference: Common Migration Patterns

<overview>
This reference describes common migration patterns and when to apply them. Use it during analysis and when generating the project-specific playbook.
</overview>

## Pattern A — Standalone project

**When to use:** The project has no parent ecosystem or the parent is not ACOS yet.

**Steps:**
1. Set `ecosystemRole: standalone` in `.ssot/agents/clients.json`.
2. Migrate all project-specific rules, agents, workflows into `.ssot/agents/`.
3. Keep non-ACOS infrastructure as protected paths.

## Pattern B — Satellite project

**When to use:** The project is part of a monorepo or ecosystem where the parent is already ACOS.

**Steps:**
1. Start with `standalone` until the parent is ACOS.
2. After parent migration, switch to `satellite` with `ecosystemParent.path: ".."` (or appropriate path).
3. Inherit shared rules/agents from parent; keep only project-specific overrides.

## Pattern C — Workflow consolidation

**When to use:** Multiple workflow files describe the same pipeline.

**Resolution framework:**
1. Score each candidate by recency, completeness, and deprecation status.
2. Select one canonical file.
3. Map it to an ACOS entrypoint with a numeric prefix and allowed category.
4. Archive the rejected files.
5. Record the decision.

## Pattern D — Agent collision

**When to use:** A legacy file and an ACOS template share the same name (e.g., `reviewer.md`).

**Options:**
1. **Merge** (recommended): combine legacy content into the ACOS template, keeping the ACOS frontmatter.
2. **Override**: use the legacy file as-is, discarding the ACOS template.
3. **Archive**: discard the legacy file and use the ACOS template.

**Never** create parallel files like `reviewer-legacy.md`.

## Pattern E — Rule consolidation

**When to use:** The same rule appears in multiple editor-specific directories.

**Options:**
1. Merge all rules into `.ssot/agents/rules/common.md`.
2. Keep separate files per concern (e.g., `powershell.md`, `security.md`).
3. Delete editor-specific duplicates after migration.

## Pattern F — Hook merge

**When to use:** The project has native hooks (e.g., Cursor PowerShell hooks) that must coexist with ACOS lifecycle hooks.

**Steps:**
1. Backup the native hooks file.
2. Generate the ACOS lifecycle hooks.
3. Manually merge the native hooks into the ACOS hooks file.
4. Remove the client from `.ssot/agents/hooks.json` so ACOS does not overwrite.
5. Mark the native hooks file as protected with `managed: false`.

## Pattern G — ACP registry correction

**When to use:** The project has an `.acp/registry.json` with missing or invalid agents.

**Steps:**
1. Move the Python ACP script to `.ssot/agents/scripts/`.
2. Update registry paths to point to `.ssot/agents/scripts/`.
3. Remove agents whose scripts do not exist, unless the user wants stubs.
4. Validate JSON syntax.

## Pattern H — Non-ACOS preservation

**When to use:** The project has tooling that ACOS does not manage (OpenCode missions, custom scripts, ACP registry, etc.).

**Steps:**
1. Preserve the files as-is.
2. Add them to `.ssot/protected-paths.json` with `managed: false`.
3. Document them in `.ssot/decisions.md`.

## Pattern I — Context migration

**When to use:** The project has `claude.md`, `INDEX.md`, or `AGENTS.md` with useful documentation.

**Steps:**
1. Extract project-specific context.
2. Add it to `.ssot/agents/context/AGENTS.src.md`.
3. Add Claude-specific pointers to `.ssot/agents/context/CLAUDE.src.md`.
4. Add project navigation to `.ssot/context-index.md`.
5. Delete the legacy root files.

## Pattern J — Fabric rules inheritance

**When to use:** The project is a Microsoft Fabric satellite.

**Steps:**
1. Copy `fabric-git-ssot.md` from the parent or ecosystem into `.ssot/agents/rules/`.
2. Copy the Fabric auth rule (e.g., `fabric-auth.md` or `fabric-auth-patterns.md`) into `.ssot/agents/rules/`.
3. Do not duplicate MSAL/OAuth logic; delegate to the shared module.
