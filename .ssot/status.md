# Project Status

- Lifecycle: adopted
- Current objective: Self-hosted AI stack — Docker Compose template with n8n, Ollama, Open WebUI, Flowise, Qdrant, Neo4j, SearXNG, Langfuse, Caddy, and custom MCP server
- Active milestone: ACOS 0840 rollout to ssot **1.9.7** (wave2 2026-10-19) complete — class `ok`
- ACOS / SSOT: `ssotVersion` **1.9.7** (migrated from 1.9.5); engine `acos-mcp-launcher-work` 1.9.7
- 0840 class path: `needsMigrate` → apply (skillAdditions + reconcile) → Mode-1 C merge `1020-handoff.md` → waive undeclared twin `0780-docker.md` → `--refresh-bodies` (5 replace-template, 8 hold, 3 skip-personalized) → `ok`
- Personalized entrypoints preserved: `0020-resume.md`, `0780-docker.md`, `1020-handoff.md` (`personalized: true`)
- Personalized obligations: PASS + `coverageComplete=true` (0780 file-level accept waiver)
- Model-routing-audit: hardViolations=0 (soft WARNs on missing planner/reviewer/verifier overrides)
- Projection check: clean
- Verification: ACOS projections in sync post-rollout (2026-10-19)
- Ecosystem role: satellite of master-infra (container)
- Test suite: no tests (infrastructure project, Docker Compose template)
- Docker setup: 6 compose files (main, minimal, 3 overrides, supabase), 1 custom Dockerfile (Dockerfile.mcp), 15+ services
- Registry: registry.lan.local:8444/local-ai-packaged/
- Ports: 8001-8050 range, Caddy 8081/8444
- Blockers: none
- Known issues:
  1. Langfuse-web healthcheck fixed (endpoint /api/public/health + dynamic container IP) — verified healthy after restart
  2. Langfuse memory limits fixed in minimal compose (256→512 heap, 512M→768M/640M limits)
  3. Supabase stack intentionally disabled in main compose (uses cloud instance from archon-v2)
  4. Some :latest tags may remain in docker-compose.yml (pinned where stable versions verified)
- Native client hooks: projected for Claude Code, Cursor, OpenAI Codex, and Devin
- MCP configuration: projected for Claude Code, Cursor, Devin, OpenAI Codex, OpenCode, and Kilo Code
- Last updated: 2026-10-19

## Project identity

`local-ai-packaged/` is a self-hosted AI and low-code development environment packaged as Docker Compose templates. It bootstraps a complete local AI stack including Ollama, Open WebUI, n8n, Flowise, Qdrant, Neo4j, SearXNG, Langfuse, ClickHouse, MinIO, and Caddy. A custom MCP server (Python 3.11) provides programmatic access for integration with other tools.

## Tech stack

- Docker Compose (6 files for different deployment scenarios)
- Python 3.11-slim for MCP server (mcp, httpx, pydantic, starlette, uvicorn)
- Caddy 2-alpine for reverse proxy/TLS
- 15+ services with profile support (cpu/gpu-nvidia/gpu-amd/none)
- start_services.py orchestration script
- Registry: registry.lan.local:8444/local-ai-packaged/
