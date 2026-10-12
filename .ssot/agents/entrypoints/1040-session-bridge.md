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
improvement cycle via `1840-auto-improve`.

Spec: `docs/specs/019-cycle-continuity/spec.md` — invariant **B1** (thin bridge).
Deep next-cycle analysis belongs in H1 (`.session/next-cycle-hypothesis.md`), not here.

## The chain

```
End of current session:
  1020-handoff         → status.md + handoff.md + S1 scan + H1 next-cycle-hypothesis.md
  1040-session-bridge  → next-session-prompt.md (thin) + copy-paste snippet

Next session:
  0020-resume          → consumes prompt → launches 1840-auto-improve
  1840-auto-improve    → diagnose → C1 critique → plan → gate → execute → verify → handoff
```

> **Personalization note**: `1840-auto-improve`'s diagnostic commands (step 3) are generic by
> default. The `1220-personalize` skill SHOULD have specialized them for this project (replacing
> generic `npm test`/`npm run build` with the project's actual test, build, lint, and scan
> commands). If the diagnostic step runs generic commands, consider running `1220-personalize`
> to specialize the cycle before the next session.

`0200-frontier-consult` is **optional**. Starting from ACOS 1.9.0, the default chain does
NOT invoke a frontier model. `1840-auto-improve` produces its own plan internally. The
frontier-consult path is opt-in only — the user must explicitly request it, either verbally
("use a frontier model", "consult Opus/Codex first") or by setting `--frontier` in the
prompt file's `## Action` section.

## Inputs

- `--consumer <entrypoint-id>` (optional, default: `1840-auto-improve`) — the entrypoint
  that will execute the cycle. Must exist in `.ssot/agents/workflows.json`.
- `--question <text>` (optional) — the objective for the cycle. If not provided, the skill
  derives it from the handoff's "Next recommended action" and H1.
- `--frontier` (optional) — flag the prompt file to request a frontier-model critique
  before execution. When set, `0020-resume` launches the consumer with `--frontier`;
  the consumer produces diagnose + C1 + an internal plan FIRST, then invokes
  `0200-frontier-consult --consumer <id>` with the objective and the full evidence
  bundle (diagnostic, critique, internal plan, H1) — the frontier model reviews and
  improves the plan rather than starting from scratch. If the consumer declares a
  `planConsumer` section in its frontmatter, the improved plan is persisted to that
  location. If not, the frontier model's output is advisory only.

## Procedure

1. **Verify handoff exists** — read `.ssot/handoff.md`. If it's missing or empty, stop and
   tell the user to run `1020-handoff` first.

2. **Require H1 (B1)** — locate `.session/next-cycle-hypothesis.md`, or alias
   `.session/next-cycle-analysis.md`. If neither exists (or content is only a leftover
   sentence without candidate lanes), **stop** and tell the user to finish `1020` H1
   first. Do not invent a deep analysis here.

3. **Read the next action** — extract the "Next recommended action" from `.ssot/handoff.md`
   and the current objective from `.ssot/status.md`. Cross-check against H1 candidate lanes.

4. **Build the objective** — if `--question` was provided, use it verbatim. Otherwise,
   reformulate the handoff next action + H1 into a clear cycle objective (**what**, not a
   full execution plan — C1 + plan happen in the next `1840`).

4c. **Render waves and sub-agents from H1** — do not invent lanes. Read only the
   candidate lanes already in H1 (wave role, write-set hint, parallelizable).
   Write them in **plain language a non-ACOS user understands** — no jargon-only
   lines like "`fix` lane write-set `.ssot/agents/**` parallelizable: no".
   - **Waves** — for each wave role present (`diagnose`, `fix`, `validate`,
     `ship`), one bullet: what work happens in that wave, in everyday words.
   - **Sub-agents** — for each wave: how many agents, who does which task, and
     why they can (or cannot) run in parallel. Say "one agent does everything"
     when that is the case.

4b. **Resolve the target project (containers only)** — if `clients.json` declares
   `ecosystemChildren`, fill `## Target project` in the prompt with the satellite the
   next session should work in: the first entry of `.session/bridge-queue.md` if that
   queue exists, otherwise the project this session just worked in, otherwise
   `container`. If the intent is ambiguous, ask the user. `0020-resume` uses this field
   to re-orient into the satellite before launching the consumer.

