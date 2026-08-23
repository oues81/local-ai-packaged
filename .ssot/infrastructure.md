# Existing Development Infrastructure

## Boundary

This project is a Docker Compose template — it **is** the infrastructure. It does
not consume a separate shared development platform in the ACOS `infrastructure-profile`
sense. The `start_services.py` orchestrator and Docker Compose files are the primary
deployment mechanism.

## Docker Compose files

| File | Purpose | When to use |
|------|---------|-------------|
| `docker-compose.yml` | Main stack: 15+ services, profiles, volumes, healthchecks | Default deployment |
| `docker-compose.minimal.yml` | Reduced CPU/memory limits; swaps private Open WebUI image for public | Development on constrained hosts (8 GB RAM) |
| `docker-compose.override.private.yml` | Binds all ports to `127.0.0.1` only | Local-only access, no external exposure |
| `docker-compose.override.public.yml` | Resets Supabase analytics/kong/supavisor ports (`!reset null`) | Public deployment with Caddy TLS |
| `docker-compose.override.public.supabase.yml` | Same port resets as public override | Public deployment with Supabase enabled |
| `supabase/docker/docker-compose.yml` | Full Supabase stack (cloned from upstream) | Standalone Supabase (intentionally disabled in main) |

### Compose file stacking

```bash
# Default (private, CPU profile)
python3 start_services.py --profile cpu --environment private

# Minimal (development, reduced resources)
docker compose -f docker-compose.yml -f docker-compose.minimal.yml --profile cpu up -d

# Public (Caddy TLS, domain names)
python3 start_services.py --profile cpu --environment public

# Manual (no Supabase, no script)
docker compose -p local-ai-packaged -f docker-compose.yml --profile cpu up -d
```

## docker-bake.hcl

Single build target: `mcp-server`. Built from `Dockerfile.mcp` (multi-stage).

| Variable | Default | Purpose |
|----------|---------|---------|
| `REGISTRY` | `registry.lan.local:8444` | Private Harbor registry |
| `PROJECT` | `local-ai-packaged` | Registry namespace |
| `TAG` | `latest` | Image tag |
| `CACHE_NS` | `registry.lan.local:8444/buildkit-cache/local` | Registry cache namespace |
| `CACHE_DIR` | `/tmp/.buildx-cache` | Local BuildKit cache directory |

**Image**: `registry.lan.local:8444/local-ai-packaged/mcp-server:latest`

```bash
docker buildx bake --load                     # build locally
docker buildx bake --push                     # build and push to registry
docker buildx bake --set TAG=v0.1.0 --load    # custom tag
```

## Registry namespace

`registry.lan.local:8444/local-ai-packaged/` — private Harbor registry hosted by
the `master-infra` ecosystem. Only the MCP server image is pushed here; all other
services use upstream images directly.

## Dockerfile.mcp

Multi-stage build following 0840 docker-build-standards:

- **Stage 1 (`deps`)**: Python 3.11-slim-bookworm, creates venv, installs pinned
  requirements with pip cache mount, installs curl with apt cache mount.
- **Stage 2 (`runner`)**: Copies venv from deps, copies `mcp_server/` source,
  creates non-root user (uid 1001), exposes port 8000, healthcheck via curl.
- **Cache mounts**: `/var/cache/apt`, `/var/lib/apt`, `/root/.cache/pip`
- **Non-root**: User `mcp` (uid 1001, gid 1001)

## .dockerignore

126 lines excluding version control, build artifacts, Docker files, environment
secrets, documentation, agent/ACOS config, tests, CI, and project-specific
directories (supabase/, n8n/, neo4j/, flowise/, caddy configs, etc.).
Reduces build context from ~2.3 GB to ~19 KB.

## start_services.py

Python orchestration script that handles multi-stack startup:

1. Clone/update Supabase repo (sparse checkout of `docker/` directory)
2. Copy `.env` to `supabase/docker/.env`
3. Generate SearXNG secret key (replaces `ultrasecretkey` in `settings.yml`)
4. Check/fix SearXNG `cap_drop` for first run
5. Stop existing containers (both main and Supabase compose projects)
6. Start Supabase stack, wait for `supabase-db` and `supabase-pooler` health
7. Start main stack with profile and environment overrides

**Arguments**:
- `--profile`: `cpu` (default), `gpu-nvidia`, `gpu-amd`, `none`
- `--environment`: `private` (default), `public`

**Project name**: `local-ai-packaged` (unified across both compose files)

## Caddyfile

Reverse proxy configuration with environment-variable-driven hostnames:

