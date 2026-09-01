# Decision Log

Record accepted decisions as stable entries containing date, status, context, decision, consequences, and superseded decision IDs. Do not record ordinary implementation details as architecture decisions.

---

## D-001 — Supabase disabled in main compose

- **Date**: 2026-04-14
- **Status**: accepted
- **Context**: The project originally included a local Supabase stack via
  `include: ./supabase/docker/docker-compose.yml` in the main compose file.
  However, `archon-v2` (a sibling project in the `master-infra` ecosystem)
  already provisions a cloud Supabase instance. Running both creates redundancy,
  port conflicts, and doubles resource consumption.
- **Decision**: Comment out the Supabase `include:` directive in
  `docker-compose.yml`. The local Supabase stack remains available as a
  standalone option (`supabase/docker/docker-compose.yml`) but is not started
  by default. The project uses the cloud Supabase instance from `archon-v2`.
- **Consequences**: `start_services.py` still clones and starts the Supabase
  repo, but the main compose no longer includes it. Port mapping D18-C is
  documented for reference but not active in the default deployment.

## D-002 — Port mapping D18-C (Supabase)

- **Date**: 2026-04-19
- **Status**: accepted (reference only — Supabase disabled per D-001)
- **Context**: Supabase services needed unique host ports to avoid conflicts
  with other projects in the `master-infra` ecosystem (mcpinfra, archon-v2,
  Zitadel, Weaviate).
- **Decision**: Assign Supabase ports as follows:
  - Kong API gateway: 18000 → 8000 (later changed to 8030 in `.env.example`)
  - Kong HTTPS: 18443 → 8443 (later changed to 8443)
  - Supavisor (PG pool): 5433 → 5432
  - Supavisor transaction: 6543 → 6543
  - Studio: internal only (no host bind, accessed via Kong)
  - PostgreSQL DB: internal only (direct access within Docker network)
- **Consequences**: `archon-v2` connects to Supabase via
  `http://host.docker.internal:8030` (Kong) and `host.docker.internal:5433`
  (Supavisor pool). These ports are documented in `.env.example` and
  `AGENTS.md` but are only active when local Supabase is started standalone.

## D-003 — ClickHouse Keeper port correction

- **Date**: 2026-07-17
- **Status**: accepted
- **Context**: `clickhouse-config/config.xml` pointed to `localhost:2181` for
  ZooKeeper coordination, but ClickHouse Keeper (the bundled ZooKeeper
  replacement) listens on port `9181`. This caused Langfuse ClickHouse
  migrations to fail (migration 35 used `ON CLUSTER default` which requires
  Keeper).
- **Decision**: Change the ZooKeeper port in `config.xml` from `2181` to `9181`
  to match the Keeper `tcp_port` setting.
- **Consequences**: ClickHouse Keeper election succeeds, Langfuse migrations
  35 and 36 apply correctly. A pre-existing bug in `keeper.xml`
  (`localhost:9181` raft config conflicting with `keeper_server.tcp_port=9181`)
  remains but is non-blocking.

## D-004 — Resource optimization (~20 GB → ~8.5 GB)

- **Date**: 2026-07-17
- **Status**: accepted
- **Context**: The default `docker-compose.yml` allocates ~20 GB of memory
  across all services (1 GB each for 15+ services). This exceeds the capacity
  of development hosts with 8–16 GB RAM, causing OOM crashes (especially
  Langfuse-web with Next.js V8 heap exhaustion).
- **Decision**: Create `docker-compose.minimal.yml` with reduced CPU and memory
  limits calibrated against actual usage measurements. Total allocation reduced
  to ~8.5 GB. Also adds `NODE_OPTIONS=--max-old-space-size` for Node.js
  services and swaps the private Open WebUI image for the public one.
- **Consequences**: Services run within 8 GB RAM hosts. Real usage is well
  below limits (e.g. Flowise uses 377 MB of 768 MB limit, n8n uses 238 MB of
  512 MB). Langfuse-web remains unhealthy due to healthcheck endpoint issues,
  not resource limits.

## D-005 — 0840 Docker build standards applied

- **Date**: 2026-08-22
- **Status**: accepted
- **Context**: The MCP server Dockerfile was a single-stage build with no
  cache mounts, no `.dockerignore`, and no bake configuration. Build context
  was ~2.3 GB because it included the entire project directory.
