---
description: Produce a cross-project handoff report for declared dependencies
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Read `.ssot/agents/dependencies.json` and identify every declared dependency. For each downstream dependency, produce a handoff report that includes:

1. **Producing project**: this project's name and root path.
2. **Produced artifact**: the artifact type (`data`, `api`, `lib`, `definition`) and a concise description of what changed.
3. **Contract**: the path or URL declared in the `contract` field.
4. **Source commit**: the current Git commit hash of this project (`git rev-parse HEAD`).
5. **Downstream action required**: the `handoffCommand` if present, otherwise a concrete manual step for the consuming project.

For each upstream dependency, record the upstream project, artifact type, contract, and the recommended action for this project (for example, update a client library or refresh a schema).

Emit the report as markdown. If an `--output` path is provided, write the report to that file without mutating any project. Otherwise print the report to stdout. Do not execute `handoffCommand` automatically; include it as a recommended step for the downstream operator to run.

Do not include raw file contents beyond the contract reference and commit hash. Keep the report read-only and authority-preserving.
