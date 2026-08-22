---
description: Perform pre-migration analysis to identify custom content, missing state files, semantic references, and non-conformities before the deterministic migration apply
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the migration objective. Minimize questions.

## ⚠️ Autonomy directive — READ BEFORE PROCEEDING

You are an autonomous agent performing migration analysis. **You decide, you don't ask.**

- **DO**: Read the codebase, analyze the legacy files, compare with the template, and make
  informed decisions about preservation strategies, classifications, renumbering, and gap
  resolutions. You have the full project context — use it.
- **DO**: Resolve duplicates by choosing the best version. Convert legacy content to canonical
  format. Merge complementary content. These are your decisions, not the user's.
- **DO NOT**: Ask the user to "confirm or adjust each strategy". That is your job. The user
  gave you the migration objective; the rest is execution.
- **DO NOT**: Ask the user to "confirm or override each classification". Classify based on your
  analysis of the actual file content and project context.
- **DO NOT**: Present each finding one-by-one and ask for approval. Make all decisions, then
  present the COMPLETE plan at the gate for a single approval.
- **ASK THE USER ONLY**: When you have exhausted all analysis avenues and genuinely cannot
  determine the right course of action (e.g. two equally-valid business decisions that only
  the project owner can resolve). This should be rare — if you're doing your job, almost
  everything is determinable from the codebase.

The gates below are **approval checkpoints for the complete plan**, not per-item Q&A sessions.
You present what you've decided, the user approves or redirects, you proceed.

1. Identify the target project root from the user's request. If not provided, ask for it.
2. Verify the target project exists and is accessible and is ACOS-initialized (`.ssot/agents/` must exist). If it is not initialized, stop and apply `project.migrate` / `1100-migrate` instead.
3. **⚠️ CRITICAL — Verify the installed ACOS code is up to date.** The analysis scanner runs from the ACOS code in `node_modules/@acos/core` (npm) or `acosSource.path` (local-checkout). If this code is stale, the analysis uses old logic and will miss renames, produce incorrect gap detection, or reference outdated template structure. Before proceeding:
   - Read `.ssot/agents/clients.json` → `acosSource`. If `type: "npm"`, run `npm install --save-dev git+https://github.com/oues81/acos.git#main` to update. If `type: "local-checkout"`, verify the source repo is at the latest commit (`git -C <path> pull`) and that `node -e "console.log(require('<path>/scripts/core/ssot-migrations.mjs').CURRENT_SSOT_VERSION)"` matches the target version.
   - **Never run the analysis with stale ACOS code.** Changing the version number in `package.json` or `clients.json` does NOT update the code — the actual scripts, schemas, and templates must be replaced.
   - If the user provides an ACOS source path, use that path to verify the version. Do not assume `node_modules` is current.
4. Determine the project's current `ssotVersion` by reading `.ssot/agents/workflows.json` (or `clients.json`). Determine the target version from the ACOS code's `CURRENT_SSOT_VERSION`.
4. Run the deterministic pre-migration analysis scanner:
   - Resolve the ACOS code path: read `.ssot/agents/clients.json` → `acosSource`. If `type: "npm"`, use `<project-root>/node_modules/@acos/core`. If `type: "local-checkout"`, resolve `acosSource.path` relative to the project root. If `acosSource` is absent or the path is invalid, ask the user for the ACOS code path.
   - `node <acos-path>/scripts/core/migration-analysis.mjs <target-project> --from=<current> --to=<target>`
   - This produces `.ssot/migration-analysis.json` — a read-only scan that does NOT mutate the project.
   - The scanner prints a summary line showing counts of renames, missing state files, semantic references, non-conformities, and projection gaps, then exits with code 0.
