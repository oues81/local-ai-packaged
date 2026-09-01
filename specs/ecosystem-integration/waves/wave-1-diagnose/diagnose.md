# Wave 1 — Diagnose: local-ai-packaged ecosystem-integration

## Report required
Create report at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-report.md`
Create status JSON at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-status.json`

## Context
- Workspace: /home/oues/projects/master-infra/local-ai-packaged
- Project: local-ai-packaged (local AI stack)
- Cycle: auto-improve-2026-08-31
- Wave: 1 (diagnose, read-only)
- Lane: C11

## Mission

Read-only diagnostic of local-ai-packaged's ecosystem-integration state. Confirm what is proven vs.
what remains. This wave has already been executed (Wave 1 / A3, 2026-08-31) — the findings are
recorded in `specs/ecosystem-integration/spec.md` under "FR-017 compliance status (Wave 1 A3 audit)".

### Steps
1. Read `specs/ecosystem-integration/spec.md` — confirm Wave 1 A3 findings are present and accurate.
2. Read `.ssot/status.md` and `.ssot/architecture.md` — confirm current state matches spec.md.
3. Verify FR-017: all 6 required services (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy) present in
   `docker-compose.yml`.
4. Verify D-CYCLE-004 violations:
   - `grep -c "mem_limit" docker-compose.yml` (expect 0 in base file).
   - `grep -n "restart: always" docker-compose.yml` (expect 2: neo4j L298, langfuse-web L397).
5. Confirm 4 services without mem_limit: ollama-gpu, ollama-pull-llama-cpu, ollama-pull-llama-gpu,
   ollama-pull-llama-gpu-amd.

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
