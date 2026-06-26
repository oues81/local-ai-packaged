# 80-CHANGELOG.md — Local AI Packaged Version History

## Cycle 005 — 2026-05-05

### Added
- Validation cross-check of 12 source-of-truth files against live state
- Monitoring port remapping explicitly highlighted: Prometheus `19090`, Grafana `13000`, Node Exporter `19100`, cAdvisor `18086`
- Grafana datasource provisioning (Prometheus auto-config) at `monitoring/grafana/provisioning/datasources/datasource.yml`

### Changed
- `70-HANDOFF.md` — Bumped `CURRENT_CYCLE=005`, added Cycle 005 report references
- `80-CHANGELOG.md` — Added Cycle 005 entry
- `60-DEPLOYMENT.md` — Verified commands exec, aligned multi-stack startup order
- `scripts/start-monitoring.sh` — Bug documentation: wrong CWD still unresolved

### Known Limitations Status
| Limitation | Status | Tracking |
|---|---|---|
| Monitoring scripts wrong CWD | OPEN | `scripts/start-monitoring.sh:1` |
| Monitoring compose no network | OPEN | `monitoring/docker-compose.monitoring.yml` |
| Caddy port 9444 vs AGENTS.md 8444 | OPEN | `docker-compose.yml:291` |
| SearXNG hardcoded 8088 vs .env 8008 | OPEN | `docker-compose.yml:529` |
| No .env validation | OPEN | `start_services.py:314-342` |
| Backup not lifecycle-integrated | OPEN | `scripts/backup/*.sh` |
| Health checks missing tools in images | OPEN | `docker-compose.yml:271` |

## Cycle 004 — 2026-05-05

### Added
- `60-DEPLOYMENT.md` — Production-like deployment runbook with health checks
- Health check standard L0-L3 (syntax, health APIs, MCP endpoint, pytest subset)
- Monitoring stack: Prometheus (`19090`), Grafana (`13000`), Node Exporter (`19100`), cAdvisor (`18086`), Ollama Exporter (`9778`)
  - Compose file: `monitoring/docker-compose.monitoring.yml`
  - Startup/stop scripts: `scripts/start-monitoring.sh`, `scripts/stop-monitoring.sh`

### Changed
- `70-HANDOFF.md` — Bumped `CURRENT_CYCLE=004`, updated task status and doc pointers
- `80-CHANGELOG.md` — Restructured with cycle entries, known limitations, operational deltas
- `.env.example` — Port configuration section (8000-8099 range) and Caddy hostnames

### Known Limitations
| Limitation | File | Impact |
|---|---|---|
| `scripts/start-monitoring.sh` runs compose from wrong CWD | `scripts/start-monitoring.sh:1` | Uses relative path `-f docker-compose.monitoring.yml` but runs from `scripts/`; must be run from `monitoring/` |
| Same for `stop-monitoring.sh` | `scripts/stop-monitoring.sh:1` | Same issue |
| Monitoring compose has no network definition | `monitoring/docker-compose.monitoring.yml` | Services isolated to default network; cannot reach `ai_network` services |
| Caddy port mismatch: AGENTS.md says `8444` but compose maps host `9444:443` | `docker-compose.yml:291` | Contradiction — actual exposed port is 9444, not 8444 |
| SearXNG port hardcoded to `8088:8080` in compose, but `.env.example` documents `SEARXNG_PORT=8008` | `docker-compose.yml:529` vs `.env.example` | Port mismatch on host side |
| No `.env` validation before startup | `start_services.py:314-342` | Missing secrets cause silent container crashes |
| Automated backup scripts exist but not integrated into startup/shutdown lifecycle | `scripts/backup/backup-volumes.sh`, `scripts/backup/verify-backup.sh` | No automatic backup schedule or pre-shutdown backup hook |
| `healthcheck` tests use `curl`/`wget` inside containers where tools may not be installed (e.g., `neo4j:latest` base image) | `docker-compose.yml:271` | Health checks may never report healthy |

