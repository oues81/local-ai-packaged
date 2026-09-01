# ecosystem-integration — Quality Checklist

## Feature ID

`ecosystem-integration`

## Status

- **Spec phase**: checklist
- **Last updated**: 2026-08-31

## Completeness

- [x] Every requirement in `spec.md` (boundary contracts, runtime matrix, ACOS integration) has an acceptance criterion or verification method.
- [x] Every acceptance criterion has a verification method (recorded in `plan.md` Verification and each task's Acceptance field).
- [x] All known failure modes are documented (Known issues #1–#4 in `spec.md`: Ollama cold start, Neo4j schema init, Langfuse not fully wired, 8 test files).
- [x] Dependencies and blockers are explicit (Wave 1 A3 diagnose, ACOS harness, override file mitigation).
- [x] FR-017 (infrastructure socle) is proven compliant: all 6 required services present and consumed.
- [ ] D-CYCLE-004 (WSL2 hardening) is NON-COMPLIANT: 4 services without mem_limit, 2 services with `restart: always` in base `docker-compose.yml`. Fix documented in tasks.md (T-FIX1, T-FIX2) for next wave.

## Clarity

- [x] Boundary contracts name input, output, API, and constraints for each service (Neo4j, Qdrant, Ollama, Langfuse).
- [x] Runtime matrix names service, port, healthcheck, and notes for each service.
- [x] No ambiguous pronouns or undefined terms in acceptance criteria — each verification command is explicit.
- [x] Scope and non-goals are distinguishable: scope = lifecycle artifact creation and compliance documentation; non-goals = modifying docker-compose.yml (this wave), pushing to remote, modifying files outside local-ai-packaged.

## Consistency

- [x] `spec.md`, `plan.md`, `tasks.md`, and `checklist.md` do not contradict each other — FR-017 compliant, D-CYCLE-004 non-compliant status is consistent across all artifacts.
- [x] Terminology matches repository conventions: "deploy.resources.limits.memory" (Compose v3), "laip_" prefix, "ai_network" external network, "satellite ACOS v1.9.1".
- [x] Stable IDs and file references are correct: 4 services without mem_limit, 2 with restart: always verified via grep; line numbers match actual file.
- [x] Task IDs follow the `EI-T0XX` convention; plan phases map 1:1 to task clusters.

## Security

- [x] Trust boundaries are identified: Caddy (reverse proxy / TLS), Neo4j (auth), Langfuse (observability), Ollama (local only).
- [x] Input validation, auth, and authz are covered in boundary contracts (Neo4j auth, Caddy TLS).
- [x] No credentials or secrets are written to specs or plans — port numbers and service names only; no passwords, tokens, or private keys.
- [x] `cap_drop: ALL` conventions documented for caddy, redis, searxng in architecture.md.

## Tests

- [x] FR-017 verification: all 6 required services present in `docker-compose.yml` (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy).
- [ ] D-CYCLE-004 (mem_limit) verification: `grep -c "mem_limit" docker-compose.yml` — currently 0, target ≥ 4 after fix.
- [ ] D-CYCLE-004 (restart) verification: `grep -c "restart: always" docker-compose.yml` — currently 2, target 0 after fix.
- [x] ACOS integrity: `npx --no-install acos --check` (no harness sources touched, but run to confirm no drift).
- [x] Test commands are recorded and runnable: all checks use `grep` forms that are copy-paste executable.

## Docker-specific checks

- [ ] Every service has a memory limit (D-CYCLE-004) — NON-COMPLIANT: 4 Ollama services missing mem_limit in base file.
- [x] Every service has a `healthcheck` block (architecture.md convention) — all services have healthchecks.
- [ ] No `restart: always` policy (D-CYCLE-004) — NON-COMPLIANT: neo4j (L298) and langfuse-web (L397) use `restart: always`.
- [x] `cap_drop: ALL` where possible (caddy, redis, searxng).
- [x] External network `ai_network` used for inter-service communication.
- [x] Profile system for Ollama (cpu / gpu-nvidia / gpu-amd / none).

## Sign-off

- [x] Spec reviewed: 2026-08-31
- [x] Plan reviewed: 2026-08-31
- [x] Checklist completed: 2026-08-31
- [ ] D-CYCLE-004 compliance: PENDING fix wave (T-FIX1, T-FIX2)
