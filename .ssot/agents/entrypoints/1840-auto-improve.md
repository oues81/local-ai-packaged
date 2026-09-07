---
description: Automated improvement cycle — diagnose, plan, execute, verify, hand off
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Launch an autonomous auto-improvement cycle on the project. This entrypoint is triggered by
`0020-resume` when it finds `.ssot/next-session-prompt.md`, or directly by the user.

## The chain

```
End of current session:
  1020-handoff         → writes status.md + handoff.md
  1040-session-bridge  → writes .ssot/next-session-prompt.md (with copy-paste snippet)

Next session:
  0020-resume          → finds next-session-prompt.md → launches 1840-auto-improve
  1840-auto-improve    → diagnose → plan → gate → execute → verify → handoff
```

`0200-frontier-consult` is **optional**. If the user explicitly requests a frontier-model
critique before execution, 1840-auto-improve produces its own plan internally (step 4), then
sends that plan to `0200-frontier-consult` for validation, critique, and improvement. The
frontier model does NOT create the plan from scratch — it reviews and improves the plan
already produced by this entrypoint. Otherwise, 1840-auto-improve produces its own plan
internally and proceeds directly. The frontier-consult path is never the default — it is
opt-in only.

## Inputs

- The user's accompanying text is the **objective** of the cycle.
- If `.ssot/next-session-prompt.md` exists, its `## Objective` section is the objective.
- `--from-frontier` (optional) — indicates a frontier-model critique already exists at the
  `planConsumer.specPath`/`planFile` location. The internal plan was produced, sent to the
  frontier model for critique, and the improved plan was written back. Read the improved plan
  and skip re-planning. This flag is only set when `0200-frontier-consult --consumer
  1840-auto-improve` was invoked after the internal plan was produced.
- `--frontier` (optional) — explicitly request a frontier-model critique of the internal plan
  before execution. This produces the internal plan (step 4), then invokes
  `0200-frontier-consult --consumer 1840-auto-improve` with the objective + the internal plan
  as context for critique. After the frontier model improves the plan and the user approves,
  continue with `--from-frontier` semantics.

## Procedure

1. **Read the objective** — if `.ssot/next-session-prompt.md` exists, read it and extract
   the `## Objective` section. Otherwise, use the user's accompanying text. If neither
   provides a clear objective, ask the user what they want to improve.

2. **Frontier-consult gate (optional)** — if `--frontier` was provided OR the user
   explicitly asks for a frontier-model critique:
   - **Produce the internal plan first** (step 4 below), then return here.
   - Launch `0200-frontier-consult --consumer 1840-auto-improve` with the objective AND
     the internal plan as context. The frontier model validates, critiques, and improves
     the plan — it does NOT create one from scratch.
   - After the frontier model returns the improved plan and the user approves it, continue
     with `--from-frontier` semantics (the improved plan file is pre-existing).
   - If the user did NOT request frontier-consult, skip this step entirely and use the
     internal plan directly (step 4).

3. **Diagnose the real state** — run the project's standard verification commands to
   establish a baseline. This is project-specific and SHOULD be personalized by the
   `1220-personalize` skill. Two modes:

   **Single-project mode** (default — standalone project or satellite):
   - Read `.ssot/status.md` and `.ssot/handoff.md` for the last known state.
   - Run the project's test suite (detect the framework: `npm test`, `pytest`, `go test`,
     `cargo test`, etc.).
   - Run the project's build (detect: `npm run build`, `hugo`, `cargo build`, etc.).
   - Run `npx --no-install acos --check` to verify SSOT projection sync.
   - Run `git status` to detect uncommitted changes.
   - If the project has a lint command, run it.
   - If the project has a secrets-scan command, run it.
   - Record the diagnostic results in `.session/diagnostic.md`.
   - **Research before asking**: when the diagnosis reveals ambiguities or unknowns,
     resolve them through codebase exploration, documentation, or web research (rule 8)
     before surfacing them to the user. Only ask the user as a last resort, with structured
     options and justified recommendations.
   - If tests or build fail: the cycle becomes a **correction cycle**, not an improvement
     cycle. Prioritize fixing the failures before any improvement work.

   **Ecosystem mode** (container with `ecosystemChildren` — when the objective spans
   multiple satellites or the container itself):
   - Read `specs/ecosystem-integration/capability-evidence.json` if it exists, to establish
     the current proof-level baseline.
   - Launch N sub-agents in parallel (one per relevant satellite, max 5 concurrent):
     each sub-agent reads `<satellite>/.ssot/status.md` + `handoff.md`, runs the
     satellite's test suite, and returns a compact diagnostic (tests pass/fail count,
     last commit SHA, open blockers). Sub-agents re-orient independently per
     `orientation.md` → "When you are a sub-agent".
   - The parent agent aggregates all sub-agent diagnostics into `.session/diagnostic.md`
     with a per-satellite table.
   - If the diagnostic reveals a need for wave decomposition (multi-satellite,
     multi-domain work), invoke `0160-wave-plan-prep` to prepare a structured wave plan
     before proceeding to step 4.
   - If tests or build fail on any satellite: that satellite becomes a **correction
     priority** in the plan.

