# ecosystem-integration — Tasks

## Feature ID

`ecosystem-integration`

## Status

- **Spec phase**: tasks
- **Last updated**: 2026-08-31

## Overview

This task list implements the lifecycle artifacts for the ecosystem-integration spec of
local-ai-packaged. Wave 3 (this lane, C11) creates SPECS ONLY — it does NOT modify
`docker-compose.yml`. The fix tasks (T1, T2) are documented for execution in a subsequent fix wave.

**FR-017**: ✅ COMPLIANT (all required services present and consumed).
**D-CYCLE-004**: ❌ NON-COMPLIANT — 4 services without mem_limit, 2 services with `restart: always`
in the base `docker-compose.yml`.

## Task list

Each task below uses structured fields (`Files`, `Domain`, `Parallelizable`, `Lane`) that enable
mechanical wave planning via `acos-wave-plan`. Populate them so the wave-config generator can group
tasks into non-overlapping parallel lanes without guessing.

- [x] **EI-T001** — Audit FR-017: verify all required services (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy) are present and consumed in `docker-compose.yml`.
  - Depends on: none
  - Estimate: 10 min
  - Owner: (unassigned)
  - Acceptance: All 6 required services present in `docker-compose.yml`; boundary contracts in spec.md match.
  - Files: `docker-compose.yml`
  - Domain: tests
  - Parallelizable: true
  - Lane: C11

- [x] **EI-T002** — Audit D-CYCLE-004: identify services without mem_limit and services with `restart: always` in the base `docker-compose.yml`.
  - Depends on: none
  - Estimate: 10 min
  - Owner: (unassigned)
  - Acceptance: 4 services without mem_limit identified (ollama-gpu, ollama-pull-llama-cpu, ollama-pull-llama-gpu, ollama-pull-llama-gpu-amd); 2 services with `restart: always` identified (neo4j L298, langfuse-web L397).
  - Files: `docker-compose.yml`
  - Domain: tests
  - Parallelizable: true
  - Lane: C11

- [x] **EI-T003** — Create `specs/ecosystem-integration/plan.md` citing FR-017 and D-CYCLE-004, marked as non-compliant — fix required.
  - Depends on: EI-T001, EI-T002
  - Estimate: 20 min
  - Owner: (unassigned)
  - Acceptance: `plan.md` exists, references FR-017 and D-CYCLE-004, status marked non-compliant — fix required.
  - Files: `specs/ecosystem-integration/plan.md`
  - Domain: docs
  - Parallelizable: false
  - Lane: C11

- [x] **EI-T004** — Create `specs/ecosystem-integration/tasks.md` with verification commands `grep -c "mem_limit" docker-compose.yml` and `grep -c "restart: always" docker-compose.yml`.
  - Depends on: EI-T003
  - Estimate: 15 min
  - Owner: (unassigned)
  - Acceptance: `tasks.md` exists with structured task fields and verification commands.
  - Files: `specs/ecosystem-integration/tasks.md`
  - Domain: docs
  - Parallelizable: false
  - Lane: C11

- [x] **EI-T005** — Create `specs/ecosystem-integration/checklist.md`.
  - Depends on: EI-T003
  - Estimate: 15 min
  - Owner: (unassigned)
  - Acceptance: `checklist.md` exists with completeness, clarity, consistency, security, and tests sections.
  - Files: `specs/ecosystem-integration/checklist.md`
  - Domain: docs
  - Parallelizable: true
  - Lane: C11

- [x] **EI-T006** — Create `specs/ecosystem-integration/waves/manifest.json`.
  - Depends on: EI-T003
  - Estimate: 15 min
  - Owner: (unassigned)
  - Acceptance: `manifest.json` exists with 4 waves (diagnose, fix, validate, ship) and lane definitions.
  - Files: `specs/ecosystem-integration/waves/manifest.json`
  - Domain: docs
  - Parallelizable: true
  - Lane: C11

