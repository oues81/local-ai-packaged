---
description: Orchestrate the full 5-phase hybrid migration workflow — analysis, agent prep, deterministic apply, post-merge agent, verify — with human gates between each phase
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Treat the user's accompanying text as the migration objective. Minimize questions.

## ⚠️ Autonomy directive — READ BEFORE PROCEEDING

You are an autonomous agent performing a full migration workflow. **You decide, you don't ask.**

- **DO**: Read the codebase, analyze legacy files, compare with template, and make informed
  decisions about preservation strategies, classifications, renumbering, duplicate resolution,
  and gap resolutions. You have the full project context — use it.
- **DO**: Resolve duplicates by choosing the best version. Convert legacy content to canonical
  format. Merge complementary content. Decide preservation strategies based on content analysis.
  These are your decisions, not the user's.
- **DO NOT**: Ask the user to "confirm or adjust each strategy" or "confirm or override each
  classification". That is your job. Make the decision and present it with reasoning.
- **DO NOT**: Ask per-item questions during gates. Gates are **approval checkpoints for the
  complete plan**, not Q&A sessions. Present what you've decided as a coherent plan, the user
  approves or redirects, you proceed.
- **ASK THE USER ONLY**: When you have exhausted all analysis avenues and genuinely cannot
  determine the right course of action (e.g. two equally-valid business decisions that only
  the project owner can resolve). This should be rare.

The hybrid method means: deterministic engine handles mechanics, YOU handle semantics.
Duplicates, conversions, content merges, preservation strategies — that's the agent part.
Do it autonomously.

This entrypoint orchestrates the full **5-phase hybrid migration workflow** (REQ-068–070). Each
phase is separated by a human gate: the agent presents a summary of what was done and what the next
phase will do, then pauses for explicit approval before proceeding (REQ-069). The workflow may be
aborted at any phase with the project left in a consistent state — the backup and journal written
during Phase 2 enable rollback.

> **Routing note**: `0020-resume` already routes to `1120-migrate-analyze` for the standalone analysis
> step. This entrypoint (`1140-migrate-workflow` / `migration.workflow`) is invoked when the user
> wants the full orchestrated workflow rather than just the analysis. Both entrypoints coexist:
> `1120-migrate-analyze` produces the analysis artifact and stops; this entrypoint drives the analysis
> through to verification.

1. Identify the target project root from the user's request. If not provided, use the current directory.
2. Verify the target project exists, is accessible, and is ACOS-initialized (`.ssot/agents/` must exist). If it is not initialized, stop and apply `project.migrate` / `1100-migrate` instead.
3. **⚠️ CRITICAL — Verify the installed ACOS code is up to date.** The migration engine runs from the ACOS code in `node_modules/@acos/core` (npm) or `acosSource.path` (local-checkout). If this code is stale, the migration uses old logic and will fail or produce incorrect results. Before proceeding:
   - Read `.ssot/agents/clients.json` → `acosSource`. If `type: "npm"`, run `npm install --save-dev git+https://github.com/oues81/acos.git#main` to update. If `type: "local-checkout"`, verify the source repo is at the latest commit (`git -C <path> pull`) and that `node -e "console.log(require('<path>/scripts/core/ssot-migrations.mjs').CURRENT_SSOT_VERSION)"` matches the target version.
   - **Never run `acos-migrate --apply` with stale ACOS code.** Changing the version number in `package.json` or `clients.json` does NOT update the code — the actual scripts, schemas, and templates must be replaced.
   - If the user provides an ACOS source path, use that path to verify the version. Do not assume `node_modules` is current.
4. Determine the project's current `ssotVersion` by reading `.ssot/agents/workflows.json` (or `clients.json`). Determine the target version from the ACOS code's `CURRENT_SSOT_VERSION`. If the project is already at the target version, stop and report that no migration is pending.

## Pre-migration warnings

- **Do NOT run `acos --bump-ssot-version` before migration.** This command only bumps the
  `ssotVersion` field in every version-bearing file — it does not perform the structural
  migration (entrypoint renames, additions, state-file backfill, projection regeneration).
  Running it first makes the migration engine believe the project is already at the target
  version, so `acos-migrate` reports `routes: []` and Phase 2 has nothing to apply. The
  version bump is handled automatically by `acos-migrate --apply` as part of the route.
  `--bump-ssot-version` is a recovery tool for reconciling an already-inconsistent project
  (see below), not a substitute for the migration itself.
