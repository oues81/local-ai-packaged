# Project Architecture

## Purpose

`local-ai-packaged` is a self-hosted AI and low-code development environment packaged
as Docker Compose templates. It bootstraps a complete local AI stack with no external
API dependencies for core AI inference — Ollama runs LLMs locally, and all supporting
services (vector store, graph DB, observability, search, automation) run in containers.

## Ecosystem role

Satellite of `master-infra`. Listed in the hub's `CROSS_REPO_INDEX.md` section 6.
Uses the shared external Docker network `ai_network` (referenced as `laip_ai_network`
in compose files). Supabase is intentionally disabled in the main compose — the
project uses a cloud Supabase instance provisioned by `archon-v2`.

## Component diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │           External Network: ai_network           │
                    │                                                  │
  Host:8081/8444 ──▶│  Caddy (reverse proxy / TLS)                     │
                    │    ├── n8n:5678                                  │
                    │    ├── open-webui:8080                           │
                    │    ├── flowise:3001                              │
                    │    ├── langfuse-web:3000                         │
                    │    └── neo4j:7474                                │
                    │                                                  │
  Host:8009 ───────▶│  MCP Server (Python, SSE transport)              │
                    │    └── depends on n8n (healthy)                  │
                    │                                                  │
  Host:11434 ──────▶│  Ollama (profile: cpu / gpu-nvidia / gpu-amd)    │
                    │    └── pulls qwen2.5:7b, nomic-embed-text, mistral│
                    │                                                  │
  Host:8001 ───────▶│  Flowise (visual AI agent builder)               │
  Host:8002 ───────▶│  n8n (workflow automation)                      │
  Host:8003/8004 ──▶│  Qdrant (vector database)                        │
  Host:8005/8006 ──▶│  Neo4j (knowledge graph)                         │
  Host:8008 ───────▶│  SearXNG (privacy metasearch)                    │
  Host:8050 ───────▶│  Open WebUI (chat interface)                     │
  Host:3002 ───────▶│  Langfuse Web (LLM observability UI)             │
                    │                                                  │
                    │  ┌── Langfuse backing services ──┐               │
                    │  │  Postgres (langfuse DB)        │               │
                    │  │  ClickHouse (analytics)        │               │
                    │  │  MinIO (S3 event storage)      │               │
                    │  │  Redis / Valkey (cache)        │               │
                    │  │  Langfuse Worker (async)       │               │
                    │  └────────────────────────────────┘               │
                    │                                                  │
                    │  [Supabase — disabled, uses cloud from archon-v2]│
                    └─────────────────────────────────────────────────┘