5. **Resolve the consumer** — resolve `--consumer <entrypoint-id>` (default:
   `1840-auto-improve`) in `.ssot/agents/workflows.json`. Read the entrypoint file to
   confirm it exists. If the consumer is not `1840-auto-improve` and does not declare a
   `planConsumer` section in its frontmatter, warn the user (only relevant if `--frontier`
   is set): "Consumer <id> does not declare a planConsumer section. The frontier model's
   output will be advisory only and won't be auto-persisted."

6. **Write the prompt file** — if `.ssot/next-session-prompt.md` already exists (the
   prompt consumed at the start of this cycle — **X1**), delete it immediately before
   writing so the new file cleanly supersedes it. Then write
   `.ssot/next-session-prompt.md` with this structure:

   ```markdown
   # Next session — auto-improve cycle

   ## Action
   Launch `1840-auto-improve` directly after reprise.
   <!-- If --frontier was set, replace the line above with: -->
   <!-- Launch `1840-auto-improve --frontier` after reprise — the consumer produces diagnose + C1 + an internal plan, then invokes `0200-frontier-consult --consumer 1840-auto-improve` to critique it, and continues `--from-frontier` after approval. -->

   ## Consumer
   <entrypoint-id>

   ## Target project
   <satellite path from `ecosystemChildren`, or "container">

   ## Objective
   <the objective from step 4>

   ## Hypothesis
   `.session/next-cycle-hypothesis.md`
   <!-- or `.session/next-cycle-analysis.md` if that alias was used -->

   ## Constraints
   - Run diagnose, then **C1** (`.session/hypothesis-critique.md`) before planning.
   - Cycle substance: plan material improvements/enrichments/corrections — not a
     hollow one- or two-line micro-edit cycle.
   - Human gate (G1) = one recommended concrete plan; outcomes are **Approve** or
     **Amend** only (no skip/reject menus). Deliver via the client's structured-choice
     surface (**AskQuestion** on Cursor) — do not ask the user to type "approve"/"amend".
   - Do not trust prior claims without live revalidation.
   - Do not push or deploy without explicit authorization.
   - Close with `1020` → `1040`: close briefing (objective, tasks, waves,
     sub-agents) then the resume snippet in a fenced code block.

   ## Context summary
   <2-3 lines from status.md: current objective, active milestone, key blockers>

   ## Waves
   <!-- Plain language. Example shape:
   - Fix wave: copy the new cycle rules into the project's live agent files, then regenerate projections.
   - Later diagnose wave (parked): build a detector for personalized-file drift.
   -->

   ## Sub-agents
   <!-- Plain language. Example shape:
   - Fix wave: 1 agent (same files — must stay serial).
   - Docs optional: 1 separate agent only if it touches docs/ only.
   -->

   ## Resume snippet
   <the copy-paste snippet produced in step 7>
   ```

