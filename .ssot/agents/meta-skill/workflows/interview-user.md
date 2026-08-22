# Workflow: Interview the User for Migration Decisions

<required_reading>
**Read these reference files before executing:**
1. `references/interview-questions.md` — question templates by file type.
2. `references/migration-patterns.md` — common patterns and their trade-offs.
3. `references/acos-conventions.md` — constraints that bound the decisions.
</required_reading>

<process>
## Step 1 — Load the analysis

1. Read `ACOS_MIGRATION_ANALYSIS.md` produced by `workflows/analyze-project.md`.

2. Identify all items marked as `decision_needed`.

## Step 2 — Ask decisions in order

3. Ask the questions below one at a time or in small batches. Record every answer in a decisions file. Stop and ask for clarification if the user is uncertain.

### Decision A — Ecosystem role

> **Question:** Should this project start as `standalone` or `satellite`?
> - `standalone` (recommended) — no parent dependency.
> - `satellite` — only if the parent project is already ACOS-migrated and this project should inherit from it.
> 
> **Default:** `standalone`.

### Decision B — Workflows / entrypoints

> **Question:** The project has `<N>` workflow files. Which ones should become canonical ACOS entrypoints?
> List candidates and ask the user to select:
> - Keep all as separate entrypoints.
> - Consolidate to a smaller set.
> - Archive the rest.
> 
> For each chosen workflow, ask what numeric prefix it should have (e.g., `480`, `500`, `520`) and what `category` it belongs to (`onboarding`, `delivery`, `maintenance`, `session`).

### Decision C — Agents

> **Question:** For each legacy agent file, do you want to:
> - Keep the legacy name as-is in `.ssot/agents/agents/`.
> - Map it to a canonical ACOS role name (e.g., `reviewer.md`, `test-engineer.md`, `planner.md`).
> - Archive it.
> 
> For agents that collide with ACOS templates (`reviewer.md`, `test-engineer.md`, `fabric-debugger.md`, ask:
> - Should I merge the legacy content into the ACOS template?
> - Or use the ACOS template as-is and archive the legacy file?

### Decision D — Rules

> **Question:** The project has rules in `<locations>`. How should they be consolidated?
> Options:
> - Merge all into `.ssot/agents/rules/common.md`.
> - Keep separate files in `.ssot/agents/rules/`.
> - Archive obsolete rules.

### Decision E — ACP registry

> **Question:** If the project has an `.acp/registry.json`:
> - Which agents should be kept?
> - Which agents should be removed?
> - Are the referenced scripts present? If not, should we create stubs or remove the entries?

### Decision F — Hooks

> **Question:** If the project has `.cursor/hooks.json` or other hook files:
> - Should ACOS manage the hooks automatically?
> - Or should they be manually merged and protected with `managed: false`?
> - Which legacy hooks must be preserved?

### Decision G — Context files

> **Question:** If the project has `claude.md`, `INDEX.md`, `AGENTS.md`:
> - Should useful content be migrated to `.ssot/agents/context/AGENTS.src.md` and `.ssot/context-index.md`?
> - Should the legacy root files be deleted after migration?

### Decision H — Non-ACOS infrastructure

> **Question:** The project has non-ACOS files/directories such as `<list>`.
> - Should they be preserved as-is and protected in `.ssot/protected-paths.json`?
> - Should any be archived?

## Step 3 — Record decisions

4. Write the recorded answers to a structured file in the generated skill directory:
   `.ssot/skills/acos-migrate-<project>/MIGRATION_DECISIONS.md`

5. Summarize the decisions back to the user:
   > Here are the decisions recorded for `<project>`:
   > - Ecosystem role: `<standalone|satellite>`
   > - Canonical workflows: `<list>`
   > - Agent mappings: `<list>`
   > - Rule consolidation: `<choice>`
   > - ACP agents kept: `<list>`
   > - Hook strategy: `<auto|manual merge>`
   > - Non-ACOS preservation: `<list>`
   > 
   > Do you approve these decisions and authorize me to generate the migration skill?

6. If the user approves, return to the calling workflow. If the user asks for changes, update the decisions and ask again.
</process>

<success_criteria>
This workflow is complete when:
- Every `decision_needed` item from the analysis has a recorded answer.
- The decisions are written to `MIGRATION_DECISIONS.md`.
- The user has explicitly approved the recorded decisions.
</success_criteria>
