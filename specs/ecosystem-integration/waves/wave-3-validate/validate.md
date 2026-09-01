# Wave 3 — Validate: local-ai-packaged mechanical verification

## Report required
Create report at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-report.md`
Create status JSON at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-status.json`

## Context
- Workspace: /home/oues/projects/master-infra/local-ai-packaged
- Project: local-ai-packaged (local AI stack)
- Cycle: auto-improve-2026-08-31
- Wave: 3 (validate, read-only)
- Lane: C11

## Mission

Run mechanical verification commands to prove D-CYCLE-004 compliance after the fix wave (Wave 2).

### Steps
1. Verify mem_limit added to 4 services:
   - `grep -c "mem_limit" docker-compose.yml` — should return ≥ 4.
   - Confirm ollama-gpu, ollama-pull-llama-cpu, ollama-pull-llama-gpu, ollama-pull-llama-gpu-amd
     all have memory limits.
2. Verify no `restart: always`:
   - `grep -c "restart: always" docker-compose.yml` — should return 0.
   - `grep -n "restart: always" docker-compose.yml` — should return empty.
3. Verify FR-017 still compliant:
   - All 6 required services (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy) present.
4. Run `npx --no-install acos --check` — confirm no drift.

## Constraints
- Read-only: do NOT modify any source code, config, or spec files.
- Do NOT push to any remote.
- Do NOT access `.env*` files.
- Scope limited to `local-ai-packaged/`.

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