- **`acos-migrate` without `--apply` is always a dry-run.** It produces a JSON plan on
  stdout, ending with `(dry-run — pass --apply to execute the migration)`, and does not
  modify the project. Phase 2 below always passes `--apply` explicitly — never assume a
  plan-only invocation has changed anything.
- **Missing state files are backfilled automatically by `acos-migrate --apply`.** You do
  not need to manually create files like `spec-engine.json`, `adapter-publication.json`,
  `knowledge-profile.json`, or the seed-manifest before migration — the migration engine
  creates every entirely-missing version-bearing file from the template, at the route's
  target version, as part of the apply. `context-index.json` is the one exception: it is
  always regenerated from live project state by `acos --fix`, never backfilled from a
  static template snapshot.
- **Recovering from an inconsistent project** (e.g. after a partial `--bump-ssot-version`,
  or manual edits that left version-bearing files disagreeing): `acos-migrate` will refuse
  with "Inconsistent ssotVersion across managed documents" and name the offending files. Run
  `npx acos --bump-ssot-version` with no argument (it defaults to the current ACOS build's
  version) to align every version-bearing file to one consistent version, then retry. This
  reconciles versions only — it still does not run the structural migration.
- **A dangling `spec-engine.json` binding blocks `acos --fix` hard.** If Phase 0's analysis
  reports a `danglingSpecEngineBinding` non-conformity, it will include a `suggestedId` when
  the dangling reference differs from a real `workflows.json` entrypoint id only by
  hyphenation (a known historical typo class, e.g. `delivery.data-model` vs the correct
  `delivery.datamodel`) — treat that as a strong candidate during semantic review, not an
  automatic fix; confirm it is actually the same entrypoint before applying it.
- **Pre-apply validation prerequisites (Directive 10).** `acos-migrate --apply` runs
  `assertUnmarkedDestinations` (ssot-migrations.mjs) before mutating anything. It refuses
  to overwrite a managed generated destination (`.ssot/context-index.md`,
  `.ssot/context-index.json`) that lacks the ACOS generated marker
  (`<!-- Generated by ACOS. DO NOT EDIT. -->` for markdown, `_acosGenerated: true` for
  JSON). If the project has a hand-maintained `context-index.md` without the marker, add
  the marker (or back up the content and let `acos --fix` regenerate it) before Phase 2.
  Additionally, `sync-clients.mjs` validation (invoked during projection regeneration
  after apply) blocks on: missing `BASE_CLIENTS` in `clients.json` (claude, cursor,
  devin, kilocode, opencode, codex, eve), missing `ssotVersion` in any
  `VERSION_BEARING_FILES` that exists, and missing projection targets per client in
  `workflows.json`. The Phase 0 scanner now surfaces these as `missingClient`,
  `missingVersionField`, and `missingProjectionTarget` non-conformities — resolve them
  in Phase 1 prep, not by retrying apply.
- **Re-scanning preserves semantic review (Directive 1).** The scanner merges the
  existing `.ssot/migration-analysis.json` review fields (resolutionStrategy,
  classification, acceptSuggestedId, skipBackfill, customRenumbering.proposedOrder) into
  the fresh structural analysis on every run. Re-running the scanner in Phase 1 step 5
  does NOT discard Phase 0 semantic decisions — it refreshes the structural data
  (renames, missingStateFiles, nonConformities) while preserving the review decisions.

## Phase 0: Pre-migration analysis (agent-driven, read-only)

Phase 0 delegates to `1120-migrate-analyze` (`migration.analyze`) for the detailed analysis procedure
rather than duplicating it. The analysis is **read-only** — the scanner never mutates the project.