- **Decision**: Apply the 0840 docker-build-standards to `Dockerfile.mcp`:
  - Multi-stage build (deps + runner stages)
  - Cache mounts for apt and pip
  - Non-root user (uid 1001)
  - Pinned `requirements.txt` dependencies
  - Create `.dockerignore` (126 lines, reduces context to ~19 KB)
  - Create `docker-bake.hcl` with `mcp-server` target
  - Audit and pin `:latest` tags in `docker-compose.yml`
- **Consequences**: Build times reduced via layer caching. Build context
  reduced from ~2.3 GB to ~19 KB. Image runs as non-root user. All custom
  image builds go through `docker buildx bake`.

## D-006 — Image version pins

- **Date**: 2026-08-22
- **Status**: accepted
- **Context**: Most services in `docker-compose.yml` used `:latest` tags,
  making deployments non-reproducible and susceptible to breaking changes.
- **Decision**: Pin all upstream images to specific versions:
  - n8n: `1.81.0`
  - Ollama: `0.32.14`
  - Flowise: `3.1.4`
  - Qdrant: `v1.18.3`
  - Neo4j: `5.26.29`
  - ClickHouse: `25.8.28.1`
  - MinIO: `RELEASE.2025-09-07T16-13-09Z`
  - Postgres: `17-alpine`
  - Valkey: `8-alpine`
  - SearXNG: `2026.8.5-1689cb1b5`
  - Caddy: `2-alpine`
  - Langfuse: `3` (major version pin, minor updates accepted)
- **Consequences**: Deployments are reproducible. Version bumps require
  explicit changes to `docker-compose.yml`. Some images (Langfuse `3`,
  Caddy `2-alpine`) use major-version tags where minor updates are
  considered safe.

## D-007 — Entrypoint personalization (1220-personalize, entrypoint-body cycle)

- **Date**: 2026-08-30
- **Status**: accepted
- **Context**: A prior `1220-personalize` run (commit `b49dfe6`, 2026-08-23) populated
  project-specific SSOT documents (`architecture.md`, `infrastructure.md`,
  `constitution.md`, `decisions.md`) but left every entrypoint body at the generic ACOS
  template — 0/65 entrypoints carried `personalized: true`, and `0020-resume.md` (the
  entrypoint invoked at the start of every session) contained no project-specific
  orientation, diagnostic commands, or ecosystem-satellite guidance.
- **Decision**: Personalize the active-cycle entrypoint bodies for this Docker-Compose
  infrastructure project (no test suite; Docker Compose validity + container health is the
  verification signal):
  - `0020-resume.md` — added a "Project-specific orientation" section (compose validity
    checks, MCP server build command, registry, ecosystem-satellite pointer to the parent's
    status, and a note that `.ssot/agents/runtimes.json` still holds the stale template
    `fabric-staging` example rather than a real runtime) and pointed step 6's generic
    "environment checks" at the concrete `docker compose config --quiet` command.
  - `1020-handoff.md` — added a project-specific verification paragraph requiring
    `docker compose config --quiet` (and container health where relevant) instead of a
    generic test-suite claim.
  - `0780-docker.md` — documented the project's actual six-compose-file layout (base,
    minimal, four overrides incl. the disabled Supabase override), the `docker buildx bake`
    build path for the custom MCP image, and the `ai_network` external network requirement.
  - All three now carry `personalized: true` in frontmatter, protecting body + description
    from `acos-migrate --reconcile --apply --refresh-bodies` template overwrite.
  - Deterministic script `ssot-personalization.mjs --focus entrypoints` produced zero
    mechanical recommendations (it does not deep-analyze entrypoint body content) —
    confirming this pass was agent-judgment-led per the 1220-personalize procedure.
  - Left `0680-infra.md` untouched (correctly reports infrastructure as unconfigured — no
    `.ssot/infrastructure-profile.json` exists) and did not touch the stale
    `.ssot/agents/context/CLAUDE.src.md` "My Project" placeholder or the stale
    `fabric-staging` runtimes.json entry, both flagged by the deterministic scan but out of
    scope for this entrypoint-focused pass — noted here for a future personalization run.
- **Consequences**: `0020-resume`, `1020-handoff`, and `0780-docker` now give an agent
  concrete, evidence-based project commands instead of generic ACOS boilerplate. Future
  `acos-migrate --reconcile --apply --refresh-bodies` runs will preserve these three bodies.
  Remaining personalization gaps (CLAUDE.src.md placeholder, stale runtimes.json example)
  are deferred, not silently dropped.