```

## Service categories

| Category | Services | Source |
|----------|----------|--------|
| AI runtime | Ollama (cpu/gpu-nvidia/gpu-amd profiles) | `docker-compose.yml` L36–68, L591–631 |
| UI / chat | Open WebUI, Flowise | `docker-compose.yml` L107–167 |
| Automation | n8n, n8n-import | `docker-compose.yml` L168–214 |
| Integration | MCP Server (Python, SSE) | `docker-compose.yml` L216–249, `mcp_server/` |
| Vector store | Qdrant | `docker-compose.yml` L251–276 |
| Graph DB | Neo4j | `docker-compose.yml` L278–312 |
| Search | SearXNG | `docker-compose.yml` L556–589 |
| Observability | Langfuse Web, Langfuse Worker | `docker-compose.yml` L365–437 |
| Analytics DB | ClickHouse | `docker-compose.yml` L439–468 |
| Object storage | MinIO | `docker-compose.yml` L470–497 |
| Relational DB | Postgres 17 (Langfuse backing store) | `docker-compose.yml` L499–520 |
| Cache | Redis / Valkey | `docker-compose.yml` L522–554 |
| Reverse proxy | Caddy | `docker-compose.yml` L314–363, `Caddyfile` |
| Supabase (disabled) | Kong, Studio, DB, Supavisor, etc. | `supabase/docker/docker-compose.yml` |

## Network topology

- **`laip_ai_network`**: external network, real name `ai_network`. Must be created
  before starting services: `docker network create ai_network`.
- All services in the main compose join this network for inter-service communication.
- Caddy reverse-proxies to service container names (e.g. `n8n:5678`, `open-webui:8080`).
- The minimal override adds `default` network alongside `laip_ai_network` for
  ClickHouse, MinIO, Postgres, and Redis.

## Profile system

Ollama runs under Docker Compose profiles. Only one profile is active at a time.

| Profile | Service | Image | GPU |
|---------|---------|-------|-----|
| `cpu` (default) | `ollama-cpu` | `ollama/ollama:0.32.14` | None |
| `gpu-nvidia` | `ollama-gpu` | `ollama/ollama:0.32.14` | NVIDIA (1 GPU reserved) |
| `gpu-amd` | `ollama-gpu-amd` | `ollama/ollama:rocm` | AMD (`/dev/kfd`, `/dev/dri`) |
| `none` | — | — | Ollama external (e.g. on Mac) |

Each profile has a matching `ollama-pull-llama-*` init container that pulls
`qwen2.5:7b-instruct-q4_K_M`, `nomic-embed-text`, and `mistral:7b`.

## Port allocation

| Service | Host port | Container port | Source |
|---------|-----------|----------------|--------|
| Flowise | 8001 | 3001 | `.env.example` L123 |
| n8n | 8002 | 5678 | `.env.example` L128 |
| Qdrant HTTP | 8003 | 6333 | `.env.example` L131 |
| Qdrant gRPC | 8004 | 6334 | `.env.example` L132 |
| Neo4j HTTP | 8005 | 7474 | `.env.example` L135 |
| Neo4j Bolt | 8006 | 7687 | `.env.example` L136 |
| SearXNG | 8008 | 8080 | `.env.example` L139 |
| MCP Server | 8009 | 8000 | `.env.example` L145 |
| Open WebUI | 8050 | 8080 | `.env.example` L120 |
| Ollama | 11434 | 11434 | `docker-compose.yml` L52 |
| Langfuse Web | 3002 | 3000 | `.env.example` (compose L408) |
| Caddy HTTP | 8081 | 80 | `docker-compose.yml` L319 |
| Caddy HTTPS | 8444 | 443 | `docker-compose.yml` L320 |
| Caddy admin | 8111 | 8111 | `docker-compose.yml` L321 |
| Caddy alt | 18080 | 18080 | `docker-compose.yml` L322 |

### Supabase port mapping (D18-C) — disabled, for reference

| Supabase service | Host port | Container port |
|------------------|-----------|----------------|
| Kong API gateway | 8030 | 8000 |
| Kong HTTPS | 8443 | 8443 |
| Supavisor (PG pool) | 5433 | 5432 |
| Supavisor transaction | 6543 | 6543 |

## MCP Server

The custom MCP server (`mcp_server/`) exposes n8n workflow operations over
HTTP/SSE for integration with external tools (e.g. mcpinfra catalog).

- **Transport**: SSE (`/sse` endpoint, `/messages` POST back-channel)
- **Health**: `GET /health` → `{"status":"ok","transport":"sse"}`
- **Tools**: `execute_workflow`, `list_workflows`, `get_workflow_status`
- **Dependencies**: n8n (must be healthy before MCP server starts)
- **Source**: `mcp_server/server.py` (stdio MCP server), `mcp_server/http_server.py`
  (Starlette + uvicorn SSE wrapper)
- **Build**: `Dockerfile.mcp` (multi-stage, Python 3.11-slim-bookworm)
- **Spec**: `specs/001-mcp-server-integration/spec.md`

## Supabase integration

Supabase is **intentionally disabled** in the main compose (the `include:` directive
at the top of `docker-compose.yml` is commented out). The project uses a cloud
Supabase instance provisioned by `archon-v2`. The local Supabase stack
(`supabase/docker/docker-compose.yml`) is cloned from upstream via
`start_services.py` and can be started standalone if needed, but it is not part
of the default deployment.

## Key source files

| File | Role |
|------|------|
| `docker-compose.yml` | Main service definitions (15+ services, profiles, volumes) |
| `docker-compose.minimal.yml` | Reduced resource limits for development |
| `docker-compose.override.private.yml` | 127.0.0.1-only port bindings |
| `docker-compose.override.public.yml` | Resets Supabase analytics/kong/supavisor ports |
| `Dockerfile.mcp` | Multi-stage build for MCP server |
| `docker-bake.hcl` | Bake target for mcp-server |
| `start_services.py` | Startup orchestration (Supabase first, then main stack) |
| `Caddyfile` | Reverse proxy / TLS configuration |
| `mcp_server/server.py` | MCP server core (n8n tools, stdio transport) |
| `mcp_server/http_server.py` | SSE transport wrapper (Starlette + uvicorn) |
| `requirements.txt` | Pinned Python dependencies for MCP server |
| `.env.example` | Port assignments, credentials, configuration |
| `supabase/docker/docker-compose.yml` | Supabase stack (cloned from upstream) |
| `specs/001-mcp-server-integration/` | MCP server integration spec |

## Known issues

1. **Langfuse-web healthcheck unhealthy** — Next.js binds to container IP, not
   `localhost`; healthcheck endpoint hangs or returns 500. Worker is healthy
   (uses `pgrep` process check instead). See `70-HANDOFF.md` for details.
2. **Caddy Caddyfile not mounted** — `laip_caddy-config/` is an empty Docker
   volume; the `Caddyfile` at project root is not mounted into the container
   in the minimal override.
3. **ClickHouse keeper.xml** — `localhost:9181` raft config conflicts with
   `keeper_server.tcp_port=9181`. Non-blocking (Keeper election succeeds).
