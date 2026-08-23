# Project Status

- Lifecycle: adopted
- Current objective: Self-hosted AI stack — Docker Compose template with n8n, Ollama, Open WebUI, Flowise, Qdrant, Neo4j, SearXNG, Langfuse, Caddy, and custom MCP server
- Active milestone: Docker build standards (0840) applied — Dockerfile.mcp refactored, .dockerignore created, docker-bake.hcl created, :latest tags audit
- Verification: ACOS initialized 2026-08-22, projections in sync
- Ecosystem role: satellite of master-infra (container)
- Test suite: no tests currently (project is a Docker Compose template, not a codebase with unit tests)
- Docker setup: 6 compose files (main, minimal, 3 overrides, supabase), 1 custom Dockerfile (Dockerfile.mcp for MCP server), 15+ services
- Blockers: none recorded
- Known issues:
  1. Langfuse-web healthcheck unhealthy (Next.js "Ready" but healthcheck endpoint issues)
  2. Most services use :latest tags (pinning in progress via 0840)
  3. Supabase stack intentionally disabled in main compose (uses cloud instance from archon-v2)
  4. No tests directory — project is infrastructure, not application code
- Native client hooks: projected for Claude Code, Cursor, OpenAI Codex, and Devin
- MCP configuration: projected for Claude Code, Cursor, Devin, OpenAI Codex, OpenCode, and Kilo Code
- Last updated: 2026-08-22 (ACOS personalize — architecture.md, infrastructure.md, constitution.md, decisions.md populated from codebase)

## Project identity

`local-ai-packaged/` is a self-hosted AI and low-code development environment packaged as Docker Compose templates. It bootstraps a complete local AI stack including Ollama (local LLMs), Open WebUI (chat interface), n8n (workflow automation), Flowise (visual AI agent builder), Qdrant (vector database), Neo4j (knowledge graph), SearXNG (privacy metasearch), Langfuse (LLM observability), ClickHouse (analytics), MinIO (S3 storage), and Caddy (reverse proxy/TLS). A custom MCP server (Python 3.11) provides programmatic access for integration with other tools.

## Tech stack

- Docker Compose (6 files for different deployment scenarios)
- Python 3.11-slim for MCP server (mcp, httpx, pydantic, starlette, uvicorn)
- Caddy 2-alpine for reverse proxy/TLS
- 15+ services with profile support (cpu/gpu-nvidia/gpu-amd/none)
- start_services.py orchestration script
- Registry: registry.lan.local:8444/local-ai-packaged/
- Ports: 8001-8050 range (Flowise 8001, n8n 8002, Qdrant 8003-8004, Neo4j 8005-8006, SearXNG 8008, MCP 8009, Open WebUI 8050, Caddy 8081/8444)
