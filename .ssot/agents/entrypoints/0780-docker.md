---
description: Docker compose lifecycle with mutation gates
personalized: true
---

<!-- ACOS-ORIENTATION:START -->
> **Orientation**: Read `.ssot/context-index.md`, `.ssot/status.md`, and
> `.ssot/handoff.md` before proceeding. Full reference:
> `.ssot/agents/context/orientation.md`.
<!-- ACOS-ORIENTATION:END -->

Manage the project's Docker compose lifecycle.

**Project-specific compose layout (local-ai-packaged)**: this project ships six compose files,
not one — `docker-compose.yml` (base, 15+ services: Ollama, Open WebUI, n8n, Flowise, Qdrant,
Neo4j, SearXNG, Langfuse + backing services, Caddy), `docker-compose.minimal.yml` (reduced
footprint override), `docker-compose.override.yml`, `docker-compose.override.private.yml`,
`docker-compose.override.public.yml`, and `docker-compose.override.public.supabase.yml`
(Supabase is disabled by default — the project uses a cloud instance from `archon-v2`; only
compose it in deliberately). Always ask or infer from `.ssot/status.md`/`.ssot/handoff.md`
which combination applies before running `-f` chains — `docker compose config --quiet` against
the wrong combination silently validates the wrong graph. The custom MCP server image
(`Dockerfile.mcp`) builds via `docker buildx bake --load` (`docker-bake.hcl`), not `docker
compose build`. Services join the external network `ai_network` (`laip_ai_network` alias) —
`docker network create ai_network` must exist first if starting fresh; `start_services.py`
wraps the common startup sequence.

1. Detect `docker-compose.yml` or `compose.yaml` in the project root. If neither exists, skip with a note.
2. Determine the requested action from the user's prompt:
   - **Read-only** (no mutation gate): `logs`, `health` (healthcheck status), `config validate` (`docker compose config --quiet`).
   - **Mutating** (requires explicit user confirmation): `up`, `down`, `rebuild`, `restart`.
3. For mutating actions, state exactly what will run and wait for explicit user approval before executing. Never run `up` or `rebuild` without confirmation.
4. For read-only actions, run directly and report output.
5. Boundary with `maintenance.infrastructure` (`0680-infra`): that entrypoint discovers **external** read-only infrastructure (LAN hosts, remote Docker). This entrypoint manages the **project's own** compose stack. Do not confuse the two.
6. Produce a summary of the action taken, containers affected, and their health status.
7. Do not push images, deploy to registries, or touch external infrastructure — those require `delivery.ship` authority.
