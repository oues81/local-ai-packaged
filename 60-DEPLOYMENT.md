# 60-DEPLOYMENT.md — Local AI Packaged Deployment Runbook

## Prerequisites

### Host Requirements
| Component | Requirement | Verification |
|---|---|---|
| Docker | >= 24.0 | `docker --version` |
| Docker Compose | >= 2.20 | `docker compose version` |
| Python | >= 3.10 | `python3 --version` |
| RAM (minimum) | 8 GB | `free -h` |
| RAM (recommended) | 16 GB | `free -h` |
| Disk | 20 GB free | `df -h` |
| External network | `ai_network` must exist | `docker network ls \| grep ai_network` |

### Create External Network
```bash
docker network create ai_network 2>/dev/null || true
```

### Environment File
```bash
cp .env.example .env
# EDIT .env with secure values:
#   openssl rand -hex 32  for N8N_ENCRYPTION_KEY, N8N_USER_MANAGEMENT_JWT_SECRET
#   Unique passwords for POSTGRES_PASSWORD, CLICKHOUSE_PASSWORD, etc.
```

---

## Multi-Stack Startup Order

### Step 1 — Main Stack (Core + Supabase)
**Recommended:** Use the Python orchestrator which handles both stacks atomically.
```bash
# CPU profile (default)
python3 start_services.py --profile cpu

# Nvidia GPU
python3 start_services.py --profile gpu-nvidia

# AMD GPU
python3 start_services.py --profile gpu-amd

# Mac/Ollama externally
python3 start_services.py --profile none
```

`start_services.py` execution order:
1. Clone/update Supabase repo into `supabase/`
2. Copy `.env` to `supabase/docker/.env`
3. Generate SearXNG secret key
4. Stop existing containers
5. Start Supabase stack (`supabase/docker/docker-compose.yml`)
6. Wait for Supabase health (db, pooler)
7. Start main stack (`docker-compose.yml` with profile)

### Step 1b — Main Stack Only (manual, no Supabase)
```bash
docker network create ai_network 2>/dev/null || true
docker compose -p local-ai-packaged \
  -f docker-compose.yml \
  --profile cpu up -d
```

### Step 2 — Supabase Only (if started standalone)
```bash
docker compose -p local-ai-packaged \
  -f supabase/docker/docker-compose.yml up -d
```

### Step 3 — Monitoring Stack
```bash
# Method A — Direct (recommended)
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d

# Method B — Via script (CWD must be monitoring/ first)
cd monitoring && ../scripts/start-monitoring.sh

# Method C — Using script from project root (FIXED path)
# Currently scripts use relative paths — see Known Limitations in 80-CHANGELOG.md
```

---

## Service Health Checks

| Service | Host Port | Health Endpoint | Command |
|---|---|---|---|
| Open WebUI | 8050 | `/health` | `curl -f http://localhost:8050/health` |
| n8n | 8002 | `/healthz` | `curl -f http://localhost:8002/healthz` |
| Flowise | 8001 | `/` | `curl -f http://localhost:8001/` |
| Qdrant HTTP | 8003 | `/` | `curl -f http://localhost:8003/` |
| Neo4j HTTP | 8005 | `/` | `curl -f http://localhost:8005/` |
| SearXNG | 8088 | `/` | `curl -f http://localhost:8088/` |
| Langfuse | 3002 | `/api/public/health` | `curl -f http://localhost:3002/api/public/health` |
| Ollama | 11434 | `/api/health` | `curl -f http://localhost:11434/api/health` |
| Supabase Kong | 8030 | `/` | `curl -f http://localhost:8030/` |
| Prometheus | 19090 | `/-/healthy` | `curl -f http://localhost:19090/-/healthy` |
| Grafana | 13000 | `/api/health` | `curl -f http://localhost:13000/api/health` |
| Node Exporter | 19100 | `/metrics` | `curl -f http://localhost:19100/metrics` |
| cAdvisor | 18086 | `/healthz` | `curl -f http://localhost:18086/healthz` |

---

## Health Check Standard (L0–L3)

### Level 0 — Config/Syntax Validation
```bash
# Validate main compose
docker compose -f docker-compose.yml config --quiet

# Validate monitoring compose
docker compose -f monitoring/docker-compose.monitoring.yml config --quiet

# Validate Supabase compose
docker compose -f supabase/docker/docker-compose.yml config --quiet

# Check external network exists
docker network inspect ai_network > /dev/null 2>&1 && echo "OK" || echo "MISSING"

# Check .env has required keys
for key in N8N_ENCRYPTION_KEY POSTGRES_PASSWORD JWT_SECRET; do
  grep -q "^${key}=" .env && echo "$key: OK" || echo "$key: MISSING"
done
```
**Pass**: All 3 compose files validate, network exists, required env keys present.

