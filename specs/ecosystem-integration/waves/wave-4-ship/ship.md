# Wave 4 — Ship: local-ai-packaged ACOS integrity and report

## Report required
Create report at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-report.md`
Create status JSON at: `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-status.json`

## Context
- Workspace: /home/oues/projects/master-infra/local-ai-packaged
- Project: local-ai-packaged (local AI stack)
- Cycle: auto-improve-2026-08-31
- Wave: 4 (ship, mutating)
- Lane: C11

## Mission

Finalize the lifecycle artifacts: run ACOS integrity checks, create the report and status JSON.

### Steps
1. Run `npx --no-install acos --fix` — regenerate projections if needed.
2. Run `npx --no-install acos --check` — confirm 0 drift.
3. Update `.ssot/status.md` and `.ssot/handoff.md` with:
   - Lifecycle artifacts created under `specs/ecosystem-integration/`.
   - D-CYCLE-004 compliance status (non-compliant in base file; fix documented for next wave).
4. Create report markdown at
   `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-report.md`.
5. Create status JSON at
   `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/C11-spec-local-ai-packaged-status.json` with the
   strict schema.

## Constraints
- Do NOT push to any remote.
- Do NOT access `.env*` files.
- Scope limited to `local-ai-packaged/` and `AGENT_REPORTS/2026-08-31/auto-improve/wave-3/`.
- Do NOT modify `docker-compose.yml` in this wave.

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
