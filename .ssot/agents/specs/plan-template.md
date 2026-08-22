# {{feature_id}} — Implementation Plan

## Feature ID

`{{feature_id}}`

## Status

- **Spec phase**: clarify | plan | implement | verify | converge
- **Last updated**: YYYY-MM-DD
- **Owner**: (optional)

## Summary

{One-paragraph summary of the implementation approach, grounded in the spec and repository evidence.}

## Phases

1. **Phase 1 — {Name}**
   - Goal: {what this phase produces}
   - Affected surfaces: {files, modules, clients}
   - Completion evidence: {commit, test, artifact}
   - Rollback: {how to undo safely}
2. **Phase 2 — {Name}**
   - Goal: ...
   - Affected surfaces: ...
   - Completion evidence: ...
   - Rollback: ...

## Parallelization strategy

- **Wave type**: {fix | diagnose | validate | ship}
- **Lane grouping**: {by-domain | by-file-ownership | manual}
- **Max lanes**: {N}
- **Parallelizable phases**: {which phases can run in parallel}
- **Lane assignment**: {which tasks go to which lane}
- **Notes**: {dependencies, sequencing, special considerations}

## Milestones

| Milestone | Definition | Exit criteria |
|-----------|------------|---------------|
| M1 | {Name} | {Verifiable condition} |
| M2 | {Name} | {Verifiable condition} |

## Stack choices

- {Language, framework, library, or pattern} — chosen because {reason}.
- {Explicitly rejected alternative} — rejected because {reason}.

## Risks

| ID | Risk | Impact | Mitigation | Owner |
|----|------|--------|------------|-------|
| R1 | {Risk} | high/medium/low | {Mitigation} | {Owner} |

## Verification

- {Test command or check that proves the plan is complete.}
- {ACOS integrity check, e.g. `npx --no-install acos --check`.}

## Rollback / compatibility

- {How to revert if the feature is wrong or needs disabling.}
- {Breaking-change and migration considerations.}

## Dependencies

- {Cross-references to `{{feature_id}}/spec.md` and `{{feature_id}}/data-model.md`.}