> **Alternative: Reconciliation mode.** If the project's `ssotVersion` was bumped without
> running the structural migration (e.g. via `acos --bump-ssot-version`), use `--reconcile`
> instead of version-based migration:
> - `acos-migrate --root . --reconcile` (dry-run plan)
> - `acos-migrate --root . --reconcile --apply` (execute)
> - This detects missing entrypoints, stale template content (template-sourced files that
>   have drifted from the template), orphaned customs, and target drift — independent of
>   version. See `1100-migrate.md` → "Reconciliation mode" for details.

1. Run the deterministic pre-migration analysis scanner:
   - Resolve the ACOS code path: read `.ssot/agents/clients.json` → `acosSource`. If `type: "npm"`, use `<project-root>/node_modules/@acos/core`. If `type: "local-checkout"`, resolve `acosSource.path` relative to the project root. If `acosSource` is absent or the path is invalid, ask the user for the ACOS code path.
   - `node <acos-path>/scripts/core/migration-analysis.mjs . --from=<current> --to=<target>`
   - This produces `.ssot/migration-analysis.json` — a read-only scan that does NOT mutate the project.
2. Read the generated `.ssot/migration-analysis.json` and review each section:
   - `renames[]` — entrypoints that will be renamed, with `customSections[]` identifying project-specific content not in the template.
   - `missingStateFiles[]` — state files absent from the project, with `proposedContent` from the template.
   - `semanticReferences[]` — references to renamed entrypoints found in `.ssot/` (inScope) and root files (outOfScope).
   - `nonConformities[]` — version mismatches, malformed JSON, invalid orders, duplicate IDs, and missing fields.
   - `customRenumbering[]` — proposed order changes for custom entrypoints that collide with template orders.
   - `prefixClassification[]` (spec 000) — classification review of custom 13xx–14xx/1500+ entrypoints. The scanner sets `reserved-slot-collision` deterministically (order ∈ {1300, 1320, 1340, 1360, 1380, 1400, 1420, 1440}) or `conform` (default). Entries with `reviewRequired: true` carry inline candidate signals (`candidateCoreMatches[]`, `siblingSatellitesWithSlug[]`) that warrant agent review.
   - `projectionGaps[]` (spec 012) — drift between the project's current SSOT state and the canonical template, independent of migration route. Six categories: `missingEntrypoints`, `staleEntrypoints`, `orphanedSourceFiles`, `missingTargets`, `staleClientProjections`, `staleGeneratedFiles`. Each gap's `resolutionStrategy` is unset — the agent fills it in during semantic review.
3. Perform **semantic review** — refine the analysis artifact in place (`.ssot/migration-analysis.json` is the agent's workspace, not the project's SSOT):
   - For each `renames[].customSections[]`: set `preservationStrategy` to `append`, `replace`, or `merge` based on whether the custom content should be appended to the new template, replace the template content entirely, or be merged section-by-section.
   - For each `semanticReferences[]`: set `classification` to `update`, `preserve-verbatim`, or `needs-human-judgment`.
   - For each `missingStateFiles[]`: refine `proposedContent` if the template default is not appropriate for the project's context.
   - For each `customRenumbering[]`: if a `semanticGrouping` order is more appropriate than the `collisionAvoidance` default, update `reason` to `semanticGrouping` and set `proposedOrder` to the desired value.
   - For each `prefixClassification[]` (spec 000): prioritize entries with `reviewRequired: true`. For `reserved-slot-collision`, set `proposedOrder` to a non-reserved 1500+ slot. For `conform` entries with `candidateCoreMatches[]` or `siblingSatellitesWithSlug[]`, review the entrypoint's function and set `finding` to `reclassify-to-core` (duplicates a core entrypoint) or `reclassify-to-ecosystem` (shared across satellites, should be 13xx–14xx at the container) with `proposedOrder`, `proposedCategory`, and `reason`. Confirm `conform` for genuinely project-specific entrypoints. Reference `docs/specs/000-numbering-conventions/spec.md`.
   - **Projection gap resolution** (spec 012): for each `projectionGaps` category, set `resolutionStrategy`:
     - `missingEntrypoints[]` → `"add"` or `"skip"`.
     - `staleEntrypoints[]` → `"replace"`, `"preserve-custom"`, or `"renumber"` (Directive 4).
       - `"replace"` — the old stableId is gone entirely (replaced by a new entrypoint); the engine deletes it.
       - `"preserve-custom"` — the old stableId survives but moves to a custom order ≥600 (kept as a project-specific entrypoint).
       - `"renumber"` — the stableId survives at a new template order/source (cascade shift, e.g. a template entrypoint moving from order 160 to 175). The scanner sets this automatically when the stableId exists in the project but at a different order than the template; the verifier checks it exists at `expectedOrder`/`expectedSource`. Do NOT change a `"renumber"` to `"replace"` — that would delete an entrypoint that should survive.
       - The `staleEntrypointGap` schema uses `currentId`/`currentOrder`/`currentSource` for the occupant and `replacedByStableId`/`replacedByOrder`/`replacedBySource` for the replacement. For `"renumber"`, `currentId === replacedByStableId` (same stableId, different order) and `expectedOrder`/`expectedSource` carry the target state.
     - `orphanedSourceFiles[]` → `"remove"` or `"preserve-custom"` (flagged for Phase 3 follow-up).
     - `missingTargets[]` → `"add"` or `"skip"`.
     - `staleClientProjections[]` / `staleGeneratedFiles[]` → `"update"` or `"preserve-custom"`.