5. Read the generated `.ssot/migration-analysis.json` and review each section:
   - **`renames[]`**: entrypoints that will be renamed, with `customSections[]` identifying project-specific content not in the template.
   - **`missingStateFiles[]`**: state files absent from the project, with `proposedContent` from the template.
   - **`semanticReferences[]`**: references to renamed entrypoints found in `.ssot/` (inScope) and root files (outOfScope).
   - **`nonConformities[]`**: version mismatches, malformed JSON, invalid orders, duplicate IDs, and missing fields.
   - **`customRenumbering[]`**: proposed order changes for custom entrypoints that collide with template orders.
   - **`prefixClassification[]`** (spec 000): classification review of custom 13xx–14xx/1500+ entrypoints against the numbering conventions. The scanner generates mechanical findings: `reserved-slot-collision` (deterministic — order ∈ {1300, 1320, 1340, 1360, 1380, 1400, 1420, 1440}) or `conform` (default). Each entry may carry inline candidate signals: `candidateCoreMatches[]` (core 0xx-12xx entrypoints with the same slug) and `siblingSatellitesWithSlug[]` (sibling satellites in the same ecosystem sharing the slug). Entries with `reviewRequired: true` warrant agent review.
   - **`projectionGaps[]`** (spec 012): drift between the project's current SSOT state and the canonical template, independent of migration route. Six categories: `missingEntrypoints`, `staleEntrypoints` (order collisions), `orphanedSourceFiles`, `missingTargets`, `staleClientProjections`, and `staleGeneratedFiles`. Each gap entry has an unset `resolutionStrategy` — the agent sets it during the semantic review below.
6. Perform **Phase 0 semantic review** — refine the analysis artifact in place (`.ssot/migration-analysis.json` is the agent's workspace, not the project's SSOT):
   - For each `renames[].customSections[]`: set `preservationStrategy` to `append`, `replace`, or `merge` based on whether the custom content should be appended to the new template, replace the template content entirely, or be merged section-by-section.
   - For each `semanticReferences[]`: set `classification` to `update` (the reference should be updated to `newRef`), `preserve-verbatim` (the reference is in documentation that should not be changed), or `needs-human-judgment` (unclear — leave for the user).
   - For each `missingStateFiles[]`: refine `proposedContent` if the template default is not appropriate for the project's context.
   - For each `customRenumbering[]`: if a `semanticGrouping` order is more appropriate than the `collisionAvoidance` default, update `reason` to `semanticGrouping` and set `proposedOrder` to the desired value.
   - For each `prefixClassification[]` (spec 000): prioritize entries with `reviewRequired: true`. The scanner sets `finding: "reserved-slot-collision"` deterministically (order ∈ {1300, 1320, 1340, 1360, 1380, 1400, 1420, 1440} — set `proposedOrder` to a non-reserved 1500+ slot and `reason` documenting the renumber). For entries with `finding: "conform"` but inline candidates (`candidateCoreMatches[]` or `siblingSatellitesWithSlug[]`), review the entrypoint's function: if it duplicates a core entrypoint, set `finding: "reclassify-to-core"` with `reason`; if it's shared across satellites and should be declared at the container, set `finding: "reclassify-to-ecosystem"` with `proposedOrder` (a free 13xx–14xx slot), `proposedCategory: "ecosystem"`, and `reason`. If the entrypoint is genuinely project-specific, confirm `finding: "conform"`. Reference `docs/specs/000-numbering-conventions/spec.md`.
   - **Projection gap resolution** (spec 012): for each `projectionGaps` category, read the referenced entrypoint/file content and project context, then set `resolutionStrategy`:
     - `missingEntrypoints[]` → `"add"` (default expectation — the entrypoint is relevant to this project) or `"skip"` (not relevant — e.g. an ACP-only entrypoint on a project with no ACP surface).
     - `staleEntrypoints[]` → `"replace"` (the old entry is genuinely obsolete, e.g. `project.task` superseded by `project.route`) or `"preserve-custom"` (the project deliberately built custom content at that order; it will be renumbered to a free ≥600 slot by the engine, not deleted).
     - `orphanedSourceFiles[]` → `"remove"` (dead file — the engine deletes it) or `"preserve-custom"` (worth keeping; flagged for Phase 3 follow-up in `1240-migrate-refs`).
     - `missingTargets[]` → `"add"` or `"skip"`.
     - `staleClientProjections[]` / `staleGeneratedFiles[]` → `"update"` (adopt the template's value) or `"preserve-custom"` (keep the project's value as-is).
   - **Surface audit review** (July 2026 audit): review the project's projections against `clients.json` for the following gap types and flag any findings in the analysis artifact:
     - **Phantom surfaces**: a projection with `mode: "native"` for a surface the client does not actually read (e.g., `desktopOnly: true` surfaces used in a CLI-only context).
       Note: the Devin rules directory is no longer a phantom — Devin CLI reads rules files natively since v3000.x.
     - **Deprecated surfaces not marked legacy**: a projection output that is superseded but not flagged with `legacy: true` in `clients.json` (e.g., `.codex/skills/` without the legacy marker, `.kilocode/` paths without the legacy marker).
     - **Missing surfaces**: a surface documented in the client's official docs but absent from `clients.json` projections (e.g., a newly documented hook or plugin surface not yet declared).
     - **Desktop-only surfaces with native mode**: a projection with `desktopOnly: true` and `mode: "native"` that may mislead the agent into treating it as a CLI-enforced surface (e.g., `.windsurf/workflows/`).
     Set `resolutionStrategy` for each flagged gap: `"update"` (correct the projection metadata in `clients.json`), `"preserve-custom"` (the project intentionally uses the surface), or `"needs-human-judgment"` (unclear — defer to the user).
