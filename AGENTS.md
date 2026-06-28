# AGENTS.md — Local AI Packaged

Guidance for AI coding agents working in this repository.

## Multi-repo alignment

- **Hub (read first in main_archon clone)**: `main_archon/docs/CROSS_REPO_INDEX.md` — spec ownership, ports, boundaries.
- **This repo** is a self-hosted AI stack. Listed in hub section 6.

## Overview

Docker Compose template that bootstraps a fully featured local AI and low-code development environment. Includes Ollama, Open WebUI, n8n, Supabase, Flowise, Qdrant, Neo4j, SearXNG, Langfuse, and Caddy reverse proxy.

## Tech stack

- **Docker Compose**: Primary orchestration (multi-compose: main + supabase).
- **Python**: `start_services.py` startup script, `n8n_pipe.py` integration.
- **Services**: Ollama, Open WebUI, n8n, Supabase, Flowise, Qdrant, Neo4j, SearXNG, Langfuse.
- **Reverse Proxy**: Caddy with custom `Caddyfile`.
- **MCP Server**: `mcp_server/server.py` for programmatic access.

## Key directories

| Path | Role |
|------|------|
| `supabase/docker/` | Supabase Docker Compose and config |
| `n8n/` | n8n backup and workflows |
| `flowise/` | Flowise chatflow configurations |
| `mcp_server/` | MCP server for service operations |
| `caddy-addon/` | Caddy reverse proxy addons |
| `specs/` | SpecKit features (001-mcp-server-integration) |

## Commands

```bash
# Start all services
python3 start_services.py

# Or manual Docker Compose
docker compose up -d

# Supabase services
docker compose -f supabase/docker/docker-compose.yml up -d
```

## Key ports (from .env)

| Service | Default Port |
|---------|-------------|
| n8n | 8002 |
| Open WebUI | 8050 |
| Flowise | 8001 |
| Supabase Studio | 8030 (Caddy) / 3000 (internal) |
| Qdrant | 8003 / 8004 |
| Neo4j | 8005 / 8006 |
| SearXNG | 8008 |
| Langfuse | 3002 |
| Caddy | 8081 / 8444 |

## Supabase port mapping (D18-C)

Supabase runs in `supabase/docker/` with port modifications to avoid conflicts:

| Supabase Service | Host Port → Container Port | Notes |
|-----------------|---------------------------|-------|
| Kong API gateway | 18000 → 8000 | API endpoint for archon-v2 (SUPABASE_URL) |
| Kong HTTPS | 18443 → 8443 | |
| Supavisor (PG pool) | 5433 → 5432 | PostgreSQL access via pooler |
| Supavisor transaction | 6543 → 6543 | Transaction mode proxy |
| Studio | (internal) → 3000 | No host bind — accessed via Kong |
| PostgreSQL DB | (internal) → 5432 | Direct access only within Docker network |

**Start**: `docker compose -f supabase/docker/docker-compose.yml up -d`
**Connections**:
- `archon-v2 SUPABASE_URL`: `http://host.docker.internal:18000`
- `direct PG`: `host.docker.internal:5433` (user: postgres, pw: from .env)

## Agent behavior

- **Never** commit `.env` files — use `.env.example` patterns.
- The Supabase stack has its own compose file (`supabase/docker/docker-compose.yml`); handle it separately.
- Check `start_services.py` for the correct startup sequence.
- Caddy handles HTTPS/TLS; configuration in `Caddyfile` and `caddy-addon/`.

**Last reviewed**: 2026-04-14