4. Write the refined `.ssot/migration-analysis.json` back to disk with all semantic review decisions incorporated. This file flows through every subsequent phase.
5. **Gate 1 — Analysis completion**: Present a concise findings summary to the user:
   - number of renames with custom sections;
   - number of missing state files;
   - number of semantic references (inScope vs outOfScope);
   - number of non-conformities (critical vs warning);
   - number of custom renumbering proposals;
   - **prefix classification findings: N conform, N reclassify-to-core, N reclassify-to-ecosystem, N reserved-slot-collision.**
   - **projection gaps: N missing entrypoints, N stale, N orphaned files, N missing targets, N stale client projections, N stale generatedFiles.**
   Pause for explicit approval before proceeding to Phase 1. Do not proceed past Gate 1 without approval.

## Phase 1: Agent prep (agent-driven, scoped to analysis findings)

Phase 1 prepares the project for the deterministic apply. The agent's write authority is scoped to
files identified in the analysis — no unrelated modifications. The agent **never mutates the project
before Gate 1 approval** (REQ-069).

1. Read `.ssot/migration-analysis.json` (the refined artifact from Phase 0).
2. For each `missingStateFiles[]` entry: create the file at `path` with the refined `proposedContent`. The agent may refine the content further based on project context (client setup, hook requirements, runtime declarations) — the template default is a starting point, not a mandate. Creating a `hooks.json`, for example, requires understanding the project's actual client setup, not a generic template default.
3. For each `renames[].customSections[]`: copy the custom section content to `.acos/migrations/snapshots/<stableId>-<heading-slug>.md` for rollback safety. This snapshot preserves the exact pre-migration content so it can be restored if the deterministic apply or post-merge merge goes wrong.
4. For each `nonConformities[]` where `severity === "critical"`: apply the `proposedFix`:
   - `versionMismatch` → update `ssotVersion` across all managed documents to a consistent value.
   - `malformedJson` → fix the JSON syntax (parse error, trailing comma, missing bracket).
   - `duplicateId` → resolve the conflict (remove or rename the duplicate entrypoint).
   - `missingClient` (Directive 2) → add the missing `BASE_CLIENTS` entry to `clients.json` from the ACOS template (`templates/ssot/.ssot/agents/clients.json`). The required clients are: claude, cursor, devin, kilocode, opencode, codex, eve.
   - `missingVersionField` (Directive 2) → add `ssotVersion` to the file (current version: the project's `fromVersion`).
   - `missingProjectionTarget` (Directive 2) → add a projection target for the missing client in `workflows.json` from the ACOS template.
   Leave `warning`-severity non-conformities for the deterministic apply or human review — they do not block migration.
5. Re-run the scanner to confirm prep resolved the issues:
   - `node scripts/core/migration-analysis.mjs . --from=<current> --to=<target>`
   - The scanner merges existing semantic review fields into the fresh structural analysis (Directive 1) — Phase 0 decisions are preserved. The updated analysis should show fewer missing files and critical non-conformities. If critical non-conformities remain, **fix them yourself** (malformed JSON → fix syntax, versionMismatch → reconcile, duplicateId → resolve by keeping the correct one). Only surface to the user if a non-conformity requires a business decision you genuinely cannot make.
6. **Gate 2 — Prep completion**: Present to the user:
   - files created (path + one-line description of content);
   - snapshots written (stable ID + heading slug + snapshot path);
   - critical non-conformities resolved (type + file + fix applied);
   - remaining issues (if any) and why they were not auto-resolved.
   Pause for explicit approval before proceeding to Phase 2. Do not proceed past Gate 2 without approval.

## Phase 2: Deterministic apply (delegates to acos-migrate --apply)

Phase 2 is the deterministic structural migration. It consumes `migration-analysis.json` automatically
for content preservation, renumbering, state file backfill, **and projection-gap resolution strategies**
(spec 012 — `reconcileAgainstTemplate` honors each gap's `resolutionStrategy` when present, falling back
to automatic behavior when absent; no separate command is needed since `acos-migrate --apply` already
loads `.ssot/migration-analysis.json` and passes it through).

### Non-destructive reconcile rules (Bug 9/10 safeguards)

The hybrid method is **non-destructive by design**. The deterministic engine handles mechanics, but
the agent is responsible for ensuring no custom content is lost. These rules apply to both
`--apply` (migration) and `--reconcile --apply` (reconciliation) paths:

1. **templateRemoved entries**: The dry-run report lists entrypoints that were once in the ACOS
   template but have been removed (e.g. `project.task`, `session.knowledge*`). The engine uses an
   explicit `REMOVED_TEMPLATE_IDS` registry — not a heuristic — so false positives are impossible.
   However, before approving `--apply`, the agent MUST:
   - Review each `templateRemoved` entry in the dry-run report.
   - If an entry is a legitimate custom (not in `REMOVED_TEMPLATE_IDS`), add its ID to the preserve
     list before applying. The engine will renumber it to 1500+ instead of deleting it.
   - If an entry IS in `REMOVED_TEMPLATE_IDS` but the project has custom content in its file that
     should be preserved, extract the custom content to a snapshot under
     `.acos/migrations/snapshots/` before applying. After apply, re-integrate the custom content
     into the appropriate replacement entrypoint (e.g. `project.task` content → `project.route`).

2. **staleTemplateContent refresh**: The engine refreshes only the **frontmatter description**
   (template-owned) and preserves the **body** (which may contain project-specific customizations).
   This is a frontmatter-only refresh, NOT a full-file overwrite. The agent should:
   - Review the dry-run report's `staleTemplateContent` section.
   - If a file's body contains custom sections that would be lost by a full overwrite (pre-Bug 10
     behavior), rest assured: the current engine only touches the frontmatter description.
   - If the frontmatter description has been intentionally customized in the project, extract it
     to a snapshot before applying, then re-apply the customization after the refresh.

