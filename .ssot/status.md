# Project Status

- Lifecycle: adopted
- Current objective: Self-hosted AI stack — Docker Compose template with n8n, Ollama, Open WebUI, Flowise, Qdrant, Neo4j, SearXNG, Langfuse, Caddy, and custom MCP server
- Active milestone: Docker build standards (0840) applied + SSOT personalized (docs + entrypoint cycle) + Langfuse healthcheck and memory fixed
- Verification: ACOS projections in sync (2026-08-30, `sync-clients.mjs --check` clean; 1 pre-existing informational warning: template entrypoint `1840-auto-improve.md` not present in this project — out of scope for this session)
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
- Last updated: 2026-08-30

## Project identity

`local-ai-packaged/` is a self-hosted AI and low-code development environment packaged as Docker Compose templates. It bootstraps a complete local AI stack including Ollama, Open WebUI, n8n, Flowise, Qdrant, Neo4j, SearXNG, Langfuse, ClickHouse, MinIO, and Caddy. A custom MCP server (Python 3.11) provides programmatic access for integration with other tools.

## Tech stack

- Docker Compose (6 files for different deployment scenarios)
- Python 3.11-slim for MCP server (mcp, httpx, pydantic, starlette, uvicorn)
- Caddy 2-alpine for reverse proxy/TLS
- 15+ services with profile support (cpu/gpu-nvidia/gpu-amd/none)
- start_services.py orchestration script
- Registry: registry.lan.local:8444/local-ai-packaged/
