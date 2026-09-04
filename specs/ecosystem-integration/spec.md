# local-ai-packaged — Integration Spec

## Status
active

## Rôle dans l'écosystème
local-ai-packaged fournit les **services AI locaux** de l'écosystème master-infra : Ollama (LLM local), Neo4j (graph database), Langfuse (observabilité LLM), Qdrant (vector store), et Supabase (Postgres, Kong API gateway, Studio, Auth). Ces services sont consommés par MCPInfra (knowledge_graph via Neo4j, vectorstore via Qdrant) et potentiellement par d'autres composants pour l'inférence locale.

local-ai-packaged est un **satellite ACOS v1.9.1**.

local-ai-packaged est un **provider d'infrastructure** (link_class: `infrastructure`) — consommé par les services runtime, **non routé via le hub**. Le Master Agent Control Plane est un système composite (UD-006) : REST surface (`:9999`) pour l'orchestration, MCP surface (`:8051`) pour la découverte d'outils. Les providers d'infrastructure sont consommés directement, pas routés via le hub. Le registre canonique des membres de l'écosystème est `.ssot/routing-table.json` (UD-009).

## Boundary contracts

| Contrat | Input | Output | API | Contraintes |
|---------|-------|--------|-----|-------------|
| Neo4j | Cypher queries | graph data | HTTP 8005 / Bolt 8006 | Utilisé par mcpinfra knowledge_graph |
| Qdrant | vector search | embeddings results | HTTP 8003 / gRPC 8004 | Utilisé par mcpinfra vectorstore |
| Ollama | LLM prompts | générations locales | HTTP (port 11434) | LLM local, pas de coût API |
| Langfuse | LLM traces | observabilité | HTTP (port 3002) | Tracing LLM |
| Supabase Kong API | HTTP requests | API endpoint | HTTP (port 18000) | Endpoint API pour archon-v2 (`SUPABASE_URL`) |
| Supabase Kong HTTPS | HTTPS requests | API endpoint HTTPS | HTTPS (port 18443) | TLS endpoint |
| Supabase Supavisor PG | PG connections | PostgreSQL pool | PG wire (port 5433) | Accès PostgreSQL via pooler (session mode) |
| Supabase Supavisor transaction | PG connections (transaction mode) | PostgreSQL pool | PG wire (port 6543) | Transaction mode pooling |
| Supabase Studio | UI | admin dashboard | HTTP (internal only) | Non exposé externement |
| Supabase PostgreSQL | SQL queries | database | PG wire (internal only) | Non exposé externement |
| n8n | workflows | automation | HTTP (port 8002) | Low-code workflows |
| Open WebUI | UI | chat interface | HTTP (port 8050) | Interface chat LLM |
| Flowise | chatflows | flow builder | HTTP (port 8001) | Chatflow configurations |
| SearXNG | search queries | search results | HTTP (port 8008) | Meta-search engine |
| Caddy | HTTP/HTTPS | reverse proxy | HTTP 8081 / HTTPS 8444 | Reverse proxy avec TLS |

## Dependencies

| Projet | Service | Port | Contrat |
|--------|---------|------|---------|
| mcpinfra | Neo4j | 8005/8006 | `bolt://neo4j:7687` pour knowledge_graph |
| mcpinfra | Qdrant | 8003/8004 | vectorstore backend |
| mcpinfra | `local-ai-packaged-mcp` | 8409 (host) → 8000 (container), profile `lai-us5` | MCP server wrapper (container `mcpinfra-local-ai-packaged-mcp-1`) |
| docker-infrastructures | (shared network) | — | Réseau Docker partagé |
| archon-v2 | Supabase Kong | 18000 | `SUPABASE_URL=http://host.docker.internal:18000` (documenté dans AGENTS.md) |

## ACOS integration
- **Satellite** : oui, v1.9.1
- **Personalized** : 1 spec interne
- **Entrypoints pertinents** : `1460-integrate-project`, `0660-sync`

## Runtime

| Service | Port | Healthcheck | Notes |
|---------|------|-------------|-------|
| Neo4j | 8005 (HTTP), 8006 (Bolt) | `curl /` | Graph database |
| Qdrant | 8003 (HTTP), 8004 (gRPC) | `curl /` | Vector store |
| Ollama | 11434 | `curl /api/tags` | LLM local |
| Langfuse | 3002 | `curl /api/public/health` | LLM observabilité |
| Supabase (suite complète) | Kong 18000, Kong HTTPS 18443, Supavisor PG 5433, Supavisor transaction 6543, Studio (internal), PostgreSQL (internal) | `curl http://localhost:18000` | Postgres, Kong API gateway, Studio, Auth — separate compose file (`supabase/docker/docker-compose.yml`), commented out in main docker-compose.yml |
| n8n | 8002 | `curl /healthz` | Low-code workflows |
| Open WebUI | 8050 | `curl /` | Interface chat LLM |
| Flowise | 8001 | `curl /` | Chatflow configurations |
| SearXNG | 8008 | `curl /` | Meta-search engine |
| Caddy | 8081 (HTTP), 8444 (HTTPS) | `curl /` | Reverse proxy avec TLS |