7. **Produce the copy-paste snippet** — generate a self-contained snippet the user can
   copy-paste at the start of the next session. Format:

   ```
   /0020-resume

   Project: <absolute project path>
   Read AGENTS.md (or CLAUDE.md / .cursor/rules/acos.mdc depending on the client) for
   project rules, then read .ssot/next-session-prompt.md and launch 1840-auto-improve.
   Run acos --check before completion. Do not push or deploy without explicit authorization.
   ```

   If `--frontier` was set, the snippet's last line becomes:
   ```
   Read .ssot/next-session-prompt.md and launch 1840-auto-improve --frontier. The consumer produces its internal plan first, invokes 0200-frontier-consult to critique and improve it, then continues --from-frontier after approval.
   ```

   Prepare the snippet for **three** channels (**B2**). **Do not show the
   fenced block to the user yet** — step 8's close briefing comes first:
   - **Persist** — write it verbatim into the prompt file's `## Resume snippet`
     section (the file written in step 6).
   - **Print** — deferred to step 8: after the close briefing, show the snippet
     in a markdown **fenced code block** (opening and closing ` ``` ` fences)
     containing the full snippet and nothing else. Prose paragraphs, bullets,
     or inline backticks do **not** satisfy B2.
   - **Clipboard** — attempt a best-effort OS clipboard copy (`clip` /
     `pbcopy` / `xclip` / `xsel` / `wl-copy`), non-fatal. May run during step 7
     or 8; report which channel was used.

8. **Close briefing (mandatory — before the snippet)** — the point is
   **fluidity**: the user must understand the next cycle *now*, while this
   session is still open, so they can ask questions or change the plan
   **immediately**. Do not make them decode jargon, entrypoint IDs, or path
   globs. The turn is incomplete until they have seen (A) this briefing and
   (B) the fenced resume snippet. **Order**: briefing → fenced snippet.

   **Required format** — copy this skeleton and fill every section with real
   content from H1 / step 4. Do not invent a different structure. Do not
   collapse it into one opaque sentence.

   ```markdown
   ### Next session — what we plan to do

   **In one plain sentence:** <what the next cycle is for — no entrypoint IDs,
   no acronym soup>

   **Tasks (numbered):**
   1. <concrete task in everyday words — what changes, for what benefit>
   2. <…>
   3. <optional / parked — say so>

   **Waves (how the work is sequenced):**
   - <Wave name in plain words, e.g. "1. Diagnose">: <what happens>
   - <Wave name, e.g. "2. Fix">: <what happens>
   - <skip empty waves>

   **Sub-agents (who does what):**
   - <e.g. "One agent does all of wave 2 (same files — serial)">
   - <e.g. "Optional docs task can be a second agent if it only touches docs/">

   **Change it now?** Reply if you want a different objective, drop a task,
   or add a constraint — I will update the plan in this session before you
   paste the snippet.
   ```

   After that skeleton, one short **Meta** line is allowed (prompt path, H1
   path, consumer name, frontier on/off, clipboard yes/no) — not a substitute
   for the skeleton.

   **Then** show the fenced resume snippet (step 7 Print channel).

   **Forbidden outputs (B2/close failure):**
   - A single opaque sentence instead of the skeleton
   - Jargon-only bullets (`fix` / `write-set` / `parallelizable: no` with no
     plain explanation)
   - Only a code block / only "see `.ssot/next-session-prompt.md`"
   - Skipping Tasks, Waves, or Sub-agents sections
   - Asking the user to invent what the next session will do

   **Bad close (FAIL — never ship this):**
   ```
   Next: run 1840 on H1; fix lane write-set `.ssot/agents/**` parallelizable: no;
   see next-session-prompt.md. Paste snippet below.
   ```

   **Good close (PASS — match this clarity):**
   ```
   ### Next session — what we plan to do

   **In one plain sentence:** Add a script that warns when a personalized
   entrypoint silently drifted away from the current template.

   **Tasks (numbered):**
   1. Write the drift detector script and unit tests.
   2. Wire it into the existing audit/doctor commands.
   3. Document how to read the report (short note in migrations docs).

   **Waves (how the work is sequenced):**
   - 1. Fix: implement script + tests.
   - 2. Validate: run the new tests and the audit command once.

   **Sub-agents (who does what):**
   - One agent does fix + validate (same files — serial).

   **Change it now?** Say if you want a different scope before we continue.
   ```
   Then the fenced resume snippet.

## What 0020-resume does with this file

When `0020-resume` runs at the start of the next session, it checks for
`.ssot/next-session-prompt.md`. If found, it:
1. Reads the **whole** file (Action, Consumer, Objective, Hypothesis, Constraints,
   Context, Waves, Sub-agents, Resume snippet — informational only)
2. **Default path (no frontier)**: launches the consumer entrypoint directly
   (`1840-auto-improve`) with the full contract as input
3. **Frontier path (opt-in)**: if the prompt file's `## Action` section contains
   `--frontier`, launches the consumer with `--frontier`. The consumer produces
   diagnose + C1 + an internal plan first, then invokes
   `0200-frontier-consult --consumer <id>` with the objective and the evidence bundle,
   then continues `--from-frontier` after approval
4. Does **not** delete the prompt at launch (**X1**) — the file stays on disk as the
   cycle contract for the whole session. The only delete happens here, inside
   `1040-session-bridge` at the end of the cycle: the consumed prompt is removed
   immediately before the **new** prompt is written (step 6). `1840` must never
   delete the new prompt, and must not delete the consumed one during the cycle.

The prompt file is consumed (read) at cycle start and deleted only when `1040` writes
its replacement at cycle end. If the cycle fails or is interrupted before `1040`, the
previous prompt stays in place: the next `0020` offers to launch it again and C1
revalidates it — or the user can delete it / re-run `1040-session-bridge` to prepare
a fresh one.

## Authority

- This entrypoint is **read-only** except for deleting the consumed
  `.ssot/next-session-prompt.md` (**X1**) and writing the new one.
- It does **not** replace H1 with a new deep analysis (**B1**).
- It does not invoke the frontier model. That happens in the next session only if the user
  explicitly opts in.
- It does not execute the plan. That happens via the consumer entrypoint.
- It does not push or deploy anything.
