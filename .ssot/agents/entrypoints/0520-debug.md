---
description: Systematic debugging with persistent state across sessions
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Debug an issue systematically with persistent state across context resets.

1. Determine the issue from the user's request. Create or resume `specs/<feature-id>/debug-state.md`.
2. **Reproduce**: establish a reliable reproduction steps. Record the exact command, environment, and expected vs. actual behavior.
3. **Trace**: follow the code path from the entry point to the failure. Add targeted logging or print statements to isolate the issue.
4. **Isolate**: identify the root cause — not just the symptom. Record the file, line, and the faulty logic or assumption.
5. **Propose fix**: describe the smallest change that addresses the root cause. Do not apply it unless explicitly instructed.
6. Record a timestamp in `debug-state.md` at each step. If the state is stale (older than the session start), warn the user before resuming (FM-006).
7. Once the fix is applied and verified, archive `debug-state.md` into the feature's history and clear the active debug context.
