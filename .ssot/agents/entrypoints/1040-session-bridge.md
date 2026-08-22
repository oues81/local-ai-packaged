---
description: Prepare the next session prompt for an automated improvement cycle
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Run this **after** `1020-handoff` at the end of a session. It prepares a prompt file that
`0020-resume` will find at the start of the next session and use to launch an automated
improvement cycle: frontier model plans → consumer entrypoint executes.

## The chain

```
End of current session:
  1020-handoff        → writes status.md + handoff.md
  1030-session-bridge → writes .ssot/next-session-prompt.md

Next session:
  0020-resume         → finds next-session-prompt.md → launches the cycle
  0200 --consumer <id> → frontier model (Codex, Opus, etc.) produces the plan
  consumer --from-frontier → cheap models execute the plan
```

## Inputs

- `--consumer <entrypoint-id>` (required) — the entrypoint that will execute the plan
  produced by the frontier model. Must declare a `planConsumer` section in its frontmatter.
- `--question <text>` (optional) — the question for the frontier model. If not provided,
  the skill derives it from the handoff's "Next recommended action".

## Procedure

1. **Verify handoff exists** — read `.ssot/handoff.md`. If it's missing or empty, stop and
   tell the user to run `1020-handoff` first.

2. **Read the next action** — extract the "Next recommended action" from `.ssot/handoff.md`
   and the current objective from `.ssot/status.md`.

3. **Build the question** — if `--question` was provided, use it verbatim. Otherwise,
   reformulate the handoff's next action as an open-ended question for the frontier model.
   The question should describe **what** needs to be done, not **how** — the frontier model
   decides how. For example:
   - Handoff says: "Next: fix the 8 KPIs in ERROR state"
   - Question becomes: "Diagnose the 8 KPIs currently in ERROR state and produce a
     correction plan"

4. **Verify the consumer** — resolve `--consumer <entrypoint-id>` in
   `.ssot/agents/workflows.json`, read the entrypoint file, and confirm it has a
   `planConsumer` section in its frontmatter. If not, stop and tell the user: "Consumer
   <id> does not declare a planConsumer section. The frontier model's output won't be
   consumable by this entrypoint."

5. **Write the prompt file** — write `.ssot/next-session-prompt.md` with this structure:

   ```markdown
   # Next session — automated improvement cycle

   ## Action
   Launch `0200-frontier-consult --consumer <entrypoint-id>` with the question below.

   ## Consumer
   <entrypoint-id>

   ## Question
   <the question from step 3>

   ## Context summary
   <2-3 lines from status.md: current objective, active milestone, key blockers>

   ## After frontier-consult
   The frontier model will produce a plan. After user approval, hand off to
   `<entrypoint-id> --from-frontier` to execute with cheap models.
   ```

6. **Tell the user** — report:
   - The prompt file path (`.ssot/next-session-prompt.md`)
   - The consumer entrypoint that will be used
   - The question that will be sent to the frontier model
   - "At the next session, 0020-resume will find this prompt and launch the cycle
     automatically."

## What 0020-resume does with this file

When `0020-resume` runs at the start of the next session, it checks for
`.ssot/next-session-prompt.md`. If found, it:
1. Reads the consumer ID and question
2. Launches `0200-frontier-consult --consumer <id>` with the question
3. After the frontier model produces the plan and the user approves, hands off to the
   consumer entrypoint with `--from-frontier`
4. Deletes `.ssot/next-session-prompt.md` after the cycle is launched (one-shot)

This is a one-shot mechanism. The prompt file is consumed and deleted. If the cycle fails
or is interrupted, the user can re-run `1030-session-bridge` to prepare a new one.

## Authority

- This entrypoint is **read-only** — it writes only `.ssot/next-session-prompt.md`.
- It does not invoke the frontier model. That happens in the next session via `0200`.
- It does not execute the plan. That happens via the consumer entrypoint.
