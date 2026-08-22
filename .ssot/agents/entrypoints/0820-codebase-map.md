---
description: Map codebase architecture, modules, dependencies, and conventions
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Map the codebase architecture and feed the knowledge layer.

1. Determine the mapping scope from the user's request (whole project, a subsystem, a specific module).
2. Identify the architectural layers, entry points, and data flow. Read key source files, config, and dependency manifests.
3. Catalog modules, their responsibilities, and their dependencies (internal and external).
4. Identify conventions: naming, file layout, error handling, testing patterns, commit style.
5. Feed the knowledge layer via `knowledge.ingest` (`0920-knowledge-ingest`): produce concept pages for significant modules and patterns under `.ssot/knowledge/`.
6. Produce a mapping report with:
   - Architecture diagram (text or mermaid).
   - Module table: name, path, responsibility, key dependencies.
   - Conventions summary.
   - Knowledge pages created.
7. Do not mutate source files — this is a read-only mapping exercise. The knowledge pages are the only write output.