Réseau : `ai_network`, `mcpinfra` (external).

## Known issues
1. **Ollama models** : à pré-puller pour éviter cold start.
2. **Neo4j initialization** : schema à initialiser pour mcpinfra knowledge_graph.
3. **Langfuse integration** : pas encore wireé dans tous les composants LLM.
4. **8 test files** détectés.
5. **MCP wrapper container not running (Wave 4 audit, 2026-09-04)** :
   `mcpinfra-local-ai-packaged-mcp-1` is NOT running (absent from `docker ps`
   output). The wrapper is gated behind the `lai-us5` profile and must be started
   explicitly:
   `docker compose --profile lai-us5 up -d local-ai-packaged-mcp`.
   Not started in this wave — noted as a known issue per audit rules.
6. **Catalog entry confirmed (Wave 4 audit, 2026-09-04)** : Catalog entry
   `local-ai-packaged-mcp` exists in
   `mcpinfra/catalog_entries/local_ai_packaged.json` (v1.0.0,
   `server_type: "tool"`, `pre_provisioned: false`, `trust_level: "trusted"`).
   No duplicate found. The entry is internal to the mcpinfra catalog and
   correctly references this project's MCP server (SSE transport, port 8000).
7. **Supabase dans un compose file séparé** : Supabase est présent dans `supabase/docker/docker-compose.yml` (documenté dans les boundary contracts ci-dessus), mais **commenté out par défaut** dans le `docker-compose.yml` principal. Nécessite uncomment + plus de RAM pour démarrer.
8. **Port consistency entre spec et compose defaults** : les ports ont été alignés sur les compose defaults (Neo4j `:8005/8006`, Qdrant `:8003/8004`, Langfuse `:3002`). Vérifier que les compose files restent en sync avec cette spec.
9. **Référence au registre canonique** : le registre canonique des membres de l'écosystème est `.ssot/routing-table.json` (UD-009). local-ai-packaged y est listé comme `infrastructure`, `routable: false` (consommé, non routé via le hub).

## FR-017 compliance status (Wave 1 A3 audit, 2026-08-31)

**FR-017 (Infrastructure socle)** : ✅ COMPLIANT — tous les services requis (Ollama, Neo4j, Langfuse, Qdrant, n8n, Caddy) sont présents et consommés, pas recréés par le pipeline.

**D-CYCLE-004 (WSL2 hardening)** : ❌ NON-COMPLIANT — 2 violations dans `docker-compose.yml` (base file) :

1. **4 services sans `mem_limit`** (D-CYCLE-004) :
   - `ollama-gpu` (L607-616) — hérite de `x-ollama` anchor mais override `deploy.resources` sans `limits.memory`
   - `ollama-pull-llama-cpu` (L626-630) — hérite de `x-init-ollama` anchor, aucun `deploy.resources`
   - `ollama-pull-llama-gpu` (L632-636) — hérite de `x-init-ollama` anchor, aucun `deploy.resources`
   - `ollama-pull-llama-gpu-amd` (L638-643) — hérite de `x-init-ollama` anchor, aucun `deploy.resources`
2. **2 services avec `restart: always`** (D-CYCLE-004) :
   - `neo4j` (L298) — `restart: always`
   - `langfuse-web` (L397) — `restart: always`

**Mitigation partielle** : `docker-compose.override.yml` corrige ces violations (ollama-gpu→512M, neo4j→on-failure:3, langfuse-web→on-failure:3, ollama-pull-llama-*→64M), mais le fichier **base** `docker-compose.yml` reste non-compliant. La conformité D-CYCLE-004 exige que le fichier base soit compliant (un override ne garantit pas la conformité si l'override n'est pas appliqué).

**Référence audit** : `AGENT_REPORTS/2026-08-31/auto-improve/wave-1/A3-infrastructure-routage-diagnose.md` (lines 62-63, 2.11-2.12).

## Références
- `local-ai-packaged/.ssot/status.md`
- `local-ai-packaged/specs/` (1 spec interne)
- `local-ai-packaged/README.md`
- `.ssot/routing-table.json` (UD-009 — canonical member registry, local-ai listé comme `infrastructure`, `routable: false`)