| Route | Upstream | Status |
|-------|----------|--------|
| `{$N8N_HOSTNAME}` | `n8n:5678` | Active |
| `{$WEBUI_HOSTNAME}` | `open-webui:8080` | Active |
| `{$FLOWISE_HOSTNAME}` | `flowise:3001` | Active |
| `{$LANGFUSE_HOSTNAME}` | `langfuse-web:3000` | Active |
| `{$NEO4J_HOSTNAME}` | `neo4j:7474` | Active |
| `{$OLLAMA_HOSTNAME}` | `ollama:11434` | Commented out |
| `{$SUPABASE_HOSTNAME}` | `kong:8000` | Commented out (disabled) |
| `{$SEARXNG_HOSTNAME}` | `searxng:8080` | Commented out |

Global block sets Let's Encrypt email. Addon configs loaded via
`import /etc/caddy/addons/*.conf`.

## Resource limits

### Default (docker-compose.yml)

All services have `deploy.resources` with limits and reservations. Typical limits:
1 CPU / 1 GB memory per service. Ollama: 2 CPU / 3 GB.

### Minimal (docker-compose.minimal.yml)

Reduced limits for development on 8 GB RAM hosts. Total allocation ~8.5 GB
(vs ~20 GB default).

| Service | Minimal limit | Default limit |
|---------|---------------|---------------|
| Ollama | 1.5 CPU / 3 GB | 2 CPU / 3 GB |
| Open WebUI | 0.5 CPU / 768 MB | 1 CPU / 1 GB |
| n8n | 0.5 CPU / 512 MB | 1 CPU / 1 GB |
| Flowise | 0.5 CPU / 768 MB | 1 CPU / 1 GB |
| MCP Server | 0.25 CPU / 128 MB | 0.5 CPU / 512 MB |
| Qdrant | 0.25 CPU / 256 MB | 1 CPU / 1 GB |
| Neo4j | 0.5 CPU / 1 GB | 1 CPU / 1 GB |
| Caddy | 0.25 CPU / 128 MB | 1 CPU / 1 GB |
| Langfuse Web | 0.5 CPU / 512 MB | 1 CPU / 1 GB |
| Langfuse Worker | 0.5 CPU / 512 MB | 1 CPU / 1 GB |
| ClickHouse | 0.5 CPU / 1 GB | 1 CPU / 1 GB |
| MinIO | 0.25 CPU / 256 MB | 1 CPU / 1 GB |
| Postgres | 0.25 CPU / 256 MB | 1 CPU / 1 GB |
| Redis | 0.25 CPU / 64 MB | 1 CPU / 1 GB |
| SearXNG | 0.25 CPU / 256 MB | 1 CPU / 1 GB |

## Pinned image versions

| Service | Image | Version |
|---------|-------|---------|
| n8n | `n8nio/n8n` | `1.81.0` |
| Ollama | `ollama/ollama` | `0.32.14` |
| Flowise | `flowiseai/flowise` | `3.1.4` |
| Qdrant | `qdrant/qdrant` | `v1.18.3` |
| Neo4j | `neo4j` | `5.26.29` |
| Caddy | `caddy` | `2-alpine` |
| Langfuse | `langfuse/langfuse` | `3` |
| ClickHouse | `clickhouse/clickhouse-server` | `25.8.28.1` |
| MinIO | `minio/minio` | `RELEASE.2025-09-07T16-13-09Z` |
| Postgres | `postgres` | `17-alpine` |
| Redis | `valkey/valkey` | `8-alpine` |
| SearXNG | `searxng/searxng` | `2026.8.5-1689cb1b5` |
| Open WebUI (private) | `ghcr.io/open-webui/laip_open-webui` | `main` |
| Open WebUI (public) | `ghcr.io/open-webui/open-webui` | `main` |

## MCP server dependencies (requirements.txt)

| Package | Version |
|---------|---------|
| mcp | 1.29.0 |
| httpx | 0.28.1 |
| pydantic | 2.11.10 |
| starlette | 0.41.3 |
| uvicorn[standard] | 0.32.1 |

## Rules

1. Do not deploy or reimplement these services from a project workflow — use
   `start_services.py` or `docker compose` directly.
2. Do not store tokens, passwords, or `.env` files in the repository — use
   `.env.example` as the template.
3. The external network `ai_network` must exist before starting services.
4. Prefer `docker-compose.minimal.yml` for development on hosts with < 16 GB RAM.
5. Pin image versions — do not use `:latest` for upstream images (0840 standard).