3. **Pre-apply content audit (mandatory for reconcile)**: Before running `--reconcile --apply`,
   the agent MUST compare each `staleTemplateContent` file with its template counterpart and
   classify each as:
   - **template-stale**: the file matches an old template version (no custom content) → safe to
     refresh frontmatter.
   - **custom-content**: the file has project-specific sections in the body → frontmatter refresh
     is safe, body is preserved. No action needed beyond the dry-run review.
   - **mixed**: the file has both template-stale frontmatter AND custom body content → frontmatter
     refresh is safe, body is preserved. Document the custom sections in the analysis artifact.

4. **Dry-run is mandatory**: Never run `--apply` or `--reconcile --apply` without first reviewing
   the dry-run report. The report shows:
   - `Template-removed entrypoints` — entries that will be DELETED (with ⚠ warning).
   - `Stale template content` — entries whose frontmatter will be refreshed (body preserved).
   - `Orphans` — custom entrypoints that will be preserved (never deleted).

1. Run the deterministic apply:
   - `npx acos-migrate --root . --apply`
   - This writes a content-complete backup under `.acos/migrations/` (with before/after SHA-256 hashes) and then performs the route: renames entrypoint files, updates `workflows.json`, `clients.json`, `dependencies.json`, and other SSOT-bearing documents, adds new canonical files, and applies custom renumbering per the analysis. A partial apply attempts to restore already-written files from the in-memory pre-migration state.