- [x] **EI-T007** — Create wave prompts in `waves/wave-1-diagnose/`, `wave-2-fix/`, `wave-3-validate/`, `wave-4-ship/`.
  - Depends on: EI-T006
  - Estimate: 30 min
  - Owner: (unassigned)
  - Acceptance: 4 wave prompt files exist, one per wave directory.
  - Files: `specs/ecosystem-integration/waves/wave-1-diagnose/diagnose.md`, `specs/ecosystem-integration/waves/wave-2-fix/fix.md`, `specs/ecosystem-integration/waves/wave-3-validate/validate.md`, `specs/ecosystem-integration/waves/wave-4-ship/ship.md`
  - Domain: docs
  - Parallelizable: false
  - Lane: C11

- [ ] **EI-T008** — Run `npx --no-install acos --fix` and `npx --no-install acos --check` to confirm no harness drift.
  - Depends on: EI-T007
  - Estimate: 10 min
  - Owner: (unassigned)
  - Acceptance: `acos --check` exits clean (no drift).
  - Files: (none — verification only)
  - Domain: docs
  - Parallelizable: false
  - Lane: C11

- [ ] **EI-T009** — Create report and status JSON at `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/`.
  - Depends on: EI-T008
  - Estimate: 15 min
  - Owner: (unassigned)
  - Acceptance: report markdown and status JSON exist with correct schema.
  - Files: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-report.md`, `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-status.json`
  - Domain: docs
  - Parallelizable: false
  - Lane: C11

---

## Fix tasks (for subsequent fix wave — NOT executed in this wave)

- [ ] **EI-T-FIX1** — Add `mem_limit` to 4 services in `docker-compose.yml` (base file).
  - Depends on: EI-T009
  - Estimate: 20 min
  - Owner: (unassigned)
  - Acceptance: `grep -c "mem_limit" docker-compose.yml` returns ≥ 4.
  - Files: `docker-compose.yml`
  - Domain: infra
  - Parallelizable: false
  - Lane: C11
  - Verification: `grep -c "mem_limit" docker-compose.yml`

- [ ] **EI-T-FIX2** — Replace `restart: always` with `restart: unless-stopped` on `neo4j` (L298) and `langfuse-web` (L397) in `docker-compose.yml` (base file).
  - Depends on: EI-T009
  - Estimate: 10 min
  - Owner: (unassigned)
  - Acceptance: `grep -c "restart: always" docker-compose.yml` returns 0.
  - Files: `docker-compose.yml`
  - Domain: infra
  - Parallelizable: false
  - Lane: C11
  - Verification: `grep -c "restart: always" docker-compose.yml`

## Dependencies

```text
T001 (FR-017 audit) ──┐
                       ├──> T003 (plan.md) ──┬──> T004 (tasks.md) ──┐
T002 (D-CYCLE-004)  ──┘                      ├──> T005 (checklist)  │
                                             └──> T006 (manifest) ──> T007 (wave prompts) ──> T008 (acos check) ──> T009 (report)
                                                                                                              │
                                                                                                              ├──> T-FIX1 (mem_limit) [next wave]
                                                                                                              └──> T-FIX2 (restart)   [next wave]
```

## Estimates

| Task | Estimate | Notes |
|------|----------|-------|
| EI-T001 | 10 min | FR-017 audit (service presence) |
| EI-T002 | 10 min | D-CYCLE-004 audit (mem_limit + restart: always) |
| EI-T003 | 20 min | plan.md creation |
| EI-T004 | 15 min | tasks.md creation |
| EI-T005 | 15 min | checklist.md creation |
| EI-T006 | 15 min | manifest.json creation |
| EI-T007 | 30 min | wave prompt files (4) |
| EI-T008 | 10 min | ACOS integrity check |
| EI-T009 | 15 min | report + status JSON |
| EI-T-FIX1 | 20 min | Add mem_limit to 4 services (next wave) |
| EI-T-FIX2 | 10 min | Replace restart: always (next wave) |
| **Total (this wave)** | ~2 h 20 min | |
| **Total (fix wave)** | ~30 min | |

## Owners

- (unassigned): all tasks pending owner assignment.

## Verification

- FR-017: all 6 required services present in `docker-compose.yml` (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy).
- D-CYCLE-004 (mem_limit): `grep -c "mem_limit" docker-compose.yml` — target ≥ 4 after fix (currently 0 in base file).
- D-CYCLE-004 (restart): `grep -c "restart: always" docker-compose.yml` — target 0 after fix (currently 2: neo4j L298, langfuse-web L397).
- ACOS: `npx --no-install acos --check` exits clean.
