# Session Handoff

Date: 2026-08-23

- Last session: 2026-08-23 (Langfuse memory fix + SSOT personalize)
- Completed:
  - Langfuse-web healthcheck fixed: endpoint /health → /api/public/health, localhost → dynamic container IP, format → CMD-SHELL, start_period 40s→60s (commit `9fa4fcd`)
  - Langfuse memory limits fixed in docker-compose.minimal.yml: heap 256→512 for web and worker, memory limits 512M→768M (web) and 512M→640M (worker) (commit `9b28b5a`)
  - SSOT personalized via 1220-personalize: architecture.md, infrastructure.md, constitution.md, decisions.md populated from codebase (commit `b49dfe6`)
  - Container verified healthy after restart with adequate memory
- Previous: ACOS init + 0840 docker build standards (2026-08-22)
- In progress: nothing
- Verification: ACOS projections in sync; docker compose config --quiet passes; langfuse-web verified healthy
- Blockers: none
- Known issues:
  1. Some :latest tags may remain in docker-compose.yml (pinned where stable versions could be verified)
  2. Supabase stack intentionally disabled (uses cloud from archon-v2)
  3. No tests (infrastructure project)
- Next action:
  1. Verify minimal compose starts correctly with new memory limits: `docker compose -f docker-compose.yml -f docker-compose.minimal.yml up -d`
  2. Pin remaining :latest tags if any
  3. Consider adding healthchecks to services that don't have them
- Resume commands:
  - `cd /home/oues/projects/master-infra/local-ai-packaged`
  - Build MCP server: `docker buildx bake --load`
  - Start services: `python3 start_services.py`
  - Minimal compose: `docker compose -f docker-compose.yml -f docker-compose.minimal.yml config --quiet`
  - ACOS check: `npx --no-install acos --check`
