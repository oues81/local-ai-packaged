# ecosystem-integration — Implementation Plan

## Feature ID

`ecosystem-integration`

## Status

- **Spec phase**: plan
- **Last updated**: 2026-08-31
- **Owner**: (unassigned)

## Summary

local-ai-packaged is the local AI stack of the master-infra ecosystem, providing Ollama (LLM
local), Neo4j (graph database), Langfuse (LLM observability), Qdrant (vector store), n8n
(automation), and Caddy (reverse proxy) as Docker Compose services. This plan documents the
lifecycle artifacts for the ecosystem-integration spec and records the FR-017 / D-CYCLE-004
non-compliance found by Wave 1 (A3 audit, 2026-08-31).

**FR-017 (Infrastructure socle)**: ✅ COMPLIANT — all required services (Ollama, Neo4j, Langfuse,
Qdrant, n8n, Caddy) are present and consumed, not recreated by the pipeline.

**D-CYCLE-004 (WSL2 hardening)**: ❌ NON-COMPLIANT — the base `docker-compose.yml` has 6 violations:

1. **4 services without `mem_limit`** (D-CYCLE-004 requires every service to define a memory limit):
   - `ollama-gpu` (L607-616) — inherits `x-ollama` anchor but overrides `deploy.resources` with
     only `reservations.devices`, dropping `limits.memory`.
   - `ollama-pull-llama-cpu` (L626-630) — inherits `x-init-ollama` anchor, no `deploy.resources`.
   - `ollama-pull-llama-gpu` (L632-636) — inherits `x-init-ollama` anchor, no `deploy.resources`.
   - `ollama-pull-llama-gpu-amd` (L638-643) — inherits `x-init-ollama` anchor, no `deploy.resources`.
2. **2 services with `restart: always`** (D-CYCLE-004 forbids `restart: always` on WSL2):
   - `neo4j` (L298) — `restart: always`.
   - `langfuse-web` (L397) — `restart: always`.

**Mitigation partielle**: `docker-compose.override.yml` corrects these violations
(ollama-gpu→512M, neo4j→on-failure:3, langfuse-web→on-failure:3, ollama-pull-llama-*→64M), but the
**base** file remains non-compliant. D-CYCLE-004 compliance requires the base file to be compliant
(an override is not guaranteed to be applied).

This plan is therefore marked **non-compliant — fix required**. The fix tasks (T1, T2) are
documented below for execution in a subsequent wave; Wave 3 (this lane) creates SPECS ONLY and does
NOT modify `docker-compose.yml`.

## Phases

1. **Phase 1 — Diagnose: FR-017 / D-CYCLE-004 compliance audit**
   - Goal: Confirm FR-017 (all services present and consumed) and audit D-CYCLE-004 violations
     (mem_limit missing, restart: always).
   - Affected surfaces: `docker-compose.yml`, `docker-compose.override.yml`.
   - Completion evidence: 4 services without mem_limit identified; 2 services with
     `restart: always` identified; line numbers recorded in spec.md.
   - Rollback: N/A (read-only audit).

2. **Phase 2 — Fix: add mem_limit + replace restart: always**
   - Goal: Add `mem_limit` (or `deploy.resources.limits.memory`) to the 4 Ollama services; replace
     `restart: always` with `restart: unless-stopped` on `neo4j` and `langfuse-web` in the base
     `docker-compose.yml`.
   - Affected surfaces: `docker-compose.yml` (base file only).
   - Completion evidence: `grep -c "mem_limit" docker-compose.yml` ≥ 4 (or equivalent
     `deploy.resources.limits.memory` count); `grep -c "restart: always" docker-compose.yml` = 0.
   - Rollback: `git checkout -- docker-compose.yml`.
   - **NOT executed in this wave** — documented for next wave.

3. **Phase 3 — Validate: mechanical verification**
   - Goal: Run grep-based verification commands to prove compliance mechanically.
   - Affected surfaces: none (verification only).
   - Completion evidence: `grep -c "restart: always" docker-compose.yml` returns 0;
     `grep -c "mem_limit" docker-compose.yml` returns ≥ 4 (or equivalent memory limit count).
   - Rollback: N/A (verification only).