4. **Plan** — produce a short plan in `.session/plan.md`:
   - If `--from-frontier` was set: read the improved plan from
     `<specPath>/<planFile>` (declared in the `planConsumer` frontmatter) and use it
     directly. Skip internal planning — the plan was already produced internally and
     improved by the frontier model.
   - Otherwise: based on the diagnostic, identify what to do:
     - **If things are green**: identify improvements (design, performance, security,
       technical debt, UX, missing tests, documentation gaps). Prioritize by impact.
     - **If things are red**: identify the corrections needed. Prioritize by severity.
   - **Standard mode** (≤5 tasks, single project): break into prioritized tasks
     (max 5 per cycle to keep the scope bounded). Each task must have: description,
     files affected, domain (code|tests|docs|infra), dependencies, and a verification
     command.
   - **Wave mode** (>5 tasks OR multi-satellite OR diagnostic invoked
     `0160-wave-plan-prep`): decompose into waves following the agent-wave orchestration
     pattern (diagnose → fix → validate → ship):
     - Wave 1 = diagnose (parallel between projects, read-only)
     - Wave 2 = fix/implement (parallel between projects, sequential within a project)
     - Wave 3 = validate (sequential)
     - Wave 4 = ship/handoff (sequential)
     - Structure: `specs/auto-improve-{date}/waves/manifest.json` with per-lane
       `promptFile`, `reportFile`, `statusFile`.
     - Each task must have: description, files affected, domain, dependencies,
       verification command, `Parallelizable: true|false`, `Lane` assignment.
     - Max 5 parallel lanes per wave (coordination cost).

5. **Human gate** — present the plan to the user. Wait for approval before executing.
   Do NOT execute blindly. This is the single human gate in the cycle.
   - If the user modifies the plan, update `.session/plan.md` accordingly.
   - If the user rejects the plan, stop and ask for a new objective.

6. **Execute** — implement the approved tasks. Two modes:

   **Standard mode** (≤5 tasks, single project):
   - Implement tasks one by one or in parallel if independent.
   - Respect protected paths (`protected-paths.json`).
   - Respect the constitution and existing decisions (`.ssot/decisions.md`).
   - Do not invent features outside the active spec.
   - Preserve unrelated changes in the working tree.
   - After each task, run its verification command. If it fails, fix before continuing
     to the next task.

   **Wave mode** (>5 tasks OR multi-satellite):
   - For each wave (diagnose → fix → validate → ship):
     - Launch N sub-agents in parallel (one per lane/task, max 5 concurrent).
       All parallel sub-agents for one wave MUST be dispatched in a single message
       to achieve true parallelism.
     - **File-disjoint only**: before dispatching, list the files each task will touch.
       If two tasks touch the same file, run them sequentially in the same subagent.
       Parallel writes to one file corrupt work.
     - Each sub-agent prompt must include: task ID, exact file paths it may
       create/modify (the disjoint set), files it may read but not write (context),
       acceptance criteria, and "Do not touch files outside your allowed set."
     - Sub-agents re-orient independently per `orientation.md` → "When you are a
       sub-agent" — they do NOT share the calling agent's context.
     - Wait for all sub-agents to return before proceeding to the next wave.
     - If any sub-agent reports `blocked`: launch a targeted fix wave (max 3 cycles),
       then escalate to the user.
   - After each wave, the parent agent runs the relevant verification commands
     (never trust sub-agent-reported pass without re-running).

7. **Verify** — re-run the same verification commands as step 3. If regressions appear,
   fix them before continuing. Record results in `.session/verify.md`.

8. **Handoff** — launch `1020-handoff` to close the session:
   - Update `.ssot/status.md` and `.ssot/handoff.md`.
   - Record decisions in `.ssot/decisions.md`.
   - Sync the SSOT (`0660-sync`).
   - Commit the changes (do not push without explicit authorization).

9. **Session bridge (mandatory)** — launch `1040-session-bridge` to write
   `.ssot/next-session-prompt.md` and produce the copy-paste snippet for the next
   session. This chains automatically so the user only needs to paste the snippet
   at the start of the next session.

10. **Cleanup** — delete `.ssot/next-session-prompt.md` (the cycle is consumed, one-shot).
    If the cycle failed or was interrupted, the user can re-run `1040-session-bridge` to
    prepare a new one.

## Personalization

This entrypoint is project-agnostic in ACOS core. The `1220-personalize` skill SHOULD
specialize it for each project by:
- Replacing the generic diagnostic commands (step 3) with the project's actual test,
  build, lint, and scan commands.
- Adding project-specific protected paths and constraints to step 6.
- Adding project-specific improvement categories to step 4.
- Adding project-specific verification requirements to step 7.

The personalized version lives in the project's `.ssot/agents/entrypoints/1840-auto-improve.md`
and overrides the ACOS template version.

## Reminders

- The cycle does NOT relaunch automatically. Wait for human validation at the end.
- If the diagnostic reveals a blocker (P0, external ops, human action), stop and report it.
- Do NOT push to the remote without explicit authorization.
- Do NOT deploy without explicit authorization.
- If the conversation context becomes long, launch `1060-compact` before execution.
- `0200-frontier-consult` is optional and opt-in only. The default path is internal
  planning. When `--frontier` is used, the frontier model critiques and improves the
  internal plan — it does NOT create a plan from scratch. Never invoke frontier-consult
  without an explicit user request or `--frontier` flag.

## Authority

- This entrypoint has **bounded autonomy**: it reads, writes code, runs tests, and commits,
  but does not push or deploy.
- The human gate at step 5 is mandatory. No execution without approval.
- The handoff at step 8 is mandatory. No session ends without a handoff.

## planConsumer (optional — only used when --frontier is set)

```yaml
planConsumer:
  specPath: "specs/auto-improve-{date}/"
  planFile: "tasks.md"
  planFormat: |
    - [ ] **T-001** — <description>
      - Depends on: none
      - Files: `<path>`
      - Domain: code|tests|docs|infra
      - Parallelizable: true|false
      - Lane: A1
```

This section is only read by `0200-frontier-consult` when `--consumer 1840-auto-improve` is
invoked (after the internal plan is produced). It has no effect on the default (internal
planning) path. The frontier model receives the internal plan as context and returns an
improved version in this format.