7. Resolve any `critical` non-conformities that block migration:
   - `malformedJson`: fix the JSON syntax before proceeding.
   - `versionMismatch`: reconcile the `ssotVersion` across all managed documents.
   - `duplicateId`: remove or rename the duplicate entrypoint.
8. **Gate 1 — Analysis completion**: Present a concise summary to the user:
   - number of renames with custom sections;
   - number of missing state files;
   - number of semantic references (inScope vs outOfScope);
   - number of non-conformities (critical vs warning);
   - number of custom renumbering proposals;
   - **prefix classification findings: N conform, N reclassify-to-core, N reclassify-to-ecosystem, N reserved-slot-collision.**
   - **projection gaps: N missing entrypoints, N stale, N orphaned files, N missing targets, N stale client projections, N stale generatedFiles.**
   - **surface audit: N phantom surfaces, N deprecated-not-legacy, N missing surfaces, N desktop-only-native.**
   Pause for explicit approval before proceeding to the detailed findings review.
9. **Gate 2 — Findings review**: Present the detailed findings as a **complete plan** (not per-item Q&A):
   - For each rename with custom sections: show the heading, line range, content hash, and **your decided** preservation strategy (with reasoning).
   - For each missing state file: show the proposed content and **your decision** on whether to customize it.
   - For each semantic reference: show the file, line, old reference, new reference, and **your decided** classification (with reasoning).
   - For each non-conformity: show the type, severity, file, description, and **your decided** fix approach. For `danglingSpecEngineBinding` specifically: if a `suggestedId` is present, the dangling `spec-engine.json` reference differs from a real `workflows.json` entrypoint id only by hyphenation — a known historical typo class (e.g. `delivery.data-model` vs the correct `delivery.datamodel`). Treat `suggestedId` as a strong candidate, not a confirmed fix — verify it is genuinely the same entrypoint (not two legitimately distinct ids that happen to differ by a hyphen) before applying it to `spec-engine.json`.
   - For each custom renumbering proposal: show the stable ID, current order, proposed order, and **your reasoning** for the chosen order.
   - **For each prefix classification finding**: show the stable ID, current order, current category, finding type, proposed order/category, and **your reasoning**.
   - **For each projection gap**: show the gap fields plus **your decided** `resolutionStrategy` (with reasoning).
   - **For each surface audit finding**: show the gap type, affected client and projection, and **your decided** `resolutionStrategy`.
   Present all findings as a single plan. The user reviews the complete plan and either approves
   or redirects specific items. **Do not ask per-item "confirm or adjust?" — present your
   decisions and let the user react to the complete picture.**
   Pause for explicit approval of all findings before proceeding.
