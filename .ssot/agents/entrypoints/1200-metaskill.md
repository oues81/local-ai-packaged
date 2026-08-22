---
description: Generate a project-specific ACOS skill by analyzing the target project and producing a custom migration or workflow skill
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the meta-skill objective. Minimize questions.

1. Determine whether the user wants to:
   - generate a migration skill for an existing project;
   - generate a custom workflow skill for a new project;
   - understand what the meta-skill generator produces.
2. If generating a migration skill:
   - Run `node scripts/lifecycle/acos-migration-generator.mjs --root <target> --with-skill`.
   - The generated skill appears under `<target>/.ssot/skills/acos-migrate-<project>/`.
   - Review the generated skill structure with the user.
3. If generating a custom workflow skill:
   - Explain that the meta-skill generator currently focuses on migration skills.
   - Offer to extend it for custom workflow generation in a future iteration.
4. Do not execute the generated skill without explicit human approval.
5. The meta-skill is read-only during analysis. The first mutation happens only after human approval.
