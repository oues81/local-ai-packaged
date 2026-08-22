---
description: Query the OKF knowledge layer and synthesize a cited answer
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the question to answer. Minimize questions.

## Prerequisites

1. Verify `.ssot/knowledge-profile.json` exists and `.ssot/knowledge/` has been initialized (run
   `0900-knowledge` first if not).
2. If no bundle roots are declared or the knowledge layer is empty, report that there is nothing to
   query and suggest running `0920-knowledge-ingest` first.

## Procedure

1. **Load all declared bundles.** For each bundle root in `.ssot/knowledge-profile.json`'s
   `bundleRoots`, call `knowledge-adapter.mjs`'s `loadBundle`. Collect all concepts, links, and
   errors across bundles.

2. **Search the concepts.** Using the loaded concepts' frontmatter (`title`, `description`, `tags`)
   and body text, identify the concept pages most relevant to the user's question. The search is
   local markdown-only — no web search, no vector store (REQ-013).

3. **Synthesize an answer.** Compose a concise answer to the question using the information found in
   the relevant concept pages. **Cite every claim** by linking to the concept page path, e.g.:
   ```markdown
   The projection pipeline validates before writing [projection-pipeline.md](projection-pipeline.md).
   ```

4. **Compounding behavior.** If the answer required information that was NOT already in the wiki
   (i.e., you had to reason from first principles, combine multiple sources, or infer something not
   explicitly stated in any concept page), file the synthesized answer back as a new or updated
   concept page via `writeConcept` (the same write path as `0920-knowledge-ingest`). This is the
   "compounding" behavior Karpathy describes — the wiki grows smarter with each query.

   - Use `type: "synthesis"` (or a project-appropriate type) for compounded pages.
   - Include `resource:` pointing to the concept pages that informed the synthesis.
   - Include `timestamp:` (ISO-8601, current time).
   - Update `index.md` and append to `log.md` as in `0920-knowledge-ingest`.

5. **Report.** Present the answer with citations to the user. If the answer was compounded back
   into the wiki, note which concept page was created or updated.

## Boundary

- Do NOT replace `.ssot/decisions.md`, `.ssot/status.md`, `.ssot/handoff.md`, or
  `.ssot/context-index.md`. If the question is about project decisions or status, point to the
  canonical file and use the knowledge layer only for synthesized context (REQ-012).
- The adapter is deterministic — `loadBundle` reads and returns; it does not search or rank.
  Editorial decisions (which concepts are relevant, how to synthesize the answer) belong to the
  agent (REQ-007).
- No web search in v1 (REQ-013). MCP-based acceleration is a Wave 4 opt-in.
