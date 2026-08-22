# Workflow: Analyze a Target Project for ACOS Migration

<required_reading>
**Read these reference files before executing:**
1. `references/acos-conventions.md` — ACOS structure, allowed values, constraints.
2. `references/file-classification.md` — how to classify legacy files.
3. `references/migration-patterns.md` — common migration patterns.
</required_reading>

<process>
## Step 1 — Verify environment

1. Confirm the current directory is the target project root:
   ```bash
   git rev-parse --show-toplevel
   ```

2. Check that the worktree is clean or that the user is aware of pending changes.

3. Check prerequisites:
   - Node.js >= 20 (`node -v`).
   - Access to the ACOS repository (`npm view @acos/core` or equivalent).
   - The project is **not** already ACOS-initialized (no `.ssot/agents/` directory). If it is, stop and explain that the audit is limited.

## Step 2 — Inventory legacy infrastructure

4. List all AI/editor-related directories and files:
   ```bash
   ls -la .ssot .cursor .claude .devin .kilocode .kilo .windsurf .opencode .codex .agents .mcp.json 2>/dev/null
   ```

5. Record every directory and its purpose. Use the classification table from `references/file-classification.md`.

6. Identify potential ACOS source files:
   - `.ssot/rules/*.md` or `.cursor/rules/*.md` or `.windsurf/rules/*.md` or `.devin/rules/*.md` or `.kilocode/rules/*.md` → rules.
   - `.ssot/workflows/*.md` or `.cursor/commands/*.md` or `.windsurf/workflows/*.md` or `.kilocode/workflows/*.md` → workflows/entrypoints.
   - `.ssot/agents/*.md` or `.cursor/agents/*.md` or `.claude/agents/*.md` → agents.
   - `.ssot/agents/*.py` or `.cursor/agents/*.py` or `.codex/agents/*.py` → ACP scripts.
   - `.acp/registry.json` → ACP registry.
   - `.cursor/hooks.json` or `.devin/hooks*.json` or `.codex/hooks.json` → hooks.
   - `claude.md` or `INDEX.md` or `AGENTS.md` → context/index files.

## Step 3 — Run ACOS pre-init audit

7. Install ACOS locally (dev mode) in the target project:
   ```bash
   npm install --save-dev git+https://github.com/oues81/acos.git#main
   ```

8. Run the audit without renaming `.ssot`:
   ```bash
   node node_modules/@acos/core/scripts/pre-init-audit.mjs --root . --migration-plan
   ```

9. If the project already has a `.ssot/agents/` directory, note that the audit will be limited and explain this to the user.

10. Read the generated reports:
    - `ACOS_PRE_INIT_AUDIT.md`
    - `ACOS_MIGRATION_PLAN.json`

## Step 4 — Summarize the audit

11. Count the buckets:
    - backups
    - moves
    - adoptions
    - preserves
    - reviews

12. Identify the main risk categories:
    - Duplicate workflows.
    - Colliding agents (e.g., `reviewer.md`, `test-engineer.md`).
    - Editor-specific rules duplicated across clients.
    - ACP registry pointing to non-existent scripts.
    - Hooks that need manual merging.
    - Non-ACOS infrastructure (e.g., `.codex/missions/`).

13. Cross-reference the generic ACOS plan with the actual legacy files. Produce a project-specific preview table:

    | Legacy file | Generic ACOS suggestion | Project adaptation | Decision needed |
    |---|---|---|---|
    | ... | ... | ... | ... |

## Step 5 — Produce the analysis report

14. Write the report to a file in the project root or in `.planning/` if it exists:
    `ACOS_MIGRATION_ANALYSIS.md`

    The report must contain:
    - Executive summary.
    - Inventory of legacy directories.
    - ACOS audit summary.
    - Detailed classification by file type (rules, workflows, agents, hooks, ACP, context).
    - List of duplicates and collisions.
    - List of business decisions that require human input.
    - Preliminary recommendations.

15. Present a concise summary to the user and ask:
    > Analysis complete for `<project>`. No files were changed.
    > Would you like me to (1) generate the migration skill and playbook, or (2) stop here?

## Step 6 — Stop or route

16. If the user wants to stop, end the workflow.

17. If the user wants to continue, route to `workflows/generate-skill.md` or `workflows/execute-generated-playbook.md` depending on the original intent.
</process>

<success_criteria>
This workflow is complete when:
- `ACOS_PRE_INIT_AUDIT.md` and `ACOS_MIGRATION_PLAN.json` are generated and read.
- `ACOS_MIGRATION_ANALYSIS.md` is written.
- No files in the target project are modified.
- The user has a clear preview of what migration would involve.
</success_criteria>
