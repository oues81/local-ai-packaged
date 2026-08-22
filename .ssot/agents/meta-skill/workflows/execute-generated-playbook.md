# Workflow: Execute the Generated Migration Playbook

<required_reading>
**Read these reference files before executing:**
1. The generated skill at `.ssot/skills/<skill-name>/SKILL.md`.
2. The generated playbook at `.ssot/skills/<skill-name>/workflows/migrate.md`.
3. All generated references under `.ssot/skills/<skill-name>/references/`.
</required_reading>

<process>
## Step 1 — Confirm prerequisites

1. Ensure the generated skill exists and is internally consistent.

2. Verify the target project worktree is clean or that the user is aware of pending changes.

3. Confirm the user has reviewed the generated skill and wants to execute it.

## Step 2 — Execute the generated playbook

4. Follow the generated `workflows/migrate.md` step by step.

5. Respect every decision gate in the generated playbook. Do not proceed past a gate without explicit user approval.

6. If the generated playbook is unclear or contradicts the actual project state, stop and ask the user. Do not improvise.

## Step 3 — Handle validation failures

7. If `npx acos --validate` or `npx acos --check` fails:
   - Capture the exact error.
   - Determine whether the failure is:
     - ACOS structural (fix in `.ssot/agents/`).
     - Project-specific (restore from backup, add protected path, or ask the user).
     - A bug in the generated playbook (stop and report to the user).
   - Apply the smallest fix.
   - Re-run `npx acos --fix && npx acos --validate && npx acos --check`.
   - If the same error persists after two attempts, stop and report.

## Step 4 — Finalize

8. After validation passes, ask the user whether to:
   - Clean up `.ssot.legacy/` and temporary reports.
   - Commit the migration.
   - Push the migration branch.

9. Perform the chosen finalization steps.

## Step 5 — Extract learnings

10. After the migration is complete, compare the generated playbook with what actually happened.

11. If the playbook was wrong or incomplete, update the generated skill files to reflect the corrected procedure.

12. Report to the user:
    - Migration status.
    - Validation results.
    - Any deviations from the generated playbook.
    - Suggested improvements to the generated skill.
</process>

<success_criteria>
This workflow is complete when:
- The generated playbook has been executed successfully.
- `npx acos --validate` and `npx acos --check` pass on the target project.
- The user has approved the final state and any cleanup/commit.
- The generated skill has been updated to reflect any corrections discovered during execution.
</success_criteria>
