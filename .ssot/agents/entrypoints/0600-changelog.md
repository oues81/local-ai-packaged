---
description: Generate release notes and changelog from git log and completed specs
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Generate release notes or update the changelog from git history and completed specs.

1. Determine the release scope from the user's request (since last tag, since last release, specific version).
2. Read `git log` for the requested range. Group commits by type (feat, fix, refactor, docs, chore, breaking).
3. Cross-reference completed specs under `docs/specs/` that fall in the range — their acceptance criteria provide user-facing descriptions.
4. Produce or update `CHANGELOG.md` following the project's existing format (Keep a Changelog, conventional-changelog, or custom).
5. For each entry, cite the commit hash or spec ID so the reader can trace the change.
6. Highlight breaking changes prominently. List new features, bug fixes, and deprecations in separate sections.
7. Do not tag or publish the release — that is `delivery.ship` authority. This entrypoint produces the changelog content only.
