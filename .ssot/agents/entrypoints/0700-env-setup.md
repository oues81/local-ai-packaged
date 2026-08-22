---
description: Detect and set up the project development environment
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Detect the project's development environment and set it up.

1. Reuse `scripts/audit/project-intelligence.mjs` to detect the project's languages, runtimes, and package managers.
2. Detect Node (package.json), Python (pyproject.toml / requirements.txt), Go (go.mod), Rust (Cargo.toml) and their versions.
3. Install dependencies using the detected package manager (`npm install`, `pip install -e .` / `uv sync`, `go mod download`, `cargo build`).
4. Verify the build and test commands work (`npm test`, `pytest`, `go test ./...`, `cargo test`).
5. Produce `specs/<feature-id>/env-setup.md` with:
   - Detected runtimes and versions.
   - Install commands run and their results.
   - Build/test verification results.
   - Any missing tools or version mismatches.
6. Do not upgrade runtimes or dependencies — that is `maintenance.deps`. This entrypoint establishes a working baseline only.
7. If the environment is already set up, verify it and report healthy without reinstalling.