### Operational Deltas
| Delta | Details |
|---|---|
| Port range | 8000-8099 (main stack), 19090/13000/19100/18086 (monitoring) |
| Docker project name | `local-ai-packaged` (set in `start_services.py`; not set in compose files themselves) |
| External network | Requires `ai_network` to exist before `docker compose up` |
| Ollama profiles | `cpu`, `gpu-nvidia`, `gpu-amd`, `none` |
| Environment modes | `private` (default, all ports open), `public` (only 80/443) |
| Supabase separate compose | `supabase/docker/docker-compose.yml` within same project `local-ai-packaged` |
| Caddy TLS | Auto HTTPS via Let's Encrypt when `LETSENCRYPT_EMAIL` and hostnames are set |
| Ollama host bind mount | `volumes:` maps to `/mnt/c/Users/oues/.ollama` (WSL-specific path) |

---

## Cycle 003 — 2026-05-03/04

### Added
- MCP server: `mcp_server/server.py` with `execute_workflow`, `list_workflows`, `get_workflow_status`
- Test suite: `tests/test_mcp_server.py`, `tests/integration/`, `tests/load/`, `tests/resilience/`
  - Health check integration tests
  - Service startup tests
  - MCP-n8n integration tests
  - Load/stress tests
  - Container restart resilience tests
  - Network partition resilience tests
- Contracts: `contracts/catalog-entry.yaml`, `contracts/boundary-mcpinfra-004.md`
- Security audit results, performance benchmarks, backup strategy verification

### Changed
- n8n port moved from 5678 to 8002 for host mapping
- Open WebUI port moved from 8080 to 8050
- Supabase Kong port moved from 8000 to 8030
- Docker Compose reorganized with vertical spacing, healthchecks, resource limits
- All containers get resource limits (CPU/memory reservations and limits)

---

## Cycle 002 — 2026-05-03

### Added
- `AGENTS.md`, `70-HANDOFF.md` — DSS-compliant documentation
- Cross-repo references to Master Agent ecosystem
- Agent reports in `AGENT_REPORTS/` directory structure
- Caddy addon: `caddy-addon/` for deploying agents

### Changed
- Documentation standardized to DSS v1.0 format (00-INDEX.md, AGENTS.md, HANDOFF.md)
- `.env.example` expanded with Langfuse, Neo4j, Caddy production configs

---

## Cycle 001 — 2026-04-17/18

### Added
- Initial `docker-compose.yml` with Ollama, Open WebUI, n8n, Flowise, Qdrant, Neo4j, SearXNG, Caddy, Langfuse
- `start_services.py` with GPU profiles (cpu, gpu-nvidia, gpu-amd, none) and environment modes (private/public)
- Supabase stack integration via `supabase/docker/docker-compose.yml`
- Custom port mapping to avoid inter-project collisions (8000-8099 range)
- Caddy reverse proxy with `Caddyfile` and `caddy-config/`
- Override compose files: `docker-compose.override.private.yml`, `.public.yml`, `.public.supabase.yml`
- SearXNG initialization logic in `start_services.py`
- French comments and resource limits throughout compose

### Changed
- Forked from `coleam00/local-ai-packaged` stable branch
- Added Langfuse observability stack (ClickHouse, MinIO, Postgres, Redis)
- Re-versioned n8n backup workflows
- Added `laip_` prefix to container names for project namespacing

---

## Integration Status

| System | Status | Notes |
|--------|--------|-------|
| MCP Catalog | ✅ Registered | `contracts/catalog-entry.yaml` |
| Master Agent | 🔄 Planned | Tool provider via MCP |
| Hermes | ✅ Ready | Chat via Open WebUI |
| MCPInfra | 🔄 Pending | External catalog onboarding (spec 004) |

---

*Standard: DSS (Documentation Structure Standard) v1.0*