2. Regenerate projections from the migrated SSOT:
   - `npx acos --fix`
   - This writes the projected client files (`.claude/`, `.cursor/`, `.kilo/`, etc.) to match the new SSOT state.
3. **Gate 3 — Apply completion**: Present the migration summary to the user:
   - renames performed (old prefix → new prefix, stable ID);
   - additions (new canonical files added);
   - renumbering (custom entrypoints moved, old order → new order, reason);
   - version bump (old `ssotVersion` → new `ssotVersion`);
   - backup location (`.acos/migrations/<timestamp>/`);
   - **projection gaps resolved (N added, N skipped, N preserved-custom, N updated, N removed)** — summary of the `resolutions` returned by `reconcileAgainstTemplate`.
   Pause for explicit approval before proceeding to Phase 3. Do not proceed past Gate 3 without approval.

## Phase 3: Post-merge agent (delegates to 1240-migrate-refs, extended)

Phase 3 is the agent-assisted post-merge phase. It extends `1240-migrate-refs` (DD-012): the reference
update logic is reused, then custom content merging, routing validation, and semantic coherence
flagging are added. `1240-migrate-refs` remains available standalone for users who need only semantic
reference updates without the full hybrid workflow.

1. Merge custom content into renamed files using the `preservationStrategy` from `migration-analysis.json` (REQ-070a):
   - `append` — add the custom section after the corresponding template section in the renamed file.
   - `replace` — replace the template section content with the custom content entirely.
   - `merge` — merge section-by-section, preserving both template and custom content where they do not overlap.
   Use the snapshots from `.acos/migrations/snapshots/` as the source of truth for the original custom content.
2. Update semantic references using the reference map from the analysis (REQ-070b):
   - For each `semanticReferences[]` with `classification === "update"`: apply the rename (old reference → new reference).
   - For each with `classification === "preserve-verbatim"`: skip it — do not "correct" historical or explanatory references.
   - For each with `classification === "needs-human-judgment"`: present it to the user with surrounding context and ask how to proceed before making any change.
   Out-of-scope writes (root docs, `docs/`) require explicit human approval before finalizing, because they are outside the entrypoint's default write authority.