10. Write the refined `.ssot/migration-analysis.json` back to disk with all semantic review decisions incorporated. This file will be consumed by the deterministic migration apply (`applyMigration`), the post-merge agent (`1240-migrate-refs`), and the verifier (`1160-migration-verify`).
11. **Gate 3 — Proceed to Phase 1**: Present what Phase 1 (agent prep) will do:
   - Create missing state files with the refined proposed content.
   - Snapshot custom content that will be affected by renames.
   - Resolve remaining critical non-conformities.
   Pause for explicit approval before Phase 1 begins.
12. After Gate 3 approval, the agent proceeds to Phase 1 (agent prep) as described in the hybrid workflow. Phase 1 is agent-driven and scoped to files identified in the analysis.
13. After Phase 1, the deterministic migration apply (Phase 2) runs `applyMigration` which consumes `.ssot/migration-analysis.json` for content preservation, renumbering, state file backfill, **and projection-gap resolution strategies** (spec 012 — `reconcileAgainstTemplate` honors each gap's `resolutionStrategy` when present, falling back to automatic behavior when absent).
14. After Phase 2, the post-merge agent (Phase 3, via `1240-migrate-refs`) updates semantic references, merges custom content, **follows up on preserve-custom projection gaps** using the analysis artifact, **and corrects semantic references related to invalidated/new surfaces** (July 2026 audit — see surface audit reference follow-up in `1240-migrate-refs`).
15. After Phase 3, verification (Phase 4, via `1160-migration-verify`) confirms the migration is complete — **running `verifyProjectionGaps` against the analysis artifact when `.ssot/migration-analysis.json` exists** (spec 012), or the legacy `.ssot.legacy/` backup comparison otherwise.
16. Record all durable decisions in the target project's `.ssot/decisions.md` and update `.ssot/status.md` and `.ssot/handoff.md`.

Never mutate the target project before explicit approval. The scanner is read-only. The agent's semantic review only modifies `.ssot/migration-analysis.json` (the analysis workspace), never the project's SSOT state files or entrypoints.

## Completion checklist

This entrypoint produces an analysis ONLY — it does NOT migrate the project. Before declaring
the analysis complete, verify:

- [ ] `migration-analysis.mjs` was run and `.ssot/migration-analysis.json` exists
- [ ] All `renames[].customSections[]` have a `preservationStrategy` set
- [ ] All `semanticReferences[]` have a `classification` set
- [ ] All `missingStateFiles[]` have reviewed `proposedContent`
- [ ] All `customRenumbering[]` have reviewed `proposedOrder`
- [ ] All `projectionGaps[]` have a `resolutionStrategy` set
- [ ] All `critical` non-conformities are resolved
- [ ] **If `--reconcile` mode**: dry-run report reviewed for `Template-removed entrypoints` (entries that will be DELETED) and `Stale template content` (frontmatter-only refresh, body preserved). Any legitimate custom in the template-removed list has been identified and its content snapshotted to `.acos/migrations/snapshots/`.
- [ ] Gate 1 summary presented to user with explicit approval

**This entrypoint does NOT run `acos-migrate --apply`, `acos --fix`, or any mutation.** If the
user wants to proceed with the migration after analysis, route to `1140-migrate-workflow` (full
hybrid workflow) or run `acos-migrate --apply` + `acos --fix` + `acos --check` manually.

## Ecosystem analysis

If the project is a **container** (`ecosystemRole: "container"` with `ecosystemChildren`), the analysis includes:

- **`ecosystemVersionDrift[]`**: for each satellite whose `ssotVersion` differs from the container's version, the scanner reports the satellite path, its version, the container version, and a status (`drift`, `missing`, or `unreadable`). Review these findings before migrating — satellites at a different version may need individual attention.
- **Batch migration**: after analysis, use `acos-migrate --root <container-root> --ecosystem --apply` to migrate all projects. The analysis artifact is per-project — each satellite gets its own `.ssot/migration-analysis.json` when analyzed individually.
- **acosSource**: if the container declares `acosSource`, satellites without their own will inherit it during `acos --fix`. Verify that all satellites can access the ACOS code path before migrating.