### Level 1 — Service Health APIs
```bash
# Quick check all core services
for url in \
  http://localhost:8050/health \
  http://localhost:8002/healthz \
  http://localhost:8001/ \
  http://localhost:8003/ \
  http://localhost:3002/api/public/health \
  http://localhost:11434/api/health; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$url -> $code"
done
```
**Pass**: All return 200 or expected status code. At minimum Open WebUI, n8n, and Ollama must pass.

### Level 2 — MCP Endpoint Smoke Test
```bash
# If MCP server is running as a subprocess/service:
# Send a tools/list request via STDIO
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  timeout 5 python3 -c "
import subprocess, sys, json
p = subprocess.Popen(['python3', 'mcp_server/server.py'],
  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
out, _ = p.communicate(input=sys.stdin.buffer.read(), timeout=5)
data = json.loads(out)
assert 'tools' in data, 'No tools key in response'
print(f'OK: {len(data[\"tools\"])} tools found')
"
```
**Pass**: MCP server returns tool list with >= 1 tool. Alternative: `pytest tests/test_mcp_server.py -v --timeout=30`.

### Level 3 — Test Suite Subset
```bash
# Integration health checks
pytest tests/integration/test_healthchecks.py -v --timeout=60

# Service startup validation
pytest tests/integration/test_service_startup.py -v --timeout=120
```
**Pass**: All tests in both suites pass.

---

## Shutdown Procedure

### Graceful Stop
```bash
# Stop monitoring stack
cd monitoring && docker compose -f docker-compose.monitoring.yml down
cd ..

# Stop main stack + Supabase (unified project)
docker compose -p local-ai-packaged -f docker-compose.yml down --timeout 30
docker compose -p local-ai-packaged -f supabase/docker/docker-compose.yml down --timeout 30
```

### Full Cleanup (includes volumes — data loss risk)
```bash
docker compose -p local-ai-packaged -f docker-compose.yml down -v --timeout 30
docker compose -p local-ai-packaged -f supabase/docker/docker-compose.yml down -v --timeout 30
docker compose -f monitoring/docker-compose.monitoring.yml down -v
```

---

## Rollback Procedure

### Standard Rollback
```bash
# 1. Pull previous stable tag or commit
git checkout <previous-stable-tag>

# 2. Stop current stack
docker compose -p local-ai-packaged -f docker-compose.yml down

# 3. Restart with previous config
python3 start_services.py --profile cpu
```

### Volume Rollback (if data corruption)
```bash
# 1. Identify volumes
docker volume ls | grep laip_

# 2. Restore from backup (see backup section)
# docker run --rm -v laip_n8n_storage:/data -v /path/to/backup:/backup \
#   alpine tar xzf /backup/n8n-$(date +%F).tar.gz -C /data
```

---

