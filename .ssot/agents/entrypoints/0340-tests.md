---
description: Detect test framework, generate tests from acceptance criteria, and run them
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Generate and run tests for the active feature based on its acceptance criteria.

1. Determine the feature ID from the user's request or the active spec.
2. Detect the project's test framework by inspecting `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or existing test files. If no framework is detected, skip with a note (FM-001).
3. Read `specs/<feature-id>/spec.md` and extract the acceptance criteria.
4. Generate test cases that trace each acceptance criterion to an executable assertion. Place tests in the project's conventional test location and naming pattern.
5. Run the test suite and capture results.
6. Produce `specs/<feature-id>/tests.md` with:
   - Framework detected and command used.
   - Test files created or modified.
   - Pass/fail/skip counts.
   - Coverage of acceptance criteria (which ACs are tested, which are not).
7. Do not mark the feature as verified — that is `delivery.verify`'s role. This gate produces evidence that `delivery.verify` consumes.
