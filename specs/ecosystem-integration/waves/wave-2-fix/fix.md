# Wave 2 — Fix: local-ai-packaged D-CYCLE-004 compliance

## Report required
Create report at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-report.md`
Create status JSON at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-status.json`

## Context
- Workspace: /home/oues/projects/master-infra/local-ai-packaged
- Project: local-ai-packaged (local AI stack)
- Cycle: auto-improve-2026-08-31
- Wave: 2 (fix, mutating)
- Lane: C11

## Mission

Execute T-FIX1 (add mem_limit to 4 services) and T-FIX2 (replace restart: always with
restart: unless-stopped on 2 services) in the base `docker-compose.yml`.

### T-FIX1 — Add mem_limit to 4 services
Add `mem_limit` (or `deploy.resources.limits.memory`) to the 4 Ollama services that currently lack
it in the base `docker-compose.yml`:

1. `ollama-gpu` (L607-616) — inherits `x-ollama` anchor but overrides `deploy.resources` with only
   `reservations.devices`, dropping `limits.memory`. Add `limits.memory: 512M` (consistent with
   override file).
2. `ollama-pull-llama-cpu` (L626-630) — inherits `x-init-ollama` anchor, no `deploy.resources`. Add
   `deploy.resources.limits.memory: 64M` (consistent with override file).
3. `ollama-pull-llama-gpu` (L632-636) — inherits `x-init-ollama` anchor, no `deploy.resources`. Add
   `deploy.resources.limits.memory: 64M`.
4. `ollama-pull-llama-gpu-amd` (L638-643) — inherits `x-init-ollama` anchor, no `deploy.resources`.
   Add `deploy.resources.limits.memory: 64M`.

Verification: `grep -c "mem_limit" docker-compose.yml` should return ≥ 4 (or equivalent
`deploy.resources.limits.memory` count).

### T-FIX2 — Replace restart: always
Replace `restart: always` with `restart: unless-stopped` on 2 services in the base
`docker-compose.yml`:

1. `neo4j` (L298) — change `restart: always` to `restart: unless-stopped`.
2. `langfuse-web` (L397) — change `restart: always` to `restart: unless-stopped`.

Verification: `grep -c "restart: always" docker-compose.yml` should return 0.

### Post-fix
1. Run `npx --no-install acos --fix && npx --no-install acos --check` — 0 drift.
2. Update `.ssot/status.md` and `.ssot/handoff.md` with D-CYCLE-004 compliance status.

## Scope boundary
- T-FIX1 and T-FIX2 may only touch: `docker-compose.yml` (base file).
- Do NOT modify `docker-compose.override.yml` (it already has the fixes).
- Do NOT modify any spec files.
- Do NOT push to any remote.

## Constraints
- Do NOT access `.env*` files.
- Scope limited to `local-ai-packaged/`.
- If cross-repo work is required → stop the lane.

## Status JSON (strict schema)
```json
{
  "final_status": "completed|partial|blocked",
  "scope_completed": [],
  "scope_not_completed": [],
  "files_changed": [],
  "proofs_file_line": [],
  "blocking_questions": [],
  "next_wave_recommendation": "validate|fix|ship|escalate",
  "operator_handoff": ""
}
```
