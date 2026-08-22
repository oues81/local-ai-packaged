---
name: acos-migration-generator
description: Analyze any project and generate a complete, project-specific ACOS migration skill and playbook. The generated skill is exhaustive, detailed, and ready to execute under human supervision.
---

<objective>
Analyze a target repository and produce a custom ACOS migration skill under `.ssot/skills/acos-migrate-<project>/`. The generated skill contains:
- a `SKILL.md` router,
- a `workflows/migrate.md` playbook,
- a `references/legacy-mappings.md` file,
- a `references/decision-gates.md` file,
- a `references/acos-cli-guide.md` file,
- a `references/acp-registry.md` file if the project uses ACP,
- and any project-specific notes needed to execute the migration safely.

The meta-skill is not an unattended migrator. It performs read-only analysis autonomously but stops for explicit human approval before generating files and again before executing the generated playbook.
</objective>

<quick_start>
1. Ensure the target project worktree is clean or that the user is aware of pending changes.
2. Ask the user for the target project path and whether they want only analysis, generated artifacts, or full execution.
3. Route to the matching workflow:
   - `analyze-project` — audit and report only.
   - `generate-skill` — analyze + generate the custom skill and playbook.
   - `execute-generated-playbook` — analyze + generate + execute the migration.
</quick_start>

<essential_principles>
<principle name="read_only_analysis_first">
Never mutate the target project before running `pre-init-audit --migration-plan` and producing a written analysis. The first mutations happen only after human approval.
</principle>

<principle name="project_specific_output">
The generated skill must be specific to the target project. Do not paste generic assumptions from the source monorepo unless the target project actually shares that lineage.
</principle>

<principle name="human_decisions_required">
The meta-skill cannot decide business questions alone: canonical workflow choice, agents to keep/remove, hook merge strategy, ACP registry cleanup, satellite vs standalone. These must be asked explicitly and recorded.
</principle>

<principle name="generated_skill_is_a_playbook">
The output skill is a guided playbook with human decision gates, not an autonomous script. It inherits the same safety model as `acos-satellite-migration`.
</principle>

<principle name="validate_generated_artifacts">
After generating the skill and playbook, verify that the generated files are internally consistent (no broken references, no missing templates) before claiming the generation is complete.
</principle>
</essential_principles>

<intake>
Ask the user:

**What would you like to do for this project?**
1. **Analyze only** — run the audit and produce a detailed migration report; no file changes.
2. **Generate migration skill** — analyze the project and create a complete, project-specific ACOS migration skill under `.ssot/skills/acos-migrate-<project>/`.
3. **Generate and execute** — analyze, generate the skill, then execute the generated playbook on the target project.

**What is the target project path?** (absolute path, for example `C:/projects/my-app`)

Wait for the response before proceeding.
</intake>

<routing>
| Response | Workflow |
|---|---|
| 1, "analyze", "audit", "report" | `workflows/analyze-project.md` |
| 2, "generate", "skill", "playbook" | `workflows/generate-skill.md` |
| 3, "execute", "generate and execute", "full" | `workflows/execute-generated-playbook.md` |
| other | Clarify, then select. |

After reading the chosen workflow, follow it exactly and load all required references before executing steps.
</routing>

<reference_index>
**ACOS conventions and constraints:** `references/acos-conventions.md`
**Common migration patterns:** `references/migration-patterns.md`
**Legacy file classification:** `references/file-classification.md`
**User interview questions:** `references/interview-questions.md`
**Generated skill structure:** `references/skill-template.md`
</reference_index>

<workflows_index>
| Workflow | Purpose |
|---|---|
| `workflows/analyze-project.md` | Read-only audit and migration report. |
| `workflows/generate-skill.md` | Analyze + generate the project-specific skill and playbook. |
| `workflows/execute-generated-playbook.md` | Analyze + generate + execute the migration. |
| `workflows/interview-user.md` | Ask business decisions and record answers. |
</workflows_index>

<success_criteria>
This meta-skill is used correctly when:
- The target project is analyzed with `pre-init-audit --migration-plan`.
- A written report classifies every legacy file as move/merge/preserve/archive.
- Business decisions are gathered explicitly from the user.
- The generated skill is self-contained, internally consistent, and ready for execution.
- No file is mutated on the target project before explicit approval.
- The generated skill is committed or presented to the user for review.
</success_criteria>
