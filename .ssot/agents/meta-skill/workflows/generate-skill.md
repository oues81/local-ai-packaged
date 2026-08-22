# Workflow: Generate a Project-Specific ACOS Migration Skill

<required_reading>
**Read these reference files before executing:**
1. `references/skill-template.md` — structure of the generated skill.
2. `references/acos-conventions.md` — ACOS rules that must be respected in generated output.
3. `references/migration-patterns.md` — patterns to apply based on project type.
4. `templates/*.template` — content templates for each generated file.
</required_reading>

<process>
## Step 1 — Analyze and interview

1. Run `workflows/analyze-project.md` to produce `ACOS_MIGRATION_ANALYSIS.md`.

2. Run `workflows/interview-user.md` to produce `MIGRATION_DECISIONS.md`.

3. If the user has already approved these files, read them. If not, stop and ask for approval.

## Step 2 — Determine skill name and path

4. Derive the skill name from the project directory name:
   ```
   acos-migrate-<project>
   ```
   For example: `acos-migrate-comet-users`.

5. Create the target directory:
   ```bash
   mkdir -p .ssot/skills/<skill-name>/{workflows,references,templates}
   ```

   The generated skill is written inside the **target project**, not inside the source monorepo, unless the target project is that monorepo itself.

## Step 3 — Generate SKILL.md

6. Use `templates/SKILL.md.template` to generate the main router file.

7. Customize the template with:
   - Project name.
   - Brief project description.
   - Objective tailored to the project.
   - Reference to the generated workflows and references.
   - Success criteria.

## Step 4 — Generate the migration playbook

8. Use `templates/migrate.md.template` to generate `workflows/migrate.md`.

9. Customize the playbook with:
   - Exact backup command for the project.
   - Exact rename command for `.ssot`.
   - Step-by-step mappings derived from the analysis.
   - Workflow duplicate resolution based on user decisions.
   - Agent mappings based on user decisions.
   - Rule consolidation based on user decisions.
   - ACP registry correction (if applicable).
   - Hook merge strategy (if applicable).
   - Protected paths list.
   - Cleanup steps.
   - Four decision gates with exact questions.

## Step 5 — Generate references

10. Use `templates/legacy-mappings.md.template` to generate `references/legacy-mappings.md`.
    - Fill in the project-specific mapping tables.
    - Include the duplicate resolution framework.
    - Include the agent collision framework.

11. Use `templates/decision-gates.md.template` to generate `references/decision-gates.md`.
    - Adapt the four gates to the project's specific merge points.
    - Include the exact questions to ask.

12. Use `templates/acos-cli-guide.md.template` to generate `references/acos-cli-guide.md`.
    - Include expected outputs for the project.
    - Include project-specific failure patterns derived from the analysis.

13. If the project has an ACP registry, use `templates/acp-registry.md.template` to generate `references/acp-registry.md`.

14. Add any project-specific reference files needed (for example, `references/hook-merge.md`, `references/fabric-rules.md`).

## Step 6 — Validate the generated skill

15. Verify that every workflow file references existing reference files.

16. Verify that all generated files are internally consistent:
    - No `category` values outside `onboarding`, `delivery`, `maintenance`, `session`.
    - No references to files that were not generated.
    - Decision gate questions match the actual merge steps.

17. Run a quick syntax check on generated JSON files (if any) using `python -m json.tool` or equivalent.

18. Present the generated skill structure to the user:
    ```
    Generated skill for <project>:
    .ssot/skills/<skill-name>/
    ├── SKILL.md
    ├── workflows/
    │   └── migrate.md
    └── references/
        ├── legacy-mappings.md
        ├── decision-gates.md
        ├── acos-cli-guide.md
        └── acp-registry.md (if applicable)
    ```

19. Ask the user:
    > The migration skill is generated. Do you want me to:
    > 1. Stop here and let you review the generated skill.
    > 2. Execute the generated playbook now.

## Step 7 — Route or stop

20. If the user wants to stop, end the workflow.

21. If the user wants to execute, route to `workflows/execute-generated-playbook.md`.
</process>

<success_criteria>
This workflow is complete when:
- A complete skill directory exists under `.ssot/skills/<skill-name>/`.
- All files are internally consistent and reference each other correctly.
- The user has approved the generated skill or chosen to execute it.
</success_criteria>