4. **Phase 4 — Ship: ACOS integrity and report**
   - Goal: Run `acos --fix` and `acos --check`; create report and status JSON.
   - Affected surfaces: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/`.
   - Completion evidence: `acos --check` clean; report and status JSON created.
   - Rollback: N/A (reporting only).

## Parallelization strategy

- **Wave type**: fix (next wave) / spec (this wave)
- **Lane grouping**: by-file-ownership
- **Max lanes**: 1
- **Parallelizable phases**: none (sequential: diagnose → fix → validate → ship)
- **Lane assignment**: single lane (C11) handles all phases.
- **Notes**: This lane (Wave 3) creates spec artifacts only. The fix tasks (T1, T2) are documented
  for a subsequent fix wave.

## Milestones

| Milestone | Definition | Exit criteria |
|-----------|------------|---------------|
| M1 | FR-017 / D-CYCLE-004 audit confirmed | 4 services without mem_limit + 2 with restart: always identified with line numbers |
| M2 | Lifecycle artifacts created | plan.md, tasks.md, checklist.md, waves/manifest.json, wave prompts all exist |
| M3 | Fix applied (next wave) | `grep -c "restart: always" docker-compose.yml` = 0; mem_limit added to 4 services |
| M4 | ACOS integrity + report | `acos --check` clean; report and status JSON created |

## Stack choices

- **YAML-based verification (grep)** — chosen because the compose file is declarative YAML and grep
  provides a mechanical, dependency-free check.
- **Python yaml parser for service enumeration** — chosen for the audit phase to accurately
  distinguish services from volumes/networks/anchors.
- **Rejected: docker compose config** — rejected because it requires a running Docker daemon and
  merges override files, making per-file attribution ambiguous.

## Risks

| ID | Risk | Impact | Mitigation | Owner |
|----|------|--------|------------|-------|
| R1 | Override file masks base non-compliance in dev | medium | Fix the base file, not just the override (D-CYCLE-004 requires base compliance) | (unassigned) |
| R2 | ollama-gpu deploy override drops limits.memory | medium | Add explicit `limits.memory` in the ollama-gpu deploy block | (unassigned) |
| R3 | ollama-pull-llama-* init containers are one-shot | low | Use minimal mem_limit (64M) consistent with override file | (unassigned) |
| R4 | restart: unless-stopped vs on-failure:3 semantics | low | Use `unless-stopped` per D-CYCLE-004 baseline (override may refine to on-failure:3) | (unassigned) |

## Verification

- `grep -c "mem_limit" docker-compose.yml` — confirms mem_limit count (FR-017 / D-CYCLE-004). Target: ≥ 4 after fix.
- `grep -c "restart: always" docker-compose.yml` — confirms no `restart: always` (D-CYCLE-004). Target: 0 after fix.
- `grep -n "restart: always" docker-compose.yml` — identifies remaining violations (should be empty after fix).
- `npx --no-install acos --check` — ACOS integrity check (no harness sources touched in this wave).

## Rollback / compatibility

- **Artifact rollback**: all new files are under `specs/ecosystem-integration/` and can be deleted
  without affecting the running stack. `spec.md` is preserved (not modified).
- **Fix rollback** (next wave): `git checkout -- docker-compose.yml` restores the base file.
- **Compatibility**: no docker-compose files are modified in this wave; no runtime impact.
- **Breaking changes**: none (this wave).

## Dependencies

- `ecosystem-integration/spec.md` — requirements, boundary contracts, runtime matrix, FR-017/D-CYCLE-004 compliance status.
- `.ssot/status.md` — current project state (adopted, no blockers, Langfuse healthcheck fixed).
- `.ssot/architecture.md` — service inventory, profile system, port allocation, known issues.
- Wave 1 (A3) diagnose report — FR-017 / D-CYCLE-004 compliance evidence
  (`AGENT_REPORTS/2026-08-31/auto-improve/wave-1/A3-infrastructure-routage-diagnose.md`).