3. Validate routing logic (REQ-070c): check that custom entrypoints' routing logic still works with the new orders and IDs. Verify `dependencies.json`, `workflows.json` routing, and any custom dispatch logic references the correct post-migration stable IDs and prefixes.
4. Flag semantic incoherence (REQ-070d): if any custom content, reference, or routing logic is semantically inconsistent with the post-migration state (e.g. a custom entrypoint that depended on a renamed entrypoint's old prefix, or a merge that produced contradictory instructions), flag it for human review. Do not silently "fix" semantic incoherence — surface it.
5. **Projection gap follow-up** (spec 012): review the `preserve-custom` outcomes from Phase 2:
   - For each `orphanedSourceFiles[]` with `resolutionStrategy === "preserve-custom"`: present it to the operator. If they want it kept as a registered entrypoint (not just a surviving file), add a `workflows.json` entry at the next free order ≥600 — this is an explicit, human-approved out-of-scope write, the same authority pattern used for `outOfScope` semantic references.
   - For each `staleEntrypoints[]` with `resolutionStrategy === "preserve-custom"`: confirm the renumbered order (applied deterministically in Phase 2) still makes semantic sense in context; flag if not.
6. Run the post-agent diff check (FM-020): compare agent modifications against the analysis scope to verify the agent did not over-reach. Every modified line must correspond to a custom section or semantic reference in the analysis. Out-of-scope changes are flagged for human review.
   - `npx acos-migrate --root . --check-agent-diff <before-dir>`
7. **Regenerate projections after post-merge modifications**: Phase 3 modified canonical sources
   under `.ssot/` (custom content merges, semantic reference updates). These changes make the
   existing client projections stale. Run `npx --no-install acos --fix` to regenerate projections
   from the post-merge SSOT state. Then run `npx --no-install acos --check` to confirm no drift
   remains. If drift is found, re-run `acos --fix` and investigate if the agent introduced
   structural changes outside the analysis scope.
8. **Gate 4 — Post-merge completion**: Present to the user:
   - merged content (file + preservation strategy applied + section heading);
   - updated references (file + old ref → new ref + classification);
   - routing validation result (pass / issues found);
   - semantic incoherence flags (if any — each with file, description, and recommended action);
   - **projection gap follow-up (N preserved-custom orphans re-registered, N left unregistered, N stale entrypoints renumbered)**;
   - post-agent diff check result (in-scope modifications confirmed / out-of-scope flags).
   Pause for explicit approval before proceeding to Phase 4. Do not proceed past Gate 4 without approval.

## Phase 4: Verify (deterministic)

Phase 4 is deterministic verification. It confirms the migration is complete and the project is in a
consistent state.

1. Run `npx acos --check` — reports projection drift. The output must be clean (no drift). If drift
   is found, run `npx --no-install acos --fix` to regenerate projections, then re-run `acos --check`.
   If drift persists after `acos --fix`, the migration is not complete — investigate which canonical
   source is out of sync with its projections.
2. Run `npx acos --validate` — validates all schemas and invariants. Must pass. Schema or invariant failures indicate the migrated SSOT is malformed.
3. Run the project's test suite. Detect the command based on the project's tooling:
   - `npm test` (Node.js / package.json with a `test` script);
   - `pytest` (Python / `pytest.ini`, `setup.cfg`, or `pyproject.toml`);
   - `cargo test` (Rust / `Cargo.toml`);
   - `go test ./...` (Go / `go.mod`);
   - other — detect from the project's config files (package.json, pyproject.toml, Cargo.toml, go.mod, etc.). Only ask the user if no config file reveals the stack.
   If no test suite exists, mark this check as N/A.
4. Run `1160-migration-verify` (`project.migrate.verify`) — the mode is conditional on which verification artifact is present (spec 012):
   - If `.ssot/migration-analysis.json` exists **and** it has a `projectionGaps` section with any `resolutionStrategy` set → run the analysis-driven check: `node <acos-path>/scripts/audit/migration-verify.mjs --root . --analysis .ssot/migration-analysis.json`. This runs `verifyProjectionGaps`, which asserts the project's on-disk/JSON state matches what each gap's `resolutionStrategy` implies. It does **not** require `.ssot.legacy/` to exist.
   - Else if `.ssot.legacy/` exists (the initial-adoption path) → run the existing legacy-backup comparison: `node <acos-path>/scripts/audit/migration-verify.mjs --root .`. This compares the current state against the legacy backup.
   - Else → report "no verification artifact available" and mark this check as N/A.
   This confirms all managed client directories are consistent with the post-migration SSOT and no orphaned or missing projections remain.
5. Compile a pass/fail report:
   - Projection drift (`acos --check`): PASS / FAIL
   - Schema validation (`acos --validate`): PASS / FAIL
   - Test suite: PASS / FAIL / N/A
   - Migration verify (`1160-migration-verify`): PASS / FAIL
6. **Gate 5 — Final verification**: Present the verify report to the user. Pause for approval:
   - If all checks PASS, the migration is complete. With the user's approval, record the outcome in `.ssot/decisions.md`, update `.ssot/status.md` and `.ssot/handoff.md`, and report completion.
   - If any check FAILS, surface the failure with details and do **not** mark the migration as complete. Do not proceed past Gate 5 without explicit user override. Offer rollback (`acos-migrate --rollback <backup-path>`) if the failure is unrecoverable.

## Constraints (REQ-069)

- Every gate pauses for explicit user approval before proceeding. The agent never auto-advances.
- The agent never mutates the project before Gate 1 approval (Phase 0 is read-only).
- The agent never proceeds past a failed gate without explicit user override.
- If any phase fails, the agent stops and surfaces the error. It does not attempt to continue to the next phase.
- The workflow may be aborted at any phase. The project is left in a consistent state: Phase 2 writes a backup and journal that enable `acos-migrate --rollback`; Phase 1 snapshots enable custom content restoration; Phase 0 produced only a read-only artifact.

## Rollback per phase

Each phase has its own rollback path:

- **Phase 0** — delete `.ssot/migration-analysis.json`. No project mutation occurred.
- **Phase 1** — delete the created state files and restore any snapshots from `.acos/migrations/snapshots/`. Revert any critical non-conformity fixes via git.
- **Phase 2** — `npx acos-migrate --root . --rollback <backup-path>` (the backup path is under `.acos/migrations/`, written during `--apply`). Then re-run `acos --fix` and `acos --check`.
- **Phase 3** — `git revert` the post-merge commits. The snapshots in `.acos/migrations/snapshots/` preserve the original custom content if a merge needs to be undone.
- **Phase 4** — N/A. Verification is read-only; there is nothing to roll back. If verification fails, roll back the phase that introduced the problem (typically Phase 2 or 3).

## Completion

After Gate 5 approval with all checks passing:

1. Record all durable decisions in the target project's `.ssot/decisions.md` (migration route, preservation strategies applied, reference classifications, renumbering decisions, verify outcome).
2. Update `.ssot/status.md` with the new `ssotVersion` and migration completion status.
3. Update `.ssot/handoff.md` with the next recommended action.
4. Report completion to the user.

Never mutate the target project before explicit approval. Never proceed past a failed gate without explicit user override. Never auto-advance between phases.

## Ecosystem migration

If the project is a **container** (`ecosystemRole: "container"` with `ecosystemChildren`), the workflow extends to cover all satellites:

### Phase 0 (additional): ecosystem version audit

Before starting the single-project workflow, check `ecosystemVersionDrift[]` in the analysis artifact. If any satellites are at a different version:
- Surface the drift to the user: "N satellite(s) are at a different version than the container. Use `acos-migrate --root . --ecosystem` to migrate all projects atomically."
- If the user chooses batch migration, use `--ecosystem` which migrates the container first, then each satellite in sequence.

### Batch mode

When running `acos-migrate --root <container-root> --ecosystem --apply`:
1. The container is migrated first (full workflow: analysis → apply → verify).
2. Each satellite is migrated in sequence (same apply logic, individually).
3. If a satellite fails, remaining satellites are still attempted (best-effort).
4. A summary report is printed with per-project status (migrated/planned/failed/skipped).

**acosSource propagation**: satellites without their own `acosSource` inherit it from the container during `acos --fix` (via `resolveEcosystemInheritance`). No manual configuration needed on each satellite.

## Completion checklist (MANDATORY)

Before declaring the migration complete, verify each item. **You must show the output of each
command to the user — do not claim a step is done without proof.**

- [ ] **ACOS code updated** — `CURRENT_SSOT_VERSION` matches target (show output of version check)
- [ ] **Phase 0 analysis** — `.ssot/migration-analysis.json` exists with all review fields set
- [ ] **Gate 1 passed** — user explicitly approved the analysis
- [ ] **Phase 2 apply** — `acos-migrate --apply` was run (show output, NOT just `--bump-ssot-version`)
- [ ] **Gate 2 passed** — user explicitly approved the apply result
- [ ] **Phase 2b projections** — `acos --fix` was run (show output)
- [ ] **Phase 2c check** — `acos --check` was run (show output, no drift)
- [ ] **Phase 3 refs** — `1240-migrate-refs` was dispatched (or user explicitly skipped)
- [ ] **Phase 4 verify** — `1160-migration-verify` was run (show output, PASS)
- [ ] **Final verification** — `migration-step-verify.mjs` run and reports PASS (show output)
- [ ] **Gate 4 passed** — user explicitly approved the final state
- [ ] `.ssot/decisions.md` updated with migration decision
- [ ] `.ssot/status.md` updated with new version
- [ ] `.ssot/handoff.md` updated with next action

If any item is unchecked, the migration is NOT complete. Do not tell the user it is.

### Proof-of-work

For each command above, you MUST include the actual terminal output in your response. Saying
"the command passed" without showing the output is not acceptable. The user must be able to
verify that:
1. The command was actually run (not just claimed)
2. The output confirms success (not just "no error")
3. The version numbers match (not just "updated")
