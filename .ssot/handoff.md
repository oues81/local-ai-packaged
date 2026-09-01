# Session Handoff

Date: 2026-08-30

- Last session: 2026-08-30 (entrypoint-cycle SSOT personalization via 1220-personalize)
- Completed:
  - Personalized the active-cycle entrypoint bodies (0/65 previously carried
    `personalized: true`; docs-only fields had been personalized on 2026-08-23 but
    entrypoint bodies were still generic template):
    - `.ssot/agents/entrypoints/0020-resume.md` — added "Project-specific orientation"
      (compose validity/health commands, MCP build command, registry, ecosystem-satellite
      pointer, stale-runtime note) and pointed step 6 at the real diagnostic command.
    - `.ssot/agents/entrypoints/1020-handoff.md` — added a project-specific verification
      paragraph (docker compose config/health, not a test-suite claim).
    - `.ssot/agents/entrypoints/0780-docker.md` — documented the real 6-compose-file
      layout, the `docker buildx bake` MCP build path, and the `ai_network` requirement.
    - All three now carry `personalized: true`; logged as `D-007` in `.ssot/decisions.md`.
  - Ran `node acos-mcp-launcher-work/scripts/core/sync-clients.mjs --fix` (44 projections
    regenerated across all client surfaces) then `--check` (0 drift; 1 pre-existing
    informational warning, see Known issues #4).
- Previous: Langfuse memory fix + docs-only SSOT personalize (2026-08-23); ACOS init +
  0840 docker build standards (2026-08-22)
- In progress: nothing
- Verification: `sync-clients.mjs --check` clean (0 drift). Docker/compose changes from
  earlier uncommitted work (Neo4j memory tuning, minio/postgres network additions) were
  present in the working tree before this session and were left untouched — out of scope
  for this personalization pass; not verified by this session.
- Blockers: none
- Known issues:
  1. Some :latest tags may remain in docker-compose.yml (pinned where stable versions could be verified)
  2. Supabase stack intentionally disabled (uses cloud from archon-v2)
  3. No tests (infrastructure project)
  4. `sync-clients.mjs --check` reports the template entrypoint `1840-auto-improve.md` as
     structurally missing from this project (informational, not drift) — this project does
     not use the auto-improve cycle; resolving it is a migration/reconcile action, out of
     scope for `1220-personalize`.
  5. Remaining personalization gaps identified but deferred (not part of the active
     0020→1020 cycle prioritized this session): `.ssot/agents/context/CLAUDE.src.md` still
     has the generic "My Project" placeholder title; `.ssot/agents/runtimes.json` still
     declares the example `fabric-staging` runtime instead of a real one or nothing.
- Next action:
  1. Verify minimal compose starts correctly with the uncommitted Neo4j/minio/postgres
     network changes: `docker compose -f docker-compose.yml -f docker-compose.minimal.yml
     config --quiet` then `up -d`.
  2. Optionally personalize `CLAUDE.src.md` (drop "My Project" placeholder) and clean up
     the stale `fabric-staging` runtimes.json entry.
  3. Pin remaining :latest tags if any.
- Resume commands:
  - `cd /home/oues/projects/master-infra/local-ai-packaged`
  - Build MCP server: `docker buildx bake --load`
  - Start services: `python3 start_services.py`
  - Minimal compose: `docker compose -f docker-compose.yml -f docker-compose.minimal.yml config --quiet`
  - ACOS check: `node /home/oues/projects/master-infra/acos-mcp-launcher-work/scripts/core/sync-clients.mjs --check` (global `npx acos` is stale at v1.9.0 on this host)