## Quick Troubleshooting (Top 10 Issues)

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | `ai_network` not found | Network not created | `docker network create ai_network` |
| 2 | Ollama container crashes | GPU profile mismatch | Use `--profile cpu` if no GPU |
| 3 | Supabase pooler restarts | Known issue with pooler | See [GitHub issue](https://github.com/supabase/supabase/issues/30210) |
| 4 | "port already allocated" | Conflict with other project | Change port in `.env` (8000-8099 range) |
| 5 | SearXNG container restarts | Permissions on searxng/ dir | `chmod 755 searxng` from project root |
| 6 | n8n cannot connect to DB | Wrong Postgres password | Verify `POSTGRES_PASSWORD` in `.env` |
| 7 | Open WebUI shows error on first load | No Ollama model pulled | Wait for `ollama-pull-llama-cpu` container to finish |
| 8 | Containers not healthy | Missing tools in image | Check `docker logs <container>` for health check errors |
| 9 | MCP server not responding | Port/process not running | `python3 mcp_server/server.py` in foreground to test |
| 10 | Caddy TLS errors | No `LETSENCRYPT_EMAIL` set | Set to valid email or set `LETSENCRYPT_EMAIL=internal` |

---

## Backup & Recovery (Automated)

### Automated Backup Script
```bash
# Backup all volumes to ./backups/YYYYMMDD_HHMMSS/
./scripts/backup/backup-volumes.sh

# Custom output directory
./scripts/backup/backup-volumes.sh /path/to/backups
```

The script backs up:
- All Docker named volumes (main stack, supabase, monitoring)
- Bind-mounted directories (neo4j, searxng, supabase data)
- Produces a MANIFEST file with contents listing
- Logs to `backups/logs/`

### Verify Backup Integrity
```bash
# Verify most recent backup
./scripts/backup/verify-backup.sh

# Verify specific backup directory
./scripts/backup/verify-backup.sh ./backups/20260505_160122
```

### Manual Volume Backup (one-off)
```bash
docker run --rm -v laip_n8n_storage:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/n8n-$(date +%F).tar.gz -C /data .
```

### Restore a Volume
```bash
docker run --rm -v laip_n8n_storage:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/n8n-2026-05-05.tar.gz -C /data
```

---

## Monitoring Stack Details

| Component | Port (Host) | Port (Container) | Purpose |
|---|---|---|---|
| Prometheus | 19090 | 9090 | Metrics collection |
| Grafana | 13000 | 3000 | Dashboards (admin/admin) |
| Node Exporter | 19100 | 9100 | Host metrics |
| cAdvisor | 18086 | 8080 | Container metrics |
| Ollama Exporter | 9778 | 9778 | Ollama-specific metrics |

Start: `cd monitoring && docker compose -f docker-compose.monitoring.yml up -d`
Stop:  `cd monitoring && docker compose -f docker-compose.monitoring.yml down`

Note: The monitoring stack uses its own default bridge network and cannot reach `ai_network` services. If cross-stack scraping is needed, add `networks: [ai_network]` to monitoring services.

---

## Resilience / Chaos Testing

### Test Suites (tests/resilience/)
| Test File | Scenario | Method | Destructive? |
|-----------|----------|--------|-------------|
| `test_container_restart.py` | Restart core containers via Docker SDK | `container.restart()` | No — containers are restarted in-place |
| `test_network_partition.py` | Disconnect/reconnect from network | `docker network disconnect/connect` | No — network is reconnected immediately |
| `test_recovery.py` | Stop/start services, verify recovery | `docker compose stop/start` | No — service comes back via compose |

### Run Chaos Suite
```bash
# Run all resilience tests (safe for local env)
pytest tests/resilience/ -v --timeout=300

# Individual suites
pytest tests/resilience/test_container_restart.py -v --timeout=300
pytest tests/resilience/test_network_partition.py -v --timeout=180
pytest tests/resilience/test_recovery.py -v --timeout=120
```

### Chaos Test Results (Cycle 005)
| Test Suite | Result | Date |
|---|---|---|
| `test_container_restart.py` | 6/7 PASS (1 slow-start: open-webui, timeouts increased to 120s) | 2026-05-05 |
| `test_network_partition.py` | 6/6 PASS | 2026-05-05 |
| `test_recovery.py` | 5/5 PASS | 2026-05-05 |
| **Total** | **16/17 PASS → 17/17 after fix** | 2026-05-05 |

### What Each Test Validates
- **Container restart**: Service comes back running and responds to health checks after `docker restart`
- **Network partition**: Service becomes unreachable when disconnected from network, recovers after reconnect
- **Recovery**: Service restarts properly after `docker compose stop/start`, other services remain unaffected

### Known Limitations
- Open WebUI has a 40s start_period healthcheck, requiring extended timeout (120s) in restart tests
- Network partition tests only work on containers connected to `ai_network` or compose default network
- Tests are sequential and may interfere if one leaves a container in transitional state

---

## Known Gotchas

- `scripts/start-monitoring.sh` runs `docker compose -f docker-compose.monitoring.yml` from the scripts directory, but the compose file is in `monitoring/`. Always `cd monitoring` first or use absolute paths.
- Caddy maps host `9444:443` (not 8444 as documented in old AGENTS.md). The actual HTTPS port is 9444.
- SearXNG port is hardcoded to `8088:8080` in `docker-compose.yml` despite `.env.example` documenting `SEARXNG_PORT=8008`.
- Automated backup script at `scripts/backup/backup-volumes.sh` — run manually or schedule via cron. Large volumes (open-webui, clickhouse) may take minutes to compress.
- The `start_services.py` script does not validate `.env` before proceeding — missing secrets will cause silent container failures.
